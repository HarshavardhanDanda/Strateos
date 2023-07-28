export const singleRun = {
  data: {
    id: 'r1f9rbf4eyaf6e',
    type: 'runs',
    links: { self: '/api/runs/r1f9rbf4eyaf6e' },
    attributes: {
      created_at: '2021-01-05T12:08:46.550-08:00',
      accepted_at: '2021-01-05T12:08:46.545-08:00',
      started_at: '2021-01-08T13:48:10.918-08:00',
      completed_at: null,
      test_mode: false,
      status: 'aborted',
      friendly_status: 'Aborted',
      progress: 22,
      title: 'wc6_workout_2021-01-05',
      project_id: 'p1f9rbdmqxcm74',
      internal_run: true,
      owner_id: 'u1cbax5jcv4jz',
      pending_shipment_ids: [],
      'billing_valid?': true,
      protocol_id: null,
      success: null,
      success_notes: null,
      reject_reason: null,
      reject_description: null,
      successors_deep: []
    }
  },
  included: [{
    id: 'u1cbax5jcv4jz',
    type: 'users',
    links: { self: '/api/users/u1cbax5jcv4jz' },
    attributes: {
      created_at: '2019-01-02T12:02:46.787-08:00',
      email: 'thiga@transcriptic.com',
      feature_groups: ['pricing_breakdown', 'can_submit_autoprotocol', 'can_upload_packages', 'can_view_notebooks', 'can_delete_datasets'],
      first_name: 'Trissha',
      is_developer: true,
      last_name: 'Higa',
      name: 'Trissha Higa',
      profile_img_url: null,
      updated_at: '2021-01-08T16:15:43.050-08:00'
    }
  }]
};

export const multipleRuns = {
  data: {
    id: 'r1fahe7vjffszc',
    type: 'runs',
    links: { self: '/api/runs/r1fahe7vjffszc' },
    attributes: {
      created_at: '2021-01-12T12:52:12.120-08:00',
      accepted_at: '2021-01-12T12:52:12.119-08:00',
      started_at: '2021-01-12T12:54:51.023-08:00',
      completed_at: '2021-01-12T12:54:51.268-08:00',
      test_mode: true,
      status: 'complete',
      friendly_status: 'Completed',
      progress: 100,
      title: 'Test spe 12JAN',
      project_id: 'p1efyfqbn4t29d',
      internal_run: true,
      owner_id: 'u1eejh6kgtfbct',
      pending_shipment_ids: [],
      'billing_valid?': true,
      protocol_id: null,
      success: null,
      success_notes: null,
      reject_reason: null,
      reject_description: null,
      successors_deep: [{
        data: {
          id: 'r1ezjh8rxhss4g',
          type: 'runs',
          links: { self: '/api/runs/r1ezjh8rxhss4g' },
          attributes: {
            created_at: '2020-10-23T11:24:44.216-07:00',
            accepted_at: '2020-10-23T11:24:44.214-07:00',
            started_at: '2020-10-23T11:26:26.259-07:00',
            completed_at: '2020-10-23T11:26:26.308-07:00',
            test_mode: true,
            status: 'complete',
            friendly_status: 'Completed',
            progress: 100,
            title: 'Provision resource on 2020-10-23',
            project_id: 'p1efyfqbn4t29d',
            internal_run: true,
            owner_id: 'u1eejh6kgtfbct',
            pending_shipment_ids: [],
            'billing_valid?': true,
            protocol_id: 'pr1dgq26bdbkuy6',
            success: null,
            success_notes: null,
            reject_reason: null,
            reject_description: null,
            successors_deep: [{
              data: {
                id: 'r1epamh7nh88tp',
                type: 'runs',
                links: { self: '/api/runs/r1epamh7nh88tp' },
                attributes: {
                  created_at: '2020-07-22T16:50:43.093-07:00',
                  accepted_at: '2020-07-22T16:50:43.090-07:00',
                  started_at: null,
                  completed_at: null,
                  test_mode: true,
                  status: 'canceled',
                  friendly_status: 'Canceled',
                  progress: 0,
                  title: 'Dilute Cells on 2020-07-22',
                  project_id: 'p1efyfqbn4t29d',
                  internal_run: true,
                  owner_id: 'u1eejh6kgtfbct',
                  pending_shipment_ids: [],
                  'billing_valid?': true,
                  protocol_id: 'pr1edp9ztrfdjmc',
                  success: null,
                  success_notes: null,
                  reject_reason: null,
                  reject_description: null,
                  successors_deep: [{
                    data: {
                      id: 'r1epamegchr5vp',
                      type: 'runs',
                      links: { self: '/api/runs/r1epamegchr5vp' },
                      attributes: {
                        created_at: '2020-07-22T16:49:31.751-07:00',
                        accepted_at: '2020-07-22T16:49:31.750-07:00',
                        started_at: null,
                        completed_at: null,
                        test_mode: true,
                        status: 'canceled',
                        friendly_status: 'Canceled',
                        progress: 0,
                        title: 'Count Cells on 2020-07-22',
                        project_id: 'p1efyfqbn4t29d',
                        internal_run: true,
                        owner_id: 'u1eejh6kgtfbct',
                        pending_shipment_ids: [],
                        'billing_valid?': true,
                        protocol_id: 'pr1eebe87suh77d',
                        success: null,
                        success_notes: null,
                        reject_reason: null,
                        reject_description: null,
                        successors_deep: [{
                          data: {
                            id: 'r1ejad7hb2fkk7',
                            type: 'runs',
                            links: { self: '/api/runs/r1ejad7hb2fkk7' },
                            attributes: {
                              created_at: '2020-06-16T10:41:01.443-07:00',
                              accepted_at: '2020-06-16T10:41:01.442-07:00',
                              started_at: null,
                              completed_at: null,
                              test_mode: false,
                              status: 'canceled',
                              friendly_status: 'Canceled',
                              progress: 0,
                              title: null,
                              project_id: 'p1efyfqbn4t29d',
                              internal_run: true,
                              owner_id: 'u1eejh6kgtfbct',
                              pending_shipment_ids: [],
                              'billing_valid?': true,
                              protocol_id: null,
                              success: null,
                              success_notes: null,
                              reject_reason: null,
                              reject_description: null,
                              successors_deep: [{
                                data: {
                                  id: 'r1ejacqf9edbyx',
                                  type: 'runs',
                                  links: { self: '/api/runs/r1ejacqf9edbyx' },
                                  attributes: {
                                    created_at: '2020-06-16T10:34:26.135-07:00',
                                    accepted_at: '2020-06-16T10:34:26.134-07:00',
                                    started_at: null,
                                    completed_at: null,
                                    test_mode: false,
                                    status: 'canceled',
                                    friendly_status: 'Canceled',
                                    progress: 0,
                                    title: null,
                                    project_id: 'p1efyfqbn4t29d',
                                    internal_run: true,
                                    owner_id: 'u1eejh6kgtfbct',
                                    pending_shipment_ids: [],
                                    'billing_valid?': true,
                                    protocol_id: null,
                                    success: null,
                                    success_notes: null,
                                    reject_reason: null,
                                    reject_description: null,
                                    successors_deep: []
                                  }
                                },
                                included: [{
                                  id: 'u1eejh6kgtfbct',
                                  type: 'users',
                                  links: { self: '/api/users/u1eejh6kgtfbct' },
                                  attributes: {
                                    created_at: '2020-05-13T15:06:15.100-07:00',
                                    email: 'ramu.phanimukla@strateos.com',
                                    feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                                    first_name: 'Ramu',
                                    is_developer: true,
                                    last_name: 'Phanimukla',
                                    name: 'Ramu Phanimukla',
                                    profile_img_url: null,
                                    updated_at: '2021-01-13T23:03:27.168-08:00'
                                  }
                                }]
                              }]
                            }
                          },
                          included: [{
                            id: 'u1eejh6kgtfbct',
                            type: 'users',
                            links: { self: '/api/users/u1eejh6kgtfbct' },
                            attributes: {
                              created_at: '2020-05-13T15:06:15.100-07:00',
                              email: 'ramu.phanimukla@strateos.com',
                              feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                              first_name: 'Ramu',
                              is_developer: true,
                              last_name: 'Phanimukla',
                              name: 'Ramu Phanimukla',
                              profile_img_url: null,
                              updated_at: '2021-01-13T23:03:27.168-08:00'
                            }
                          }]
                        }, {
                          data: {
                            id: 'r1ejad7hb2f998',
                            type: 'runs',
                            links: { self: '/api/runs/r1ejad7hb2f998' },
                            attributes: {
                              created_at: '2020-06-16T10:41:01.443-07:00',
                              accepted_at: '2020-06-16T10:41:01.442-07:00',
                              started_at: null,
                              completed_at: null,
                              test_mode: false,
                              status: 'canceled',
                              friendly_status: 'Canceled',
                              progress: 0,
                              title: null,
                              project_id: 'p1efyfqbn4t29d',
                              internal_run: true,
                              owner_id: 'u1eejh6kgtfbct',
                              pending_shipment_ids: [],
                              'billing_valid?': true,
                              protocol_id: null,
                              success: null,
                              success_notes: null,
                              reject_reason: null,
                              reject_description: null
                            }
                          },
                          included: [{
                            id: 'u1eejh6kgtfbct',
                            type: 'users',
                            links: { self: '/api/users/u1eejh6kgtfbct' },
                            attributes: {
                              created_at: '2020-05-13T15:06:15.100-07:00',
                              email: 'ramu.phanimukla@strateos.com',
                              feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                              first_name: 'Ramu',
                              is_developer: true,
                              last_name: 'Phanimukla',
                              name: 'Ramu Phanimukla',
                              profile_img_url: null,
                              updated_at: '2021-01-13T23:03:27.168-08:00'
                            }
                          }]
                        }]
                      }
                    },
                    included: [{
                      id: 'u1eejh6kgtfbct',
                      type: 'users',
                      links: { self: '/api/users/u1eejh6kgtfbct' },
                      attributes: {
                        created_at: '2020-05-13T15:06:15.100-07:00',
                        email: 'ramu.phanimukla@strateos.com',
                        feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                        first_name: 'Ramu',
                        is_developer: true,
                        last_name: 'Phanimukla',
                        name: 'Ramu Phanimukla',
                        profile_img_url: null,
                        updated_at: '2021-01-13T23:03:27.168-08:00'
                      }
                    }]
                  }]
                }
              },
              included: [{
                id: 'u1eejh6kgtfbct',
                type: 'users',
                links: { self: '/api/users/u1eejh6kgtfbct' },
                attributes: {
                  created_at: '2020-05-13T15:06:15.100-07:00',
                  email: 'ramu.phanimukla@strateos.com',
                  feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                  first_name: 'Ramu',
                  is_developer: true,
                  last_name: 'Phanimukla',
                  name: 'Ramu Phanimukla',
                  profile_img_url: null,
                  updated_at: '2021-01-13T23:03:27.168-08:00'
                }
              }]
            }]
          }
        },
        included: [{
          id: 'u1eejh6kgtfbct',
          type: 'users',
          links: { self: '/api/users/u1eejh6kgtfbct' },
          attributes: {
            created_at: '2020-05-13T15:06:15.100-07:00',
            email: 'ramu.phanimukla@strateos.com',
            feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
            first_name: 'Ramu',
            is_developer: true,
            last_name: 'Phanimukla',
            name: 'Ramu Phanimukla',
            profile_img_url: null,
            updated_at: '2021-01-13T23:03:27.168-08:00'
          }
        }]
      }, {
        data: {
          id: 'r1f7dwjcjcmas7',
          type: 'runs',
          links: { self: '/api/runs/r1f7dwjcjcmas7' },
          attributes: {
            created_at: '2020-12-15T08:56:13.406-08:00',
            accepted_at: '2020-12-15T08:56:13.405-08:00',
            started_at: '2020-12-15T08:57:12.248-08:00',
            completed_at: '2020-12-15T08:57:12.360-08:00',
            test_mode: true,
            status: 'complete',
            friendly_status: 'Completed',
            progress: 100,
            title: 'Test-2 solid handle 15DEC',
            project_id: 'p1efyfqbn4t29d',
            internal_run: true,
            owner_id: 'u1eejh6kgtfbct',
            pending_shipment_ids: [],
            'billing_valid?': true,
            protocol_id: null,
            success: null,
            success_notes: null,
            reject_reason: null,
            reject_description: null,
            successors_deep: [{
              data: {
                id: 'r1ezjkms5buxfe',
                type: 'runs',
                links: { self: '/api/runs/r1ezjkms5buxfe' },
                attributes: {
                  created_at: '2020-10-23T11:57:05.991-07:00',
                  accepted_at: '2020-10-23T11:57:05.988-07:00',
                  started_at: '2020-10-23T11:57:34.698-07:00',
                  completed_at: '2020-10-23T11:57:36.311-07:00',
                  test_mode: true,
                  status: 'complete',
                  friendly_status: 'Completed',
                  progress: 100,
                  title: 'Dilute Cells on 2020-10-23',
                  project_id: 'p1efyfqbn4t29d',
                  internal_run: true,
                  owner_id: 'u1eejh6kgtfbct',
                  pending_shipment_ids: [],
                  'billing_valid?': true,
                  protocol_id: 'pr1edp9ztrfdjmc',
                  success: null,
                  success_notes: null,
                  reject_reason: null,
                  reject_description: null,
                  successors_deep: []
                }
              },
              included: [{
                id: 'u1eejh6kgtfbct',
                type: 'users',
                links: { self: '/api/users/u1eejh6kgtfbct' },
                attributes: {
                  created_at: '2020-05-13T15:06:15.100-07:00',
                  email: 'ramu.phanimukla@strateos.com',
                  feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                  first_name: 'Ramu',
                  is_developer: true,
                  last_name: 'Phanimukla',
                  name: 'Ramu Phanimukla',
                  profile_img_url: null,
                  updated_at: '2021-01-13T23:03:27.168-08:00'
                }
              }]
            }, {
              data: {
                id: 'r1f7cavy45rrfn',
                type: 'runs',
                links: { self: '/api/runs/r1f7cavy45rrfn' },
                attributes: {
                  created_at: '2020-12-14T21:43:02.466-08:00',
                  accepted_at: '2020-12-14T21:43:02.464-08:00',
                  started_at: '2020-12-14T21:43:26.689-08:00',
                  completed_at: '2020-12-14T21:43:26.836-08:00',
                  test_mode: true,
                  status: 'complete',
                  friendly_status: 'Completed',
                  progress: 100,
                  title: 'Test solid handle',
                  project_id: 'p1efyfqbn4t29d',
                  internal_run: true,
                  owner_id: 'u1eejh6kgtfbct',
                  pending_shipment_ids: [],
                  'billing_valid?': true,
                  protocol_id: null,
                  success: null,
                  success_notes: null,
                  reject_reason: null,
                  reject_description: null,
                  successors_deep: []
                }
              },
              included: [{
                id: 'u1eejh6kgtfbct',
                type: 'users',
                links: { self: '/api/users/u1eejh6kgtfbct' },
                attributes: {
                  created_at: '2020-05-13T15:06:15.100-07:00',
                  email: 'ramu.phanimukla@strateos.com',
                  feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                  first_name: 'Ramu',
                  is_developer: true,
                  last_name: 'Phanimukla',
                  name: 'Ramu Phanimukla',
                  profile_img_url: null,
                  updated_at: '2021-01-13T23:03:27.168-08:00'
                }
              }]
            }, {
              data: {
                id: 'r1f7cj9vs6uz3z',
                type: 'runs',
                links: { self: '/api/runs/r1f7cj9vs6uz3z' },
                attributes: {
                  created_at: '2020-12-14T23:23:09.020-08:00',
                  accepted_at: '2020-12-14T23:23:09.018-08:00',
                  started_at: '2020-12-14T23:25:17.128-08:00',
                  completed_at: '2020-12-14T23:25:17.209-08:00',
                  test_mode: true,
                  status: 'complete',
                  friendly_status: 'Completed',
                  progress: 100,
                  title: 'Test spe 15DEC',
                  project_id: 'p1efyfqbn4t29d',
                  internal_run: true,
                  owner_id: 'u1eejh6kgtfbct',
                  pending_shipment_ids: [],
                  'billing_valid?': true,
                  protocol_id: null,
                  success: null,
                  success_notes: null,
                  reject_reason: null,
                  reject_description: null,
                  successors_deep: []
                }
              },
              included: [{
                id: 'u1eejh6kgtfbct',
                type: 'users',
                links: { self: '/api/users/u1eejh6kgtfbct' },
                attributes: {
                  created_at: '2020-05-13T15:06:15.100-07:00',
                  email: 'ramu.phanimukla@strateos.com',
                  feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
                  first_name: 'Ramu',
                  is_developer: true,
                  last_name: 'Phanimukla',
                  name: 'Ramu Phanimukla',
                  profile_img_url: null,
                  updated_at: '2021-01-13T23:03:27.168-08:00'
                }
              }]
            }]
          }
        },
        included: [{
          id: 'u1eejh6kgtfbct',
          type: 'users',
          links: { self: '/api/users/u1eejh6kgtfbct' },
          attributes: {
            created_at: '2020-05-13T15:06:15.100-07:00',
            email: 'ramu.phanimukla@strateos.com',
            feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
            first_name: 'Ramu',
            is_developer: true,
            last_name: 'Phanimukla',
            name: 'Ramu Phanimukla',
            profile_img_url: null,
            updated_at: '2021-01-13T23:03:27.168-08:00'
          }
        }]
      }]
    }
  },
  included: [{
    id: 'u1eejh6kgtfbct',
    type: 'users',
    links: { self: '/api/users/u1eejh6kgtfbct' },
    attributes: {
      created_at: '2020-05-13T15:06:15.100-07:00',
      email: 'ramu.phanimukla@strateos.com',
      feature_groups: ['can_upload_packages', 'can_submit_autoprotocol'],
      first_name: 'Ramu',
      is_developer: true,
      last_name: 'Phanimukla',
      name: 'Ramu Phanimukla',
      profile_img_url: null,
      updated_at: '2021-01-13T23:03:27.168-08:00'
    }
  }]
};
