module QueryManager
  module_function

  DEFAULT_QUERIES = [
    {
      id: "all_runs",
      label: "All Runs",
      columns: {
        only: [ :id, :title, :status ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, _|
        Run.where(project_id: project.id).as_json(columns)
      end
    },
    {
      id: "active_runs",
      label: "In-Progress Runs",
      columns: {
        only: [ :id, :title, :status ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, _|
        Run.where(project_id: project.id, status: [ :in_progress ]).as_json(columns)
      end
    },
    {
      id: "all_datasets",
      label: "All Datasets",
      columns: {
        only: [ :id, :title, :data_type, :device_id, :created_at ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, _|
        datasets = Dataset.where_in_project(project.id)
                          .select(columns[:only] + [ :warp_id, :instruction_id ])

        # Instead of join instruction: :warp, to find the device id, which is expensive
        # for large numbers of datasets, we manually find the warps and inject them into the results.
        warps = Warp.where(id: datasets.map(&:warp_id))
                    .or(Warp.where(instruction_id: datasets.map(&:instruction_id)))
                    .select(:id, :instruction_id, :device_id)

        warp_id_to_warp        = warps.map { |w| [ w.id, w ] }.to_h
        instruction_id_to_warp = warps.map { |w| [ w.instruction_id, w ] }.to_h

        datasets.each do |ds|
          next if !ds.device_id.nil?

          warp = warp_id_to_warp[ds.warp_id] || instruction_id_to_warp[ds.instruction_id]
          ds.device_id = warp.try(:device_id)
        end

        datasets.as_json(columns)
      end
    },
    {
      id: "all_aliquots",
      label: "All Aliquots Used In Runs",
      columns: {
        only: [ :id, :name, :container_id, :created_by_run_id, :created_at ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, _|
        run_ids       = Run.where(project_id: project.id).pluck(:id)
        container_ids = Container.joins(:refs).where(refs: { run_id: run_ids }).pluck(:id)

        # Since this can be very large we try to optimize the best we can.
        # Doing this all in one query with multiple joins seems to be slower than splitting
        # up the query.  Probably has to do with join '*' huge runs.
        Aliquot.where(container_id: container_ids)
               .select(columns[:only])
               .as_json(columns)
      end
    },
    {
      id: "all_containers",
      label: "All Containers Used In Runs",
      columns: {
        only: [ :id ],
        methods: [ :aliquot_count, :container_type_shortname ],
        include: []
      },
      query: lambda do |columns, project, _|
        run_ids = Run.where(project_id: project.id).pluck(:id)

        Container.select("DISTINCT ON (containers.id) containers.*")
                 .joins(:refs)
                 .where(refs: { run_id: run_ids })
                 .order(:id)
                 .as_json(columns)
      end
    },
    {
      id: "all_notebooks",
      label: "All Notebooks",
      columns: {
        only: [ :id, :name, :created_at, :updated_at ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, _|
        Notebook.where(project_id: project.id).as_json(columns)
      end
    },
    {
      id: "my_notebooks",
      label: "My Notebooks",
      columns: {
        only: [ :id, :name, :created_at, :updated_at ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, user|
        Notebook.where(project_id: project.id, user_id: user.id).as_json(columns)
      end
    },
    {
      id: "others_notebooks",
      label: "Others' Notebooks",
      columns: {
        only: [ :id, :name, :created_at, :updated_at ],
        methods: [],
        include: []
      },
      query: lambda do |columns, project, user|
        Notebook.where(project_id: project.id).where.not(user_id: user.id).as_json(columns)
      end
    }
  ].freeze

  def execute(query_id, project, user)
    query = DEFAULT_QUERIES.find { |q| q[:id] == query_id }

    {
      columns: query[:columns].values.flatten,
      rows: query[:query].call(query[:columns], project, user)
    }
  end
end
