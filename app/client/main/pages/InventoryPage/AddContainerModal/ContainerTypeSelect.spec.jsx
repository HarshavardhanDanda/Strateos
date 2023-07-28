import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ContainerTypeSelect from './ContainerTypeSelect';

describe('ContainerTypeSelect', () => {
  let wrapper, containerTypeActionsStub, containerTypeStoreStub, getACSStub;
  const sandbox = sinon.createSandbox();

  const props = {
    onAddContainer: () => {},
    onShowCSVTubes: () => {},
    onShowZIPPlates: () => {},
    onShowCSVJobsApi: () => {},
  };

  const containerTypes = [{ data: [
    { id: 'a1-vial',  name: 'A1 vial', well_count: 10, retired_at: null },
    { id: 'flask-250', name: 'Flask 250', well_count: 5, retired_at: null },
    { id: 'pcr-0.5',  name: 'Pcr 0.5', well_count: 1, retired_at: null },
  ] }];

  beforeEach(() => {
    containerTypeActionsStub = sandbox.stub(ContainerTypeActions, 'loadAll').returns({
      always: (cb) => {
        return { data: cb(containerTypes), fail: () => ({}) };
      }
    });
    containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'getAll').returns(Immutable.fromJS(containerTypes[0].data));
    getACSStub = sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.SUBMIT_JOB).returns(true);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = undefined;
    }
    sandbox.restore();
  });

  it('should render', () => {
    wrapper = shallow(
      <ContainerTypeSelect {...props} />
    );
  });

  it('should render ContainerTypeSelector with all the container types', () => {
    wrapper = mount(
      <ContainerTypeSelect {...props} />
    );

    expect(wrapper.find('ContainerTypeSelector').length).equals(1);
    expect(containerTypeActionsStub.calledOnce).to.be.true;
    expect(containerTypeStoreStub.calledOnce).to.be.true;
    expect(wrapper.find('ContainerTypeSelector').find('Select').prop('options').size).to.equal(3);
  });

  it('should display select options', () => {
    wrapper = mount(
      <ContainerTypeSelect {...props} />
    );

    const links = wrapper.find('Button');
    expect(links.length).to.equal(3);
    expect(links.at(0).text()).to.include('Bulk upload tube information');
    expect(links.at(1).text()).to.include('Bulk upload plate CSVs');
    expect(links.at(2).text()).to.include('Bulk upload CSVs to Job Shipment API');
  });

  it('should set props for link buttons', () => {
    wrapper = mount(
      <ContainerTypeSelect {...props} />
    );

    expect(wrapper.find('Button').at(0).props()).to.deep.include({
      link: true,
      icon: 'fa fa-cloud-upload-alt',
      disableFormat: true
    });
  });

  it('should not display job shipment api panel when user does not have permission', () => {
    getACSStub.withArgs(FeatureConstants.SUBMIT_JOB).returns(false);
    wrapper = mount(
      <ContainerTypeSelect {...props} />
    );

    expect(wrapper.find('Button').length).to.equal(2);
  });

  it('should disable ContainerTypeSelector when job shipment api panel is selected', () => {
    wrapper = mount(
      <ContainerTypeSelect {...props} disableAdd />
    );
    expect(wrapper.find('ContainerTypeSelector').props().disabled).to.equal(true);
  });

  it('should disable Add button when job shipment api panel is selected', () => {
    wrapper = mount(
      <ContainerTypeSelect {...props} showAddButton disableAdd />
    );
    expect(wrapper.find('Button').at(0).props().disabled).to.be.true;
  });
});
