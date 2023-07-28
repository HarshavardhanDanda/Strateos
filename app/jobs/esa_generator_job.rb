class EsaGeneratorJob
  include Sidekiq::Worker

  def perform(run_id, instruction_ids)
    Rails.logger.info("Started EsaGeneratorJob for run: #{run_id}, instruction_ids: #{instruction_ids}")

    if Rails.env.test?
      return
    end

    run = Run.includes(:project).find(run_id)
    instructions = run.instructions.find(instruction_ids)

    esa = ExecutionSupportArtifact.generate(run, instructions)

    Rails.logger.info(
      "Completed EsaGeneratorJob for run: #{run_id}, instruction_ids: #{instruction_ids}. Generated esa_id: #{esa.id}"
    )
  end
end
