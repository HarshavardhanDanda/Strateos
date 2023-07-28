import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import _ from 'lodash';

import SessionStore from 'main/stores/SessionStore';
import ContainersTable  from './ContainersTable';

const props = {
  containers: [{
    barcode: 91511224,
    shipment_id: 'sr1cwf6r276r5fh',
    container_type_id: '96-flat',
    device_id: 'wc6-tiso3',
    label: 'CalibrationPlate_2020-02-12',
    id: 'ct1e4gmtykzdqny',
    organization: {
      name: 'DARPA SD2',
      subdomain: 'sd2org'
    },
    slot: {
      col: 2,
      row: 4
    }
  }]
};

describe('ContainersTable', () => {
  let containersTable;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ subdomain: 'sd2org' }));
    sandbox.stub(ContainersTable.prototype, 'confirm').returns(true);
  });
  afterEach(() => {
    containersTable.unmount();
    sandbox.restore();
  });

  it('should have 8 columns', () => {
    containersTable = shallow(<ContainersTable {...props} />).find('List').dive().find('Table')
      .dive();
    expect(containersTable.find('HeaderCell').length).to.equal(9);
  });

  it('should have valid values in first row', () => {
    containersTable = mount(<ContainersTable {...props} />);
    const firstRowColumns = containersTable.find('td').map(column => column.text());
    expect(firstRowColumns[1]).to.eql('ct1e4gmtykzdqny');
    expect(firstRowColumns[2]).to.eql('91511224');
    expect(firstRowColumns[4]).to.eql('-');
    expect(firstRowColumns[5]).to.eql('sd2org');
    expect(firstRowColumns[6]).to.eql('96-flat');
    expect(firstRowColumns[7]).to.eql('Col 2 / Row 4');
  });

  it('should trigger onSelectAll function', () => {
    const spySelectAll = sandbox.stub(ContainersTable.prototype, 'onSelectAll');
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').first().simulate('change', { target: { checked: true } });
    expect(spySelectAll.callCount).to.be.eql(1);
  });

  it('should trigger onSelectRow function', () => {
    const spySelectRow = sandbox.stub(ContainersTable.prototype, 'onSelectRow');
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').at(1).simulate('change', { target: { checked: true } });
    expect(spySelectRow.callCount).to.be.eql(1);
  });

  it('should simulate click on bulk retrieve button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').at(1).simulate('change', { target: { checked: true } });
    containersTable.find('List').props().actions[0].action();
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should simulate click on bulk remove button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').at(1).simulate('change', { target: { checked: true } });
    containersTable.find('List').props().actions[1].action();
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should simulate click on bulk discard button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').at(1).simulate('change', { target: { checked: true } });
    containersTable.find('List').props().actions[2].action();
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should simulate click on retrieve button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').first().simulate('change', { target: { checked: true } });
    containersTable.find('.tisos-page__action-button').first().simulate('click');
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should simulate click on remove button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').first().simulate('change', { target: { checked: true } });
    containersTable.find('.tisos-page__action-button').at(1).simulate('click');
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should simulate click on discard button', () => {
    containersTable = mount(<ContainersTable {...props} />);
    containersTable.find('input').first().simulate('change', { target: { checked: true } });
    containersTable.find('.tisos-page__action-button').at(2).simulate('click');
    expect(containersTable.find('td').last().text()).to.eql('Request sent');
  });

  it('should disable bulk action buttons are when no container is selected', () => {
    containersTable = mount(<ContainersTable {...props} />);
    expect(containersTable.find('List').props().actions[0].disabled).to.be.eql(true);
    containersTable.find('input').first().simulate('change', { target: { checked: true } });
    expect(containersTable.find('List').props().actions[0].disabled).to.be.eql(false);
  });

  it('should trigger getRuns function', () => {
    const spyFetch = sandbox.stub(ContainersTable.prototype, 'getRuns');
    containersTable = shallow(<ContainersTable {...props} />);
    expect(spyFetch.callCount).to.be.eql(1);
  });

  it('should display correct section titles by work cell and tiso numbers', () => {
    containersTable = shallow(<ContainersTable {...props} />);

    expect(containersTable.find('Card').find('Section').props().title).to.eql('wc6');
    expect(containersTable.find('Card').find('h4').text()).to.eql('tiso-3');
  });

  it('should display Missing Location section if container does not have a device_id', () => {
    const propsWithEmptyDeviceId = _.cloneDeep(props);
    propsWithEmptyDeviceId.containers[0].device_id = null;
    containersTable = shallow(<ContainersTable {...propsWithEmptyDeviceId} />);

    expect(containersTable.find('Card').find('Section').props().title).to.eql('Missing Location');
    expect(containersTable.find('Card').find('h4').length).to.be.equal(0);
  });

  it('should have gray as TabLayout background color', () => {
    containersTable = shallow(<ContainersTable {...props} />);

    expect(containersTable.find('Card').find('Section').props().title).to.eql('wc6');
    expect(containersTable.find('Card').find('h4').text()).to.eql('tiso-3');
  });
});
