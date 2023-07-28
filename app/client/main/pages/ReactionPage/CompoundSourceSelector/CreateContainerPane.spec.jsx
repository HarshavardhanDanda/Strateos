import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ajax from 'main/util/ajax';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import CreateContainersLogic from 'main/pages/InventoryPage/AddContainerModal/CreateContainersLogic.js';
import ContainerActions from 'main/actions/ContainerActions';
import SessionStore from 'main/stores/SessionStore';
import ShipmentActions from 'main/actions/ShipmentActions';
import BulkDataIngestorActions from 'main/actions/BulkDataIngestorActions';
import NotificationActions from 'main/actions/NotificationActions';

import LabConsumerStore from 'main/stores/LabConsumerStore';
import labConsumerData from 'main/test/labconsumer/testData.json';
import CreateContainers from 'main/pages/InventoryPage/AddContainerModal/CreateContainers';
import JSZip from 'jszip';
import ModalActions from 'main/actions/ModalActions';
import CreateContainerPane, { PANELS } from './CreateContainerPane';

describe('CreateContainerPane', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let onCreateSpy;

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  const tubeParams = Immutable.fromJS([
    {
      compoundIds: 'cmpl1d8ynztkrtfc7 cmpl1d8ynztfnn4dd',
      containerType: 'flask-250',
      name: 'Tube 1',
      properties: {},
      storage: 'cold_4',
      volume: '10:microliter'
    },
    {
      compoundIds: 'cmpl1d8ynztkrtfc7 cmpl1d8ynztfnn4dd',
      containerType: 'flask-250',
      name: 'Tube 2',
      properties: {},
      storage: 'cold_4',
      volume: '10:microliter'
    }
  ]);

  const containers = Immutable.fromJS([
    {
      containerType: 'bottle-500',
      force_validate: false,
      mass: '6:milligram',
      name: 'Tube 1',
      storage: 'cold_4',
      test_mode: true,
      volume: '8:microliter'
    }
  ]);

  const testFiles = [
    new File(['foo,bar'], 'plate.csv', { type: 'text/csv' }),
    new File(['foo,baz'], 'tube.csv', { type: 'text/csv' })
  ];

  beforeEach(() => {
    sandbox.stub(ajax, 'get').returns({
      done: cb => {
        cb({
          data: [
            {
              id: 'flask-250',
              attributes: {
                is_tube: true,
                name: '250mL Flask',
                shortname: 'flask-250',
                vendor: 'not_applicable',
                well_count: 1,
                well_depth_mm: '0.0',
                well_volume_ul: '250000.0'
              },
              type: 'container_types'
            }
          ],
          meta: {
            record_count: 1
          }
        });

        return { fail: () => ({}) };
      }
    });

    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
    sandbox.stub(ContainerTypeStore, 'isPlate').returns(false);
    sandbox.stub(CreateContainersLogic, 'isValid').returns(true);

    onCreateSpy = sandbox.spy();
  });

  const shipmentResponse = {
    data: {
      id: 'sr1gktc9gefpmdj',
      type: 'shipments',
      attributes: {
        checked_in_at: null,
        data: {},
        editable: true,
        label: 'TNFU',

        organization_id: 'org13',
        container_ids: [
          'ct1gktc9fnvg9ms'
        ]
      }
    }
  };

  const shipmentContainers = [
    {
      id: 'ct1gktc9fnvg9ms',
      container_type_id: '96-pcr',
      shipment_code: 'HIT',
      status: 'inbound',
      organization_name: 'Strateos',
    }
  ];

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should have labOperatorName, lab_id, labAddress in state on initial mount', () => {
    wrapper = shallow(
      <CreateContainerPane />
    );
    expect(wrapper.state().labOperatorName).to.equal('Strateos');
    expect(wrapper.state().lab_id).to.equal('lab1');
    expect(wrapper.state().labAddress).to.deep.equal(mockLabConsumers.first().getIn(['lab', 'address']));

  });

  it('should remove containers on deleting files', () => {
    wrapper = shallow(
      <CreateContainerPane />
    );
    wrapper.setState({ files: [{ uuid: '1', noOfContainers: 2 }] });
    wrapper.instance().onFilesDelete(['1']);
    expect(wrapper.state().containers.toJS()).to.have.length(0);
  });

  it('should update On add container state', () => {
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} />
    );
    const instance = wrapper.instance();
    expect(instance.tubeCounter).to.equal(1);
    instance.onAddContainer('flask-250');
    expect(instance.tubeCounter).to.equal(2);
    expect(wrapper.state().containers.toJS()).to.have.length(1);
  });

  it('should update On add bulk container state', () => {
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} />
    );
    const instance = wrapper.instance();
    expect(instance.tubeCounter).to.equal(1);
    instance.onBulkSetTubes(tubeParams);
    expect(instance.tubeCounter).to.equal(3);
    expect(wrapper.state().containers.toJS()).to.have.length(2);
  });

  it('should go through the correct process on adding test container', () => {
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} />
    ).setState({ containers });
    expect(wrapper.find('Pane').prop('testMode')).to.be.false;
    expect(wrapper.find('Pane').prop('nextBtnName')).to.equal('Create Shipment');
  });

  it('should go through the correct process on adding non-test container', () => {
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} testMode />
    ).setState({ containers, testMode: false });
    expect(wrapper.find('Pane').prop('testMode')).to.be.true;
    expect(wrapper.find('Pane').prop('nextBtnName')).to.equal('Create Test Containers');
  });

  it('should trigger all necessary api calls when creating containers with shipment', () => {
    const response = { containers: [] };
    const bulkCreateSampleContainers = sandbox.stub(ContainerActions, 'bulkCreateSampleContainers').returns({
      done: (cb) => {
        cb(response);
        return { always: () => ({}) };
      }
    });
    const createShipmentWithCodes = sandbox.stub(ShipmentActions, 'createShipmentWithCodes').returns({
      then: (cb) => {
        cb(Immutable.fromJS({ shipment: shipmentResponse, containers: shipmentContainers }));
        return { fail: () => ({}) };
      }
    });

    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.Map());
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} />
    );
    const instance = wrapper.instance();
    instance.onBulkSetTubes(tubeParams);
    // method called when clicked on create shipment
    instance.onSubmit(() => {});

    expect(bulkCreateSampleContainers.calledOnce).to.be.true;
    expect(createShipmentWithCodes.calledOnce).to.be.true;
    expect(onCreateSpy.calledOnce).to.be.true;
  });

  it('should trigger all necessary api calls when creating test containers', () => {
    const response = { containers: [] };
    const bulkCreateSampleContainers = sandbox.stub(ContainerActions, 'bulkCreateSampleContainers').returns({
      done: (cb) => {
        cb(response);
        return { always: () => ({}) };
      }
    });

    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.Map());
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    wrapper = shallow(
      <CreateContainerPane onContainerCreation={onCreateSpy} testMode />
    ).setState({ containers, testMode: true });
    const instance = wrapper.instance();
    instance.onBulkSetTubes(tubeParams);

    expect(wrapper.find('Pane').prop('testMode')).to.be.true;
    expect(wrapper.find('Pane').prop('nextBtnName')).to.equal('Create Test Containers');

    // method called when clicked on create test containers
    instance.onSubmit(() => {});

    expect(bulkCreateSampleContainers.calledOnce).to.be.true;
    expect(onCreateSpy.calledOnce).to.be.true;
  });

  describe('Active panel', () => {
    it('should display containers panel on initial load', () => {
      wrapper = shallow(<CreateContainerPane />);

      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.CONTAINER);
    });

    it('should display bulk csv plate upload panel', () => {
      wrapper = shallow(<CreateContainerPane />);

      wrapper.find(CreateContainers).props().onShowCSV(true);
      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.UPLOAD_CSV_PLATE);
    });

    it('should display bulk csv tube upload panel', () => {
      wrapper = shallow(<CreateContainerPane />);

      wrapper.find(CreateContainers).props().onShowCSV(false);
      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.UPLOAD_CSV_TUBES);
    });

    it('should display bulk zip plate upload panel', () => {
      wrapper = shallow(<CreateContainerPane />);

      wrapper.find(CreateContainers).props().onShowZIPPlates();
      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.UPLOAD_ZIP_PLATE);
    });

    it('should display job shipment api panel', () => {
      wrapper = shallow(<CreateContainerPane />);

      wrapper.find(CreateContainers).props().onShowCSVJobsApi();
      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.UPLOAD_CSV_JOBS_API);
    });

    it('should reset to container panel', () => {
      wrapper = shallow(<CreateContainerPane />);

      wrapper.find(CreateContainers).props().onResetActivePanel();
      expect(wrapper.find(CreateContainers).prop('activePanel')).to.equal(PANELS.CONTAINER);
    });
  });

  describe('Job Shipment API', () => {

    let bulkValidateZipFileStub;
    let bulkUploadZipStub;
    let buildJobsApiPayloadStub;
    let notificationActionSpy;
    const blob = new Blob([], { type: 'application/zip' });

    const generateCreateContainerPaneWrapper = () => {
      wrapper = shallow(<CreateContainerPane />);
      wrapper.find(CreateContainers).props().onShowCSVJobsApi();
      wrapper.setState({ jobsApiFiles: { plates: Immutable.fromJS([testFiles[0]]), tubes: Immutable.fromJS([testFiles[1]]) } });
      wrapper.find('Pane').prop('beforeNavigateNext')(); // call the submit method
    };

    const buildFormData = () => {
      const formData = new FormData();
      formData.append('file', blob, 'bulk_19_04_2023_13_11_45.zip');
      formData.append('type', 'CREATE_CONTAINERS');
      formData.append('labId', 'lb123');
      return formData;
    };

    beforeEach(() => {
      const validateApiResponse = { valid: true, errors: [] };
      const uploadApiResponse = {
        id: '7d3a0643-6e4b-4d07-8945-37740663a7d6',
        type: 'CREATE_CONTAINERS',
        fileName: 'bulk_19_04_2023_13_11_45.zip',
        status: 'ACCEPTED',
        errors: []
      };

      buildJobsApiPayloadStub = sandbox.stub(CreateContainerPane.prototype, 'buildJobsApiPayload').returns(
        {
          then: (cb) => {
            cb(buildFormData());
            return { then: (cb) => { cb(buildFormData()); } };
          }
        }
      );
      sandbox.stub(JSZip.prototype, 'generateAsync').returns({
        then: (cb) => {
          cb(blob);
        }
      });

      bulkValidateZipFileStub = sandbox.stub(BulkDataIngestorActions, 'validateZip').returns({
        then: (cb) => {
          cb(validateApiResponse);
          return { always: () => ({}), fail: () => {} };
        }
      });

      bulkUploadZipStub = sandbox.stub(BulkDataIngestorActions, 'uploadZip').returns({
        then: (cb) => {
          cb(uploadApiResponse);
          return { always: () => ({}), fail: () => {} };
        }
      });

      notificationActionSpy = sandbox.spy(NotificationActions, 'createNotification');
    });

    afterEach(() => {
      if (wrapper) wrapper.unmount();
      if (sandbox) sandbox.restore();
    });

    it('should zip csv files and call validateZip & uploadZip', () => {
      generateCreateContainerPaneWrapper();

      expect(wrapper.find('Pane').prop('testMode')).to.be.false;
      expect(wrapper.find('Pane').prop('nextBtnName')).to.equal('Create Shipment');
      expect(bulkValidateZipFileStub.calledOnce).to.be.true;
      expect(bulkUploadZipStub.calledOnce).to.be.true;
    });

    it('should set error state jobsApiErrors if the validateZip response has errors', () => {
      const validationResponse = {
        valid: false,
        errors: [{
          fileName: 'plates/plates_1.csv',
          errors: [
            {
              entity: 'container',
              sourceIdentifier: '0',
              description: 'ROW[5], HEADER[ct_label_m], ERROR[Characters Comma(,) and Slash(/) are not allowed for column ct_label_m]'
            }
          ]
        }]
      };

      buildJobsApiPayloadStub.returns(
        {
          then: (cb) => {
            cb(buildFormData());
            return { then: (cb) => { cb(buildFormData()); } };
          }
        }
      );

      bulkValidateZipFileStub.returns({
        then: (cb) => {
          cb(validationResponse);
          return { always: () => ({}), fail: () => {} };
        }
      });

      generateCreateContainerPaneWrapper();

      expect(bulkValidateZipFileStub.calledOnce).to.be.true;
      expect(wrapper.state().waitingOnSubmit).to.be.false;
      expect(wrapper.state().jobsApiErrors).to.equal(validationResponse.errors);
    });

    it('should close the modal and display the notification after the zip file is uploaded successfully', () => {
      const ModalActionsSpy = sandbox.spy(ModalActions, 'close').withArgs('ADD_CONTAINER_MODAL');
      generateCreateContainerPaneWrapper();

      expect(ModalActionsSpy.calledOnce).to.be.true;
      expect(notificationActionSpy.calledOnceWithExactly({
        text: 'The CSV files are zipped and uploaded successfully',
        isSuccess: true
      }));
    });
  });
});
