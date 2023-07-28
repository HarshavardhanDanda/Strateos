require 'idt'

class OrderOutstandingSequencesJob

  include Sidekiq::Worker

  PURIFICATION_ID = {
    'standard' => 1036, # 'Standard Desalting',
    'page'     => 1037, # 'PAGE Purification',
    'hplc'     => 1038  # 'HPLC Purification'
  }

  PRODUCT_ID = {
    '10nm'  => 2618, # '10 nm DNA Plate Oligo'
    '25nm'  => 1213, # '25 nmole DNA Oligo',
    '100nm' => 1,    # '100 nmole DNA Oligo',
    '250nm' => 1407, # '250 nmole DNA Oligo',
    '1um'   => 1114  # '1 umole DNA Oligo',
  }
  OLIGO_PLATE_PRODUCT_ID = 1132 # 96-well Plate

  # ids for scale that can be used in plate format
  PLATE_SCALE = [ '10nm' ]

  MODIFICATIONS = {
    "5' Amino Modifier C12" => '/5AmMC12/',
    "5' Amino Modifier C6"  => '/5AmMC6/',
    "5' Biotin"             => '/5Biosg/',
    "5' deoxyInosine"       => '/5deoxyI/',
    "5' deoxyUridine"       => '/5deoxyU/',
    "5' Phosphorylation"    => '/5Phos/'
  }

  def format_gblock_tube(gblock)
    {
      type: :gblock,
      data: {
        name:                    gblock['container_name'],
        sequence_to_manufacture: gblock['sequence']
      }
    }
  end

  def format_oligo_tube(oligo)
    {
      type: :oligo,
      data: {
        name:                    oligo['container_name'],
        sequence_to_manufacture: oligo['sequence'],
        purification_id:         PURIFICATION_ID[oligo['purification']],
        product_id:              PRODUCT_ID[oligo['scale']]
      }
    }
  end

  def format_oligo_plate(plate)
    name, oligos = plate
    {
      type: :plate,
      data: {
        name:                 name,
        product_id:           OLIGO_PLATE_PRODUCT_ID,
        purification_id:      PURIFICATION_ID['10nm'],
        plate_type:           'PCRPlate',
        loading_schema:       'Explicit',
        ship_remainders:      'DontShipRemainderInTubes',
        documentation_type:   'EmailDoc',
        amount_per_well_type: 'AmountInnm',
        shipping_option:      'DRY',
        wells: oligos.map do |oligo|
          oligo_well = format_oligo_tube(oligo)
          oligo_well[:data][:row] = (oligo.container_well / 12) + 1
          oligo_well[:data][:col] = (oligo.container_well % 12) + 1
          oligo_well
        end
      }
    }
  end

  def select_operations(instructions, operation)
    instructions.flat_map do |instruction|
      if instruction.operation[operation]
        instruction.operation[operation].map { |op| [ op, instruction ] }
      else
        []
      end
    end
  end

  def segment_oligos(oligos)
    # plate_orders for runs with >= 24 oligos using plate ammenable scale
    oligos.group_by { |_oligo, instruction| instruction.run_id }
          .partition do |_, sequences|
            sequences.select { |seq, _ins| PLATE_SCALE.include? seq['scale'] }
                     .count >= 24
          end
  end

  # appends an IDT modification to the beginning of the sequence if 'modification'
  # is not nil, otherwise returns the unmodified sequence
  def sequence_for_oligo(sequence, modification)
    if modification
      if MODIFICATIONS[modification].nil?
        raise "Unknown oligo sequence modification #{modification} provided."
      end
      MODIFICATIONS[modification] + sequence
    else
      sequence
    end
  end

  # takes a list of instructions and returns a list of IdtSequences
  def partition_instructions(instructions)
    oligos  = select_operations(instructions, 'oligos')
    gblocks = select_operations(instructions, 'gblocks')
    plate_orders, tube_orders = segment_oligos(oligos)

    gblocks.map do |gblock, instruction|
      container_name, _well = Ref.parse_ref_string(gblock['destination'])
      IdtSequence.new({
        name:           gblock['destination'],
        order_type:     'gblock',
        format:         'tube',
        container_name: container_name,
        container_well: 0,
        instruction:    instruction
      })
    end +
      plate_orders.flat_map do |_run_id, plates|
        plates.map do |(oligo, instruction)|
          container_name, well = Ref.parse_ref_string(oligo['destination'])
          # applies 5' modification if present
          sequence = sequence_for_oligo(oligo['sequence'], oligo['modification'])
          IdtSequence.new({
            name:           oligo['destination'],
            order_type:     'oligo',
            format:         'plate',
            purification:   oligo['purification'],
            scale:          oligo['scale'],
            sequence:       sequence,
            container_name: container_name,
            container_well: well.to_i,
            instruction:    instruction
          })
        end
      end +
      tube_orders.flat_map do |_, tubes|
        tubes.map do |oligo, instruction|
          container_name, _well = Ref.parse_ref_string(oligo['destination'])
          # applies 5' modification if present
          sequence = sequence_for_oligo(oligo['sequence'], oligo['modification'])
          IdtSequence.new({
            name:           oligo['destination'],
            order_type:     'oligo',
            format:         'tube',
            purification:   oligo['purification'],
            scale:          oligo['scale'],
            sequence:       sequence,
            container_name: container_name,
            container_well: 0,
            instruction:    instruction
          })
        end
      end
  end

  def create_order(instructions)
    lab = instructions.first.run.lab
    order = IdtOrder.create!(purchase_order: IDT.configuration.purchase_order, lab: lab)
    order.idt_sequences = partition_instructions(instructions)
    order
  end

  def order_list(order)
    order.gblock_tubes.map { |gblock| format_gblock_tube(gblock) } +
      order.oligo_tubes.map  { |oligo| format_oligo_tube(oligo) } +
      order.oligo_plates.map { |plate| format_oligo_plate(plate) }
  end

  # returns the order number or raises IDTError
  def place_order(order)
    billing = {
      country:           'US',
      organization_name: 'Transcriptic',
      contact_name:      'Operations',
      street_primary:    '3565 Haven Ave',
      street_secondary:  '',
      city:              'Menlo Park',
      state:             'CA',
      postal_code:       '94025',
      email:             'operations@transcriptic.com',
      phone:             '(650) 763-8432'
    }
    items = order_list(order)
    order_request = IDT::Orderer.new(billing).place_order(items)
    order_request['OrderNumber']
  end

  def order_outstanding
    # only order oligos for instructions with valid payment that can be started
    instructions = Instruction.outstanding_synthesis_requests.select do |ins|
      ins.run.billing_valid? && ins.run.can_start?
    end

    return if instructions.empty?

    instructions.each(&:start)

    order = create_order(instructions)

    # try to place the order 3 times
    begin
      retries ||= 0
      order_number = place_order(order)
    rescue IDT::RequestError
      (retries += 1) < 3 ? retry : raise
    end

    order.update!(order_number: order_number, order_placed_at: Time.now)
  end

  def perform
    order_outstanding
  end
end
