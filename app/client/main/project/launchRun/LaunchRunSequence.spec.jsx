import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SessionStore from 'main/stores/SessionStore';
import { Button } from '@transcriptic/amino';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import RunAPI from 'main/api/RunAPI';
import Manifest from 'main/util/Manifest';
import LaunchRunInputs from 'main/project/launchRun/LaunchRunInputs';
import LaunchRunActions from 'main/project/launchRun/LaunchRunActions';
import LaunchRunStore from 'main/project/launchRun/LaunchRunStore';
import * as RunAnalytics from 'main/analytics/RunAnalytics';
import PaymentMethodActions from 'main/actions/PaymentMethodActions';
import NotificationActions from 'main/actions/NotificationActions';
import labConsumerData from 'main/test/labconsumer/testData.json';
import LaunchRunSequence from './LaunchRunSequence';
import * as Uploader from '../../util/uploader';
import LaunchRequestAPI from '../../api/LaunchRequestAPI';
import EditPredecessorRun from './EditPredecessorRun';

describe('LaunchRunSequence', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    Transcriptic = { current_user: { is_developer: true } };
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'test123' }));
  });

  const props = {
    manifest: {
      license: 'MIT',
      package_name: 'com.l2s2dev.chem-synth-testing',
      command_string: 'python3 -m chem_synth',
      display_name: 'Chemical Synthesis',
      validation_url: undefined,
      inputs: {
        reagent_details: {
          type: 'group+',
          label: 'Reagents',
          inputs: {
            container: { type: 'container', label: 'Container', description: 'Container' }
          }
        },
        map: {
          type: 'group',
          inputs: {
            volume_map: {
              type: 'csv',
              template: {
                label: 'Upload CSV'
              }
            }
          }
        },
        cap: {
          type: 'group+',
          inputs: {
            volume_map: {
              type: 'csv',
              template: {
                label: 'Upload CSV'
              }
            }
          }
        }
      },
      name: 'ChemicalSynthesis',
      published: true,
      release_id: 're1ebbtdyfcdhbc',
      package_id: 'pk1e9p85xuvst8z',
      program_id: 'prg1ebbt7qr48y34',
      version: '0.0.9',
      logo_url: undefined,
      id: 'pr1ebbte3pb5prh',
      categories: ['Protocols'],
      description: 'Chemical Synthesis Protocol'
    },
    project:  Immutable.Map({
      payment_method_id: undefined,
      webhook_url: undefined,
      users: [],
      created_at: '2020-03-27T13:35:29.417-07:00',
      name: 'chem-synth-testing',
      archived_at: undefined,
      updated_at: '2020-03-27T13:35:29.417-07:00',
      id: 'p1e9c8yk7pcf8b',
      bsl: 1,
      visibility_in_words: 'Organization-wide',
      event_stream_settings: {},
      organization_id: 'test123',
      is_implementation: false
    }),
    onBack: () => {},
    onNext: () => {},
    onExit: () => {},
    canSetTestMode: true,
    currentIndex: 0,
    navigation: ['Configure', 'Review', 'Success']
  };

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  beforeEach(() => {
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => {
      cb();
    } });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('testmode should be false on load', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(wrapper.state().testMode).to.be.false;
  });

  it('lab id should not be undefined', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(wrapper.state().labId).to.equal('lab1');
  });

  it('Button should not render if cansetTestMode is false', () => {
    wrapper = shallow(<LaunchRunSequence {..._.omit(props, 'canSetTestMode')} />).dive();
    expect(wrapper.find(Button)).to.have.lengthOf(0);
  });

  it('Button should render when cansetTestMode is true', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(wrapper.find(Button)).to.have.lengthOf(1);
  });

  it('check default text on Button', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(wrapper.find(Button)).to.have.lengthOf(1);
    expect(wrapper.find(Button).dive().text()).to.equal('Switch to Test Mode');
  });

  it('on toggle button text should change', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    wrapper.instance().toggleTestMode();
    expect(wrapper.find(Button).dive().text()).to.equal('End Test Mode');
    expect(wrapper.state().testMode).to.be.true;
  });

  it('When currentIndex is zero Configure should be displayed', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(wrapper.find('ConnectedConfigure')).to.have.lengthOf(1);
    expect(wrapper.find('ConnectedReview')).to.have.lengthOf(0);
    expect(wrapper.find('SuccessfulSubmissionWithShipping')).to.have.lengthOf(0);
  });

  it('When currentIndex is 1 review should be displayed', () => {
    const modifiedProps = { ...props, currentIndex: 1 };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    wrapper.setState({ validator: {} });
    expect(wrapper.find('ConnectedReview')).to.have.lengthOf(1);
  });

  it('When currentIndex is 2 success should be displayed', () => {
    const modifiedProps = { ...props, currentIndex: 2 };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    expect(wrapper.find('SuccessfulSubmission')).to.have.lengthOf(1);
  });

  it('When navName is not valid nothing should render', () => {
    const modifiedProps = { ..._.omit(props, 'canSetTestMode'), currentIndex: 0,  navigation: ['Dummy'] };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    expect(wrapper.text()).to.equal('');
  });

  it('Should have the request date label', () => {
    sandbox.stub(SessionStore, 'hasFeature').withArgs('ccs_org').returns(true);
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    wrapper.setState({ showRequestDateInputParameters: true });
    const configureWrapper = wrapper.find('ConnectedConfigure').dive().find('Configure').dive();
    const h4Wrapper = configureWrapper.find('h4').at(0);
    expect(h4Wrapper.text()).to.eq('Request Date');
  });

  it('Should have the request time label', () => {
    sandbox.stub(SessionStore, 'hasFeature').withArgs('ccs_org').returns(true);
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    wrapper.setState({ showRequestDateInputParameters: true });
    const configureWrapper = wrapper.find('ConnectedConfigure').dive().find('Configure').dive();
    const h4Wrapper = configureWrapper.find('h4').at(1);
    expect(h4Wrapper.text()).to.eq('Request Time');
  });

  it('Should have the request date and time picker', () => {
    sandbox.stub(SessionStore, 'hasFeature').withArgs('ccs_org').returns(true);
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    wrapper.setState({ showRequestDateInputParameters: true });
    const configureWrapper = wrapper.find('ConnectedConfigure').dive().find('Configure').dive();
    expect(configureWrapper.find('DatePicker')).to.have.length(2);
    configureWrapper.unmount();
  });

  it('Should not have the request date and time picker', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive().find('ConnectedConfigure').dive();
    const configureWrapper = wrapper.find('Configure').dive();
    expect(configureWrapper.find('DatePicker')).to.have.length(0);
    configureWrapper.unmount();
  });

  it('should be able to edit predecessor run', () => {
    wrapper = shallow(<LaunchRunSequence {...props} initialPredecessorId="foo" />).dive();
    const editPredecessorRun = wrapper.find('ConnectedConfigure').dive().find('Configure').dive()
      .find(EditPredecessorRun);
    expect(editPredecessorRun).to.have.length(1);
    expect(editPredecessorRun.prop('predecessorId')).to.equal('foo');
  });

  it('should validate that predecessor id is not empty string', async () => {
    sandbox.stub(Manifest, 'hasErrors').returns(false);
    wrapper = shallow(<LaunchRunSequence {...props} initialPredecessorId="" />).dive().find('ConnectedConfigure').dive();
    const configureWrapper = wrapper.find('Configure').dive();

    await configureWrapper.instance().validatePredecessorId();
    expect(configureWrapper.state().validatePredecessorInput).to.equal('Please enter a Run ID');
  });

  it('should validate that predecessor id is existing run', async () => {
    sandbox.stub(RunAPI, 'get').rejects();
    sandbox.stub(Manifest, 'hasErrors').returns(false);
    wrapper = shallow(<LaunchRunSequence {...props} initialPredecessorId="foo" />).dive().find('ConnectedConfigure').dive();
    const configureWrapper = wrapper.find('Configure').dive();

    await configureWrapper.instance().validatePredecessorId();
    expect(configureWrapper.state().validatePredecessorInput).to.equal('Run ID foo not found in organization. Please specify a valid ID.');
  });

  it('should throw an error if predecessor run belongs to a different org', async () => {
    sandbox.stub(RunAPI, 'get').resolves(
      {
        data: {
          attributes: { organization_id: 'org123' }
        }
      }
    );
    sandbox.stub(Manifest, 'hasErrors').returns(false);
    wrapper = shallow(<LaunchRunSequence {...props} initialPredecessorId="foo" />).dive().find('ConnectedConfigure').dive();
    const configureWrapper = wrapper.find('Configure').dive();

    await configureWrapper.instance().validatePredecessorId();
    expect(configureWrapper.state().validatePredecessorInput).to.equal('Run ID foo not found in organization. Please specify a valid ID.');
  });

  it('should not throw any error if predecessor run belongs to same org', async () => {
    sandbox.stub(RunAPI, 'get').resolves(
      {
        data: {
          attributes: { organization_id: 'test123' }
        }
      }
    );
    sandbox.stub(Manifest, 'hasErrors').returns(false);
    wrapper = shallow(<LaunchRunSequence {...props} initialPredecessorId="foo" />).dive().find('ConnectedConfigure').dive();
    const configureWrapper = wrapper.find('Configure').dive();

    await configureWrapper.instance().validatePredecessorId();
    expect(configureWrapper.state().validatePredecessorInput).to.equal(undefined);
  });

  it('should render LaunchRunInputs with csvInputs prop based on manifest', () => {
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    const expectedCsvInputs = {
      map: { volume_map: undefined },
      cap: [{ volume_map: undefined }]
    };
    expect(wrapper.find('ConnectedConfigure')).to.have.lengthOf(1);
    const launchRunInputs = wrapper.find('ConnectedConfigure').dive().find('Configure').dive()
      .find(LaunchRunInputs);
    expect(launchRunInputs.props().csvInputs).to.deep.equal(expectedCsvInputs);
  });

  it('should upload protocol files on submit run', () => {
    const protocolFileInfo = { name: 'template.csv', type: 'text/csv', arrayBuffer: () => {} };

    sandbox.stub(LaunchRequestAPI, 'update').resolves();
    sandbox.stub(RunAnalytics, 'launched');
    const launchRun = sandbox.stub(LaunchRunActions, 'launch').returns({
      done: (cb) => {
        cb({  id: 'run123', launch_request_id: 'lr0010' });
        return { fail: () => {} };
      }
    });

    sandbox.stub(LaunchRunStore, 'getCsvUploads').returns({
      map: { volume_map: protocolFileInfo },
      cap: [{ volume_map: protocolFileInfo }]
    });

    const uploadFile = sandbox.stub(Uploader, 'uploadFile').returns({
      done: (cb) => {
        cb({ id: 'upload134' });
        return { fail: () => {} };
      }
    });

    const modifiedProps = { ...props, currentIndex: 1 };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    wrapper.setState({ validator: {} });
    wrapper.find('ConnectedReview').dive().find('Review').dive()
      .instance()
      .launchRun();

    expect(uploadFile.callCount).to.equal(2);
    expect(launchRun.callCount).to.equal(1);
  });

  it('should skip upload file when file not selected', () => {
    sandbox.stub(RunAnalytics, 'launched');
    sandbox.stub(LaunchRunActions, 'launch').returns({
      done: (cb) => {
        cb({  id: 'run123', launch_request_id: 'lr0010' });
        return { fail: () => {} };
      }
    });

    sandbox.stub(LaunchRunStore, 'getCsvUploads').returns({
      map: { volume_map: undefined },
      cap: [{ volume_map: undefined }]
    });

    const uploadFile = sandbox.spy(Uploader, 'uploadFile');

    const modifiedProps = { ...props, currentIndex: 1 };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    wrapper.setState({ validator: {} });
    wrapper.find('ConnectedReview').dive().find('Review').dive()
      .instance()
      .launchRun();

    expect(uploadFile.callCount).to.equal(0);
  });

  it('should be able to handle response failure', () => {
    const protocolFileInfo = { name: 'template.csv', type: 'text/csv', arrayBuffer: () => { } };

    sandbox.stub(LaunchRequestAPI, 'update').resolves();
    const runAnalyticsLaunched = sandbox.stub(RunAnalytics, 'launched');
    const mockErrorNotification = sandbox.stub(NotificationActions, 'handleError');
    const launchRun = sandbox.stub(LaunchRunActions, 'launch').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });

    sandbox.stub(LaunchRunStore, 'getCsvUploads').returns({
      map: { volume_map: protocolFileInfo },
      cap: [{ volume_map: protocolFileInfo }]
    });

    const uploadFile = sandbox.stub(Uploader, 'uploadFile').returns({
      done: (cb) => {
        cb({ id: 'upload134' });
        return { fail: () => { } };
      }
    });

    const modifiedProps = { ...props, currentIndex: 1 };
    wrapper = shallow(<LaunchRunSequence {...modifiedProps} />).dive();
    wrapper.setState({ validator: {} });
    wrapper.find('ConnectedReview').dive().find('Review').dive()
      .instance()
      .launchRun();

    expect(uploadFile.callCount).to.equal(0);
    expect(runAnalyticsLaunched.callCount).to.equal(0);
    expect(launchRun.callCount).to.equal(1);
    expect(mockErrorNotification.calledOnce).to.be.true;
  });

  it('Should loadAll payment method if project belongs to same org', () => {
    const loadAllSpy = sandbox.spy(PaymentMethodActions, 'loadAll');
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(loadAllSpy.calledOnce).to.be.true;
  });

  it('Should load projects organization payment method when the project organization is different', () => {
    const loadByOrgSpy = sandbox.spy(PaymentMethodActions, 'loadByOrg');
    const newProject = props.project.toJS();
    newProject.organization_id = 'test456';
    const newProps = { ...props, project: Immutable.Map(newProject) };
    wrapper = shallow(<LaunchRunSequence {...newProps} />).dive();
    expect(loadByOrgSpy.calledOnce).to.be.true;
  });

  it('should update csvInputs data when manifest is updated', () => {
    const launchRunStore = sandbox.stub(LaunchRunStore, 'setCsvUploads');
    wrapper = shallow(<LaunchRunSequence {...props} />).dive();
    expect(launchRunStore.calledOnce).to.be.true;
    wrapper.setProps({ manifest: { ...props.manifest, id: '123' } });
    expect(launchRunStore.calledTwice).to.be.true;
  });

  it('should not update csvInputs data when manifest is not updated', () => {
    const launchRunStore = sandbox.stub(LaunchRunStore, 'setCsvUploads');
    wrapper = shallow(<LaunchRunSequence {...props}  />).dive();
    expect(launchRunStore.calledOnce).to.be.true;
    wrapper.setProps({ manifest: props.manifest });
    expect(launchRunStore.calledOnce).to.be.true;
  });

});
