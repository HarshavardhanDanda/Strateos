import React from 'react';
import Immutable from 'immutable';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import AdminPanel from 'main/pages/ContainerPage/AdminPanel';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { Button } from '@transcriptic/amino';

const containerType = Immutable.fromJS({
  col_count: 2,
  well_count: 1536,
  acceptable_lids: ['standard', 'universal', 'low_evaporation', 'ultra-clear', 'foil']
});

const container = Immutable.Map({
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'inbound',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' }
});

const props = {
  containerType,
  container
};

describe('AdminPanel', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper)wrapper.unmount();
    if (sandbox)sandbox.restore();
  });

  it('should have Destroy & Reset All Aliquots button when have acs permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(true);
    wrapper = shallow(
      <AdminPanel{...props} />
    );
    expect(wrapper.find(Button).at(2).props().children).to.equal('Destroy & Reset All Aliquots');

  });
  it('should not have Destroy & Reset All Aliquots button when acs permission not given', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(false);
    wrapper = shallow(
      <AdminPanel{...props} />
    );
    expect(wrapper.find(Button).at(2).exists()).to.be.false;

  });

  it('should call function for Destroy & Reset All Aliquots button when clicked', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS).returns(true);
    const resetAliquotStub = sandbox.stub(AdminPanel.prototype, 'onClickResetAliquots');
    wrapper = shallow(
      <AdminPanel{...props} />
    );
    const resetButton = wrapper.find(Button).at(2);
    expect(resetButton.props().children).to.equal('Destroy & Reset All Aliquots');
    resetButton.simulate('click');
    expect(resetAliquotStub.calledOnce).to.be.true;
  });
});
