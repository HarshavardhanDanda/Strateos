import sinon from 'sinon';
import { expect } from 'chai';

import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import NotificationActions from 'main/actions/NotificationActions';
import Dispatcher from 'main/dispatcher';
import mockBulkRequestResponsePartialSuccess from 'main/test/container/bulkActions/mockBulkRequestResponsePartialSuccess.json';
import mockMultiTransferResponseAllSuccess from 'main/test/container/bulkActions/mockMultiTransferResponseAllSuccess.json';
import mockMultiTransferResponsePartialSuccess from 'main/test/container/bulkActions/mockMultiTransferResponsePartialSuccess.json';
import mockMultiTransferResponseAllErrors from 'main/test/container/bulkActions/mockMultiTransferResponseAllErrors.json';
import mockMultiRelocateResponseAllSuccess from 'main/test/container/bulkActions/mockMultiRelocateResponseAllSuccess.json';
import mockMultiRelocateResponsePartialSuccess from 'main/test/container/bulkActions/mockMultiRelocateResponsePartialSuccess.json';
import mockMultiRelocateResponseAllErrors from 'main/test/container/bulkActions/mockMultiRelocateResponseAllErrors.json';
import ContainerActions from './ContainerActions';
import { InventoryActions } from '../inventory/inventory/InventoryActions';

describe('ContainerActions', () => {
  const sandbox = sinon.createSandbox();
  const mockPayload = [
    { container_id: '1', action: 'delete' },
    { container_id: '2', action: 'delete' }
  ];
  const mockResponse = [
    { container_id: '1', action: 'delete', error: '' },
    { container_id: '2', action: 'delete', error: '' }
  ];

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully bulk delete containers', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(mockResponse);
        return { fail: () => ({}) };
      }
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');
    const removeContainersSpy = sandbox.spy(ContainerActions, 'removeContainers');

    ContainerActions.bulkContainerOperation(mockPayload);

    expect(post.calledWithExactly('/api/containers/bulk_operation', {
      data: { requests: mockPayload }
    })).to.be.true;
    expect(createNotification.calledWithExactly({ text: '2 Container(s) deleted' })).to.be.true;
    expect(removeContainersSpy.calledOnce, 'createNotification called').to.be.true;
  });

  it('should catch an error when bulk deleting containers', () => {
    const mockFailedResponse = [
      { container_id: '1', action: 'delete', error: '' },
      { container_id: '2', action: 'delete', error: 'some error' }
    ];
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb(mockFailedResponse);
        return { fail: () => ({}) };
      }
    });
    const createNotification = sandbox.stub(NotificationActions, 'createNotification');
    const removeContainersSpy = sandbox.spy(ContainerActions, 'removeContainers');

    ContainerActions.bulkContainerOperation(mockPayload);

    expect(post.calledWithExactly('/api/containers/bulk_operation', {
      data: { requests: mockPayload }
    })).to.be.true;
    expect(createNotification.notCalled, 'createNotification not called').to.be.true;
    expect(removeContainersSpy.notCalled, 'removeContainersSpy not called').to.be.true;
  });

  it('should call to is_transferable in correct format when checking whether containers are transferable', () => {
    const containers = ['ct18rghd6r7xda', 'ct1hp7bqewzqf4g'];
    const post = sandbox.stub(ajax, 'post')
      .returns({ done: () => {}, fail: () => {} });

    ContainerActions.isTransferable(containers);

    expect(post.calledWithExactly('/api/containers/is_transferable', {
      containers: containers
    })).to.be.true;
  });

  it('should remove containers', () => {
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');

    ContainerActions.removeContainers(mockResponse);

    expect(dispatch.called, 'dispatch called').to.be.true;
    expect(dispatch.callCount, 'dispatch call count').to.be.equal(2);
  });

  it('should successfully transfer containers', () => {
    const response = mockMultiTransferResponseAllSuccess;
    const post = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb(response);
          return {
            done: () => ({})
          };
        },
        fail: () => ({})
      });

    const container_ids = ['1', '2'];
    const updates = { organization_id: 'org' };
    ContainerActions.updateContainersForTransfer(container_ids, updates);
    expect(post.calledWithExactly('/api/containers/transfer',
      { container_ids: ['1', '2'], organization_id: 'org' }
    )).to.be.true;
  });

  it('should transfer successfully for all containers', () => {
    const response = mockMultiTransferResponseAllSuccess;
    const ct1Id = response.data.attributes.result_success[0].id;
    const ct2Id = response.data.attributes.result_success[1].id;
    const container_ids = [ct1Id, ct2Id];
    sandbox.stub(ContainerActions, 'updateContainersForTransfer').returns({
      done: (cb) => {
        cb(response);
        return ({
          then: (fn) => fn(response),
          done: (fn) => fn(response),
        });
      },
      fail: () => ({})
    });

    ContainerActions.multiTransfer(container_ids, 'org').done((res) => {
      const allSuccess = res.data.attributes.result_success;
      expect(allSuccess.length).to.equal(2);
      expect(allSuccess[0].id).to.equal(ct1Id);
      expect(allSuccess[1].id).to.equal(ct2Id);
    });
  });

  it('should pass container_ids, location_id to the POST call while relocating many containers', () => {
    const post = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb(mockMultiRelocateResponseAllSuccess);
          return {
            fail: () => ({})
          };
        }
      });

    const container_ids = ['1', '2'];
    const location_id = 'loc1';
    ContainerActions.relocateMany(container_ids, location_id);
    expect(post.calledWithExactly('/api/containers/relocate_many',
      { container_ids: ['1', '2'], location_id: 'loc1' }
    )).to.be.true;
  });

  it('should successfully relocate all containers', () => {
    const ct1Id = mockMultiRelocateResponseAllSuccess.data.attributes.result_success[0].id;
    const ct2Id = mockMultiRelocateResponseAllSuccess.data.attributes.result_success[1].id;
    const container_ids = [ct1Id, ct2Id];
    sandbox.stub(ContainerActions, 'relocateMany').returns({
      done: (cb) => {
        cb(mockMultiRelocateResponseAllSuccess);
        return ({
          done: (fn) => fn(mockMultiRelocateResponseAllSuccess)
        });
      },
      fail: () => ({})
    });

    ContainerActions.relocateMany(container_ids, 'loc1').done((res) => {
      const allSuccess = res.data.attributes.result_success;
      expect(allSuccess.length).to.equal(2);
      expect(allSuccess[0].id).to.equal(ct1Id);
      expect(allSuccess[1].id).to.equal(ct2Id);
    });
  });

  it('should partially transfer some containers', () => {
    const response = mockMultiTransferResponsePartialSuccess;
    const ct1Id = response.data.attributes.result_success[0].id;
    const ct2Id = response.data.attributes.result_errors[0].id;
    const container_ids = [ct1Id, ct2Id];

    sandbox.stub(ContainerActions, 'updateContainersForTransfer').returns({
      done: (cb) => {
        cb(response);
        return ({
          then: (fn) => fn(response),
          done: (fn) => fn(response),
        });
      },
      fail: () => ({})
    });

    ContainerActions.multiTransfer(container_ids, 'org').done((res) => {
      expect(res.data.attributes.result_success.length).to.equal(1);
      expect(res.data.attributes.result_errors.length).to.equal(1);
      expect(res.data.attributes.result_success[0].id).to.equal(ct1Id);
      expect(res.data.attributes.result_errors[0].id).to.equal(ct2Id);
    });
  });

  it('should partially relocate some containers', () => {
    const ct1Id = mockMultiRelocateResponsePartialSuccess.data.attributes.result_success[0].id;
    const ct2Id = mockMultiRelocateResponsePartialSuccess.data.attributes.result_errors[0].id;
    const container_ids = [ct1Id, ct2Id];

    sandbox.stub(ContainerActions, 'relocateMany').returns({
      done: (cb) => {
        cb(mockMultiRelocateResponsePartialSuccess);
        return ({
          done: (fn) => fn(mockMultiRelocateResponsePartialSuccess)
        });
      },
      fail: () => ({})
    });

    ContainerActions.relocateMany(container_ids, 'loc1').done((res) => {
      expect(res.data.attributes.result_success.length).to.equal(1);
      expect(res.data.attributes.result_errors.length).to.equal(1);
      expect(res.data.attributes.result_success[0].id).to.equal(ct1Id);
      expect(res.data.attributes.result_errors[0].id).to.equal(ct2Id);
    });
  });

  it('should fail on All container relocate operation', () => {
    const ct1Id = mockMultiRelocateResponseAllErrors.data.attributes.result_errors[0].id;
    const ct2Id = mockMultiRelocateResponseAllErrors.data.attributes.result_errors[1].id;
    const container_ids = [ct1Id, ct2Id];
    sandbox.stub(ContainerActions, 'relocateMany').returns({
      done: (cb) => {
        cb(mockMultiRelocateResponseAllErrors);
        return ({
          done: (fn) => fn(mockMultiRelocateResponseAllErrors)
        });
      },
      fail: () => ({})
    });

    ContainerActions.relocateMany(container_ids, 'loc1').done((res) => {
      const allErrors = res.data.attributes.result_errors;
      expect(allErrors.length).to.equal(2);
      expect(allErrors[0].id).to.equal(ct1Id);
      expect(allErrors[1].id).to.equal(ct2Id);
      expect(allErrors[0].errors[0].detail).to.equal('Multiple tubes cannot be in a single box cell.');
      expect(allErrors[0].errors[1].detail).to.equal('This location does not accept 96-deep.');
      expect(allErrors[1].errors[0].detail).to.equal('Multiple tubes cannot be in a single box cell.');
      expect(allErrors[1].errors[1].detail).to.equal('This location does not accept 384-echo.');
    });
  });

  it('should fail on All container transfer', () => {
    const response = mockMultiTransferResponseAllErrors;
    const ct1Id = response.data.attributes.result_errors[0].id;
    const ct2Id = response.data.attributes.result_errors[1].id;
    const container_ids = [ct1Id, ct2Id];
    sandbox.stub(ContainerActions, 'updateContainersForTransfer').returns({
      done: (cb) => {
        cb(response);
        return ({
          then: (fn) => fn(response),
          done: (fn) => fn(response),
        });
      },
      fail: () => ({})
    });

    ContainerActions.multiTransfer(container_ids, 'org').done((res) => {
      const allErrors = res.data.attributes.result_errors;
      expect(allErrors.length).to.equal(2);
      expect(allErrors[0].id).to.equal(ct1Id);
      expect(allErrors[1].id).to.equal(ct2Id);
      expect(allErrors[0].errors[0].detail).to.equal('container ct123, Multiple tubes cannot be in a single box cell');
      expect(allErrors[1].errors[0].detail).to.equal('container ct124, Multiple tubes cannot be in a single box cell');
    });
  });

  it('should call inventory_search_api with barcodes', () => {
    const params = {
      data: {
        type: 'inventory_searches',
        attributes: {
          query: '*',
          page: 1,
          aliquot_count: 0,
          hide_tubes: false,
          hide_plates: false,
          sort_by: 'updated_at',
          sort_desc: true,
          storage_condition: undefined,
          test_mode: false,
          status: 'all',
          ignore_score: false,
          barcode: ['barcode1', 'barcode2']
        }
      }
    };
    const ajaxSpy = sandbox.spy(ajax, 'post');
    ContainerActions.searchWithoutPagination(['barcode1', 'barcode2']);
    expect(ajaxSpy.calledOnceWithExactly(Urls.inventory_search_api(), params));
  });

  it('should send bulk request with expected payload', () => {
    sandbox.stub(InventoryActions, 'buildSearchPayload').returns({
      query: '*',
      search_fields: ['label', 'id', 'barcode'],
      per_page: 50,
      aliquot_count: 0,
      page: 1,
      sort_by: 'updated_at',
      sort_desc: true,
      hide_tubes: false,
      hide_plates: false,
      show_containers_without_runs: false,
      hide_containers_with_pending_runs: false,
      storage_condition: undefined,
      volume: '*',
      status: 'available',
      contextual_custom_properties: {},
      aliquot_contextual_custom_properties: {},
      container_properties: {},
      aliquot_properties: {},
      shipped: undefined,
      generated: undefined,
      materials: undefined,
      search_score: true,
      include: ['container_type'],
      test_mode: undefined,
      search_hazard: [],
      container_type: [],
      empty_mass: { min: NaN, max: NaN },
      created_by: undefined,
      lab_id: undefined,
      organization_id: undefined,
      created_after: null,
      created_before: null,
      bulk_search: []
    });
    const response = { request_id: 'rq1234' };
    const post = sandbox.stub(ajax, 'post')
      .returns({
        done: (cb) => {
          cb(response);
          return { fail: () => ({}) };
        },
        then: (cb) => {
          cb(response);
          return { fail: () => ({}) };
        },
      });
    const action = 'destroy';
    const searchOptions = {
      searchQuery: '*',
      searchGeneration: '*',
      generatedContainers: [],
      searchVolume: '*',
      searchInput: '',
      searchAliquotCustomProperties: {},
      searchPerPage: 50,
      createdBefore: null,
      include: [
        'container_type'
      ],
      unusedContainers: [],
      searchStorageCondition: 'all',
      searchCustomProperties: {},
      searchContainerProperties: {},
      searchField: 'all',
      searchAliquotProperties: {},
      searchSmiles: '',
      searchContainerType: [],
      createdAfter: null,
      searchPage: 1,
      aliquot_count: 0,
      containerIds: [],
      descending: true,
      searchEmptyMass: {
        min: '',
        max: ''
      },
      searchByType: 'both',
      bulkSearch: [],
      searchStatus: 'available',
      searchHazard: [],
      searchProperties: {},
      searchLocation: [],
      searchSortBy: 'updated_at',
      createdBy: 'all'
    };

    ContainerActions.bulkRequest(action, searchOptions, 1000);
    expect(post.calledOnce).to.be.true;
    expect(post.calledWithExactly('/api/bulk_requests',
      {
        data: {
          context_type: 'container',
          bulk_action: 'destroy',
          expected_records: 1000,
          search_query: {
            data: {
              type: 'inventory_searches',
              attributes: {
                query: '*',
                page: 1,
                aliquot_count: 0,
                hide_tubes: false,
                hide_plates: false,
                sort_by: 'updated_at',
                sort_desc: true,
                storage_condition: undefined,
                test_mode: undefined,
                status: 'available',
                ignore_score: false,
                search_fields: ['label', 'id', 'barcode'],
                per_page: 50,
                show_containers_without_runs: false,
                hide_containers_with_pending_runs: false,
                volume: '*',
                contextual_custom_properties: {},
                aliquot_contextual_custom_properties: {},
                container_properties: {},
                aliquot_properties: {},
                shipped: undefined,
                generated: undefined,
                materials: undefined,
                search_score: true,
                include: ['container_type'],
                search_hazard: [],
                container_type: [],
                empty_mass: { min: NaN, max: NaN },
                created_by: undefined,
                lab_id: undefined,
                organization_id: undefined,
                created_after: null,
                created_before: null,
                bulk_search: []
              }
            }
          }
        }
      }
    )).to.be.true;
  });

  it('should poll for bulk request', () => {
    const response = mockBulkRequestResponsePartialSuccess;
    const getStub = sandbox.stub(ajax, 'get').returns({
      then: (cb) => {
        cb(response);
        return {
          fail: () => ({}),
          then: () => ({
            fail: () => ({})
          })
        };
      }
    });

    ContainerActions.pollForBulkRequest('request123').then((res) => {
      expect(getStub.calledWith('/api/bulk_requests/request123?polling=true'));
      expect(res).toEqual(response);
    });
  });

  it('should stop poll on HTTP 403 bulk request', () => {
    const getStub = sandbox.stub(ajax, 'get').returns({
      then: () => ({
        fail: (cb) => cb({ responseText: 'Not authorized', http: 403 }),
        then: () => ({
          fail: () => ({})
        })
      })
    });

    ContainerActions.pollForBulkRequest('request123').then((res) => {
      expect(getStub.calledOnce);
      expect(res).toEqual(false);
    });
  });
});
