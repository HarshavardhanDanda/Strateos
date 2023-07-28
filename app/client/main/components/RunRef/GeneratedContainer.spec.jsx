import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import ContainerAPI from 'main/api/ContainerAPI';
import { Card } from '@transcriptic/amino';
import { GeneratedContainer } from './GeneratedContainer';

const containerType = Immutable.Map({ col_count: 2 });

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
  type: 'containers'
});

const aliquots = Immutable.List([
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j52',
    name: 'A1',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: '50',
    well_idx: 0,
    resource_id: 'rs16pc8krr6ag7'
  }),
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j53',
    name: 'A2',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: undefined,
    well_idx: 1
  })
]);

const containerAPIResponse = {
  data: {
    id: 'ct1cwf6qzd54vgf',
    attributes: {
      aliquot_count: 2,
      barcode: undefined,
      container_type_id: '96-pcr',
      id: 'ct1et8cdx6bnmwr',
      label: 'pcr test',
      organization_id: 'org13',
      status: 'inbound',
      storage_condition: 'cold_4',
      test_mode: true,
      type: 'containers'
    }
  }
};

describe('GeneratedContainer', () => {
  const sandbox = sinon.createSandbox();
  let containerAPIStub;
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  beforeEach(() => {
    containerAPIStub = sandbox.stub(ContainerAPI, 'get').returns({
      done: (cb) => {
        cb(containerAPIResponse);
      }
    });
  });

  it('should show Spinner', () => {
    sandbox.restore(); // restoring containerAPI stub to show spinner
    wrapper = shallow(<GeneratedContainer />);
    expect(wrapper.find('Spinner').length).to.equal(1);
  });

  it('should show interactive plate and container details', () => {
    wrapper = shallow(<GeneratedContainer
      containerId={container.get('id')}
      container={container}
      containerType={containerType}
      aliquots={aliquots}
    />);
    expect(wrapper.find(Card).dive().find('Section').at(0)
      .dive()
      .find('InteractivePlate').length).to.equal(1);
    expect(wrapper.find(Card).dive().find('Section').at(1)
      .dive()
      .find('ContainerDetails').length).to.equal(1);
  });

  it('should be empty while details are loading', () => {
    wrapper = shallow(<GeneratedContainer />);
    expect(wrapper.find(Card).dive().find('Section').length).to.equal(0);
  });

  it('should re-fetch container details  when containerId prop changes', () => {
    wrapper = shallow(<GeneratedContainer containerId={container.get('id')} />);
    expect(containerAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ containerId: 'c1' });
    expect(containerAPIStub.calledTwice).to.be.true;
  });

  it('should not re-fetch container details if same containerId prop is set', () => {
    wrapper = shallow(<GeneratedContainer containerId={container.get('id')} />);
    expect(containerAPIStub.calledOnce).to.be.true;
    wrapper.setProps({ containerId: container.get('id') });
    expect(containerAPIStub.calledOnce).to.be.true;
  });

});
