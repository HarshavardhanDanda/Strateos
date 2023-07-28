const dataset1 = {
  analysis_tool: 'analysis tool',
  analysis_tool_version: '1.1.0',
  attachments: [
    {
      bucket: 'strateos-staging-upload',
      key: 'ploads/3cb4a4f5-353e-47b5-b837-0a220825f53f/sample19.csv',
      name: 'sample19.csv'
    }
  ],
  created_at: '2022-05-02T15:22:25.852-07:00',
  data_type: 'file',
  deleted_at: null,
  id: 'd1gz28yexavtr9',
  instruction_id: null,
  is_analysis: true,
  run_id: 'r1ezzv9tpqrq23',
  title: 'sample19.csv',
  uploaded_by: 'u18dcbwhctbnj',
  warp_id: null,
};

const dataset2 = {
  analysis_tool: 'PostRunContainerSummary',
  analysis_tool_version: '1.0',
  attachments: [
    {
      bucket: 'transcriptic-uploads',
      key: 'uploads/29f17135-edf2-40b3-bf13-7ca5e8ed3312/post_run_container_summary_files.zip',
      name: 'post_run_container_summary_files.zip'
    }
  ],
  created_at: '2020-10-28T12:56:22.032-07:0',
  data_type: 'file',
  deleted_at: null,
  id: 'd1f24v4wvkxjk4',
  instruction_id: null,
  is_analysis: true,
  run_id: 'r1ezzv9tpqrq23',
  title: 'post_run_container_summary_files',
  uploaded_by: 'u18dcbwhctbnj',
  warp_id: null,
};

const dataset3 = {
  created_at: '2020-10-28T12:56:22.032-07:0',
  data_type: 'file',
  deleted_at: null,
  deletion_requested: false,
  id: 'd1f24v4wvkxtyu',
  instruction_id: null,
  is_analysis: false,
  run_id: 'r1ezzv9tpqrq23',
  title: 'post_run_container_summary_files',
  uploaded_by: 'u18dcbwhctbnj',
  warp_id: null,
};

const dataset4 = {
  created_at: '2020-10-28T12:56:22.032-07:0',
  data_type: 'file',
  deleted_at: null,
  deletion_requested: false,
  id: 'd1f24v4wvkxjk4',
  instruction_id: null,
  is_analysis: false,
  run_id: 'r1ezzv9tpqrq23',
  title: 'post_run_container_summary_files',
  uploaded_by: 'u18dcbwhctbnj',
  warp_id: null,
};

const datasets = [
  dataset1,
  dataset2,
  dataset3,
  dataset4
];
const user = {
  id: 'u18dcbwhctbnj',
  name: 'john doe',
  email: 'jdoe@transcriptic.com',
  lastSignInIp: '0.0.0.0',
  createdAt: '2020-05-27T09:16:16.522-07:00'
};
const run = { datasets };

export { datasets, user, run };
