class Warp < ApplicationRecord
  has_snowflake_id('w')
  # setting interval type to be cast as `interval`. Rails added support to postgres `interval` field and the string
  # representation doesn't match the previous representation anymore.
  attribute :nominal_duration, :interval
  attribute :min_duration, :interval
  attribute :max_duration, :interval

  has_one :dataset
  belongs_to :run
  belongs_to :instruction
  has_many :warp_events, -> { order 'created_at asc' }

  # For our analytics job
  scope :completed_last_Ndays, lambda { |num_days|
    where(state: "Completed").where("completed_at > ?", Time.now - num_days.days)
  }

  after_save lambda {
    if self.state == 'Running'
      ensure_instruction_started
    end
  }

  def ensure_instruction_started
    # This existential check for instruction is defensive code, not sure if its necessarily needed
    if instruction
      if instruction.started_at
        return
      end

      instruction.start!
    end
  end

  def complete!
    if dataset and instruction_id and not dataset.instruction_id
      dataset.instruction_id = instruction_id
      dataset.save!
    end

    if instruction && instruction.started_at.nil?
      instruction.start!
    end
    update completed_at: Time.now
  end

  def nominal_duration
    build_legacy_duration(read_attribute(:nominal_duration))
  end

  def min_duration
    build_legacy_duration(read_attribute(:min_duration))
  end

  def max_duration
    build_legacy_duration(read_attribute(:max_duration))
  end

  private

  def build_legacy_duration(interval)
    parts = interval&.parts
    # using this here to ensure we don't overflow the hour portion of it, as we would if were to cast into hour format.
    # also forcing it to have 6 significant decimal digits to try to be as close as possible to previous behavior
    # https://stackoverflow.com/questions/4175733/convert-duration-to-hoursminutesseconds-or-similar-in-rails-3-or-ruby
    if parts.present?
      format("%02d:%02d:%09.6f", parts.fetch(:days, 0) * 24 + parts.fetch(:hours, 0), parts.fetch(:minutes, 0),
             parts.fetch(:seconds, 0))
    end
  end
end
