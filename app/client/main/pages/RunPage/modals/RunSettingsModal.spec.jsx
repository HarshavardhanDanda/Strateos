import React from 'react';
import { LabeledInput, TextInput } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import RunSettingsModal from './RunSettingsModal';

describe('RunSettingsModal', () => {
  const sandbox = sinon.createSandbox();
  let runSettingsModal;
  const props = {
    organizationId: 'org13',
    runId: 'run123',
    labId: 'labId',
    projectId: 'proj123',
    runTitle: ''
  };

  afterEach(() => {
    sandbox.restore();
    runSettingsModal.unmount();
  });

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
  });

  function mount(props) {
    runSettingsModal = shallow(
      <RunSettingsModal {...props} />
    );
  }

  it('should show run name, run id and organization id as disabled in run settings modal for users having view runs in labs permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS, 'labId').returns(true);
    mount(props);
    expect(runSettingsModal.find(LabeledInput).length).to.equal(3);
    expect(runSettingsModal.find(LabeledInput).at(0).prop('label')).to.equal('Run Name');
    expect(runSettingsModal.find(LabeledInput).at(0).find(TextInput).prop('disabled')).to.be.true;
    expect(runSettingsModal.find(LabeledInput).at(0).dive().find(TextInput)
      .prop('value')).to.equal('Run run123');
    expect(runSettingsModal.find(LabeledInput).at(1).prop('label')).to.equal('Run ID');
    expect(runSettingsModal.find(LabeledInput).at(1).find(TextInput).prop('disabled')).to.be.true;
    expect(runSettingsModal.find(LabeledInput).at(1).dive().find(TextInput)
      .prop('value')).to.equal('run123');
    expect(runSettingsModal.find(LabeledInput).at(2).prop('label')).to.equal('Organization ID');
    expect(runSettingsModal.find(LabeledInput).at(2).find(TextInput).prop('disabled')).to.be.true;
    expect(runSettingsModal.find(LabeledInput).at(2).dive().find(TextInput)
      .prop('value')).to.equal('org13');
  });

  it('run name should be enabled for scientists only when current logged in organization is same as run organization', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS).returns(true);
    mount(props);
    expect(runSettingsModal.find(LabeledInput).length).to.equal(1);
    expect(runSettingsModal.find(LabeledInput).at(0).prop('label')).to.equal('Run Name');
    expect(runSettingsModal.find(LabeledInput).at(0).find(TextInput).prop('disabled')).to.be.false;
    expect(runSettingsModal.find(LabeledInput).at(0).dive().find(TextInput)
      .prop('value')).to.equal('Run run123');
  });

  it('run name should be disabled for scientists when current logged in organization is not same as run organization', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_EDIT_RUN_DETAILS).returns(true);
    const newProps = {
      ...props,
      organizationId: 'org123'
    };
    mount(newProps);
    expect(runSettingsModal.find(LabeledInput).length).to.equal(1);
    expect(runSettingsModal.find(LabeledInput).at(0).prop('label')).to.equal('Run Name');
    expect(runSettingsModal.find(LabeledInput).at(0).find(TextInput).prop('disabled')).to.be.true;
    expect(runSettingsModal.find(LabeledInput).at(0).dive().find(TextInput)
      .prop('value')).to.equal('Run run123');
  });

  it('save changes button should be disabled if user has view runs in labs permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS, 'labId').returns(true);
    mount(props);
    expect(runSettingsModal.find(SinglePaneModal).prop('acceptBtnDisabled')).to.be.true;
  });
});
