class ParseAbiSeqDataJob
  include Sidekiq::Worker

  def perform(dataset_id)
    dataset = Dataset.find dataset_id

    if dataset.data_type != 'sanger_sequence' || dataset.attachments.empty? || dataset.attachments[0]['key'].nil?
      return
    end

    attachment = dataset.attachments[0]
    s3_stream = S3Helper.instance.read(attachment["bucket"], attachment["key"])

    data = {}

    begin
      Zip::Archive.open_buffer(s3_stream) do |ar|
        ar.each do |e|
          next unless e.name.ends_with?(".ab1") and not e.name.starts_with?("__MAC")

          ar.fopen(e.name) do |f|
            seq = ABSee.new()
            seq.read(StringIO.new(f.read))
            data[e.name] = {
              a: seq.get_traceA(),
              g: seq.get_traceG(),
              c: seq.get_traceC(),
              t: seq.get_traceT(),
              called: seq.get_calledSequence(),
              quality: seq.get_qualityScores(),
              peaks: seq.get_peakIndexes()
            }
          end
        end
      end
    rescue Zip::Error
      Rails.logger.warn "Unable to process AbiSeqData: #{e}"
      return
    end

    dataset.update!(data: data)
  end
end
