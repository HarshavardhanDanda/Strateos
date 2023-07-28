import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import { CollapsiblePanel } from '@transcriptic/amino';
import sinon from 'sinon';

import AliquotAPI from 'main/api/AliquotAPI';
import ContextualCustomPropertyUtil from 'main/util/ContextualCustomPropertyUtil';
import AliquotInfoPanel from './AliquotInfoPanel';
import properties from './mocks/aliquotsCustomProperties.json';
import configs from './mocks/aliquotsCustomPropertiesConfigs.json';
import CustomPropertyTable from './CustomPropertyTable';

const customProperties = Immutable.fromJS(properties);

const aliquotInfo = {
  container_id: 'ct1et8cdx6bnmwr',
  id: 'aq1gckwmq7wd88e',
  name: 'A1',
  type: 'aliquots',
  volume_ul: '131.0',
  mass_mg: '50',
  well_idx: 0,
  resource_id: 'rs16pc8krr6ag7'
};

const containerInfo = {
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'consumable',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' }
};

const infoProps = {
  aliquot: Immutable.fromJS(aliquotInfo),
  container: Immutable.fromJS(containerInfo),
  containerType: Immutable.Map({ col_count: 2 }),
  atEffectId: undefined,
  returnUrl: '/transcriptic/inventory/samples/ct1egmnrkrednkq',
};

describe('Aliquot Info Panel', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let fetchData;
  let ccpcStoreStub;

  beforeEach(() => {
    fetchData = sandbox.stub(AliquotAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            id: 'aq1gckwmq7wd88e',
            type: 'aliquots',
            attributes: {
              amount: null,
              container_id: 'ct1gcwc6xvebtrm',
              created_at: '2021-11-10T13:39:47.287-08:00',
              created_by_run_id: null,
              deleted_at: null,
              lot_no: null,
              mass_mg: null,
              name: null,
              properties: {},
              resource_id: null,
              resource_id_last_changed_at: null,
              updated_at: '2021-11-10T13:39:47.287-08:00'
            }
          }
        });
        return { fail: () => ({ always: () => { } }) };
      }
    });
    ccpcStoreStub = sandbox.stub(ContextualCustomPropertyUtil, 'getCustomPropertyConfigs')
      .returns(Immutable.fromJS([]));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  function mountComponent() {
    return shallow(
      <AliquotInfoPanel {...infoProps} />
    ).dive().setState({ canManageCompounds: true });
  }

  it('Aliquot should have two Collapsible panels in detail info of Aliquot', () => {
    wrapper = mountComponent();
    expect(wrapper.find(CollapsiblePanel).length).to.be.equal(2);
  });

  it('Aliquot should have Compounds Panel', () => {
    wrapper = mountComponent();
    expect(wrapper.find(CollapsiblePanel).at(0).props().title).to.be.equal('Compounds');
  });

  it('Aliquot should have History Panel', () => {
    wrapper = mountComponent();
    expect(wrapper.find(CollapsiblePanel).at(1).props().title).to.be.equal('History');
  });

  it('Aliquot should render History tab when the user does not have admin privilege to manage compounds', () => {
    wrapper = shallow(
      <AliquotInfoPanel {...infoProps} />
    ).dive().setState({ canManageCompounds: false });
    expect(wrapper.find(CollapsiblePanel).at(1).props().title).to.be.equal('History');
  });

  it('Compounds tab should be open by default and calls renderCompounds method', () => {
    wrapper = mountComponent();
    expect(wrapper.find(CollapsiblePanel).at(0).props().title).to.be.equal('Compounds');
    expect(wrapper.find(CollapsiblePanel).at(0).props().initiallyCollapsed).to.be.false;
    expect(wrapper.find('AliquotComposition').length).to.eql(1);
  });

  it('Clicking on History tab should set selectedTab as History and calls renderHistory method', () => {
    wrapper = mountComponent();
    expect(wrapper.find(CollapsiblePanel).at(1).props().title).to.be.equal('History');
    expect(wrapper.find(CollapsiblePanel).at(1).props().initiallyCollapsed).to.be.false;
    expect(wrapper.find('ConnectedAliquotHistory').length).to.eql(1);
  });

  it('should render aliquot custom property table without errors', async () => {
    ccpcStoreStub.returns(Immutable.fromJS(configs));
    const propsWithCustomProperties = { ...infoProps, customProperties };

    wrapper = shallow(
      <AliquotInfoPanel {...propsWithCustomProperties} />
    );
    expect(wrapper.dive().find(CustomPropertyTable).length).to.equal(1);
  });

  it('should NOT render aliquot custom property table if there are no custom properties', () => {
    wrapper = shallow(
      <AliquotInfoPanel {...infoProps} />
    );
    expect(wrapper.dive().find(CustomPropertyTable).length).to.equal(0);
  });

  it('should call fetchData on componentDidUpdate when the aliquot has been updated', () => {
    const prevPropsAliquot = Immutable.fromJS({
      id: 'prev aliquot'
    });
    const prevProps = {
      aliquot: prevPropsAliquot,
    };
    wrapper = shallow(<AliquotInfoPanel {...infoProps} />).dive();
    fetchData.resetHistory();
    wrapper.instance().componentDidUpdate(prevProps);
    expect(fetchData.calledWith('aq1gckwmq7wd88e')).to.be.true;
    expect(fetchData.callCount).to.be.eql(1);
  });

  it('should not call fetchData on componentDidUpdate when the aliquot has not been updated', () => {
    const prevPropsAliquot = Immutable.fromJS({
      id: aliquotInfo.id
    });
    const prevProps = {
      aliquot: prevPropsAliquot,
    };
    wrapper = shallow(<AliquotInfoPanel {...infoProps} />).dive();
    fetchData.resetHistory();
    wrapper.instance().componentDidUpdate(prevProps);
    expect(fetchData.callCount).to.be.eql(0);
  });
});
