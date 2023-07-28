class SlackMessageForProgramLifecycleJob
  include Sidekiq::Worker

  CHANNEL = '#program-logs'

  def perform(type, id)
    payload =
      case type
      when 'program_create'
        program_create_payload(id)
      when 'program_execution_create'
        program_execution_create_payload(id)
      when 'program_execution_start'
        program_execution_start_payload(id)
      when 'program_execution_complete'
        program_execution_complete_payload(id)
      end

    if payload.nil?
      return
    end

    SLACK_CLIENT.ping(payload)
  end

  def program_create_payload(program_id)
    program = Program.find(program_id)
    user = program.user

    {
      username: 'Program Created',
      icon_emoji: ':heavy_plus_sign:',
      channel: CHANNEL,
      attachments: [
        {
          color: '#4280f4',
          fields: [
            { title: 'Program name', value: program.name },
            { title: 'User name', value: user.name }
          ],
          fallback: "Program \"#{program.name}\" created by \"#{user.name}\"."
        }
      ]
    }
  end

  def program_execution_create_payload(execution_id)
    execution = ProgramExecution.find(execution_id)
    program   = execution.program
    run       = execution.run || execution.instruction.run
    inst_num  = execution.instruction ? execution.instruction.sequence_no : 'n/a'
    user      = execution.user
    url       = create_run_url(run)

    {
      username: 'Program Execution Created',
      icon_emoji: ':heavy_plus_sign:',
      channel: CHANNEL,
      attachments: [
        {
          color: '#4280f4',
          fields: [
            { title: 'Program name', value: program.name },
            { title: 'Run name', value: run.title },
            { title: 'Inst', value: inst_num },
            { title: 'User name', value: user.name },
            { title: 'Run url', value: url }
          ],
          fallback: "Program Execution \"#{program.name}\" acting on run \"#{run.title}\" created by \"#{user.name}\"."
        }
      ]
    }
  end

  def program_execution_start_payload(execution_id)
    execution = ProgramExecution.find(execution_id)
    program   = execution.program
    run       = execution.run || execution.instruction.run
    inst_num  = execution.instruction ? execution.instruction.sequence_no : 'n/a'
    user      = execution.user
    url       = create_run_url(run)

    {
      username: 'Program Execution Started',
      icon_emoji: ':arrow_forward:',
      channel: CHANNEL,
      attachments: [
        {
          color: '#4280f4',
          fields: [
            { title: 'Program name', value: program.name },
            { title: 'Run name', value: run.title },
            { title: 'Inst', value: inst_num },
            { title: 'User name', value: user.name },
            { title: 'Run url', value: url }
          ],
          fallback: "Program Execution \"#{program.name}\" acting on run \"#{run.title}\" started."
        }
      ]
    }
  end

  def program_execution_complete_payload(execution_id)
    execution = ProgramExecution.find(execution_id)
    program   = execution.program
    run       = execution.run || execution.instruction.run
    inst_num  = execution.instruction ? execution.instruction.sequence_no : 'n/a'
    user      = execution.user
    url      = create_run_url(run)
    duration = execution.completed_at - execution.started_at

    {
      username: 'Program Execution Completed',
      icon_emoji: ':heavy_check_mark:',
      channel: CHANNEL,
      attachments: [
        {
          color: '#4280f4',
          fields: [
            { title: 'Program name', value: program.name },
            { title: 'Run name', value: run.title },
            { title: 'Inst', value: inst_num },
            { title: 'User name', value: user.name },
            { title: 'Execution Time', value: "#{duration} seconds" },
            { title: 'Run url', value: url }
          ],
          fallback: "Program Execution \"#{program.name}\" acting on run \"#{run.title}\" completed."
        }
      ]
    }
  end

  def create_run_url(run)
    project   = run.project
    subdomain = project.organization.subdomain
    url_helpers = Rails.application.routes.url_helpers
    url_helpers.organization_project_run_url(subdomain, project.id, run.id)
  end

end
