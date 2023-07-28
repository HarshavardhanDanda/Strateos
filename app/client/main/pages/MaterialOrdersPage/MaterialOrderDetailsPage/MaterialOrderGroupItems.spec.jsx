import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { List, Table } from '@transcriptic/amino';
import _ from 'lodash';
import { groupMaterials } from 'main/pages/MaterialOrdersPage/mocks/materials.js';
import MaterialOrderGroupItems from './MaterialOrderGroupItems';

describe('MaterialOrderGroupItems', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have 4 visible columns', () => {
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const header = table.dive().find('Block').find('Header').find('Row');
    expect(table.length).to.equal(1);
    expect(table.dive().instance().props.children.length).to.equal(4);
    expect(header.find('HeaderCell').at(1).dive().text()).to.equal('name');
    expect(header.find('HeaderCell').at(2).dive().text()).to.equal('sku');
    expect(header.find('HeaderCell').at(3).dive().text()).to.equal('quantity');
    expect(header.find('HeaderCell').at(4).dive().text()).to.equal('cost');
  });

  it('should display rows', () => {
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(table.length).to.equal(1);
    expect(body.find('BodyCell').at(1).dive().text()).to.equal('BetaPharma');
    expect(body.find('BodyCell').at(2).dive().text()).to.equal('436500315');
    expect(body.find('BodyCell').at(3).find('TextInput').props().value).to.equal(1);
    expect(body.find('BodyCell').at(4).dive().text()).to.equal('$554.00');
  });

  it('should display totalCost in footer', () => {
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
      />);
    const footer = wrapper.find('.material-order-items__footer-item-group');
    expect(footer.text()).to.equal('Total: $554.00');
  });

  it('checkbox should not be visible on disableSelection', () => {
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
        disableSelection
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const header = table.dive().find('Block').find('Header').find('Row');
    expect(header.find('HeaderCell').at(0).find('MasterCheckbox').length).to.equal(0);
    expect(body.find('BodyCell').at(0).find('Checkbox').length).to.equal(0);
  });

  it('should trigger callback for clicking the name when user can view private materials', () => {
    const handleNameClick = sandbox.spy();
    const cloneData = groupMaterials.setIn([0, 'is_private'], true);
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={cloneData}
        selected={[]}
        handleNameClick={handleNameClick}
        canManageAllMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(1);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.true;
  });

  it('should not trigger callback for clicking the name when user cannot view private materials', () => {
    const handleNameClick = sandbox.spy();
    const cloneData = groupMaterials.setIn([0, 'is_private'], true);
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={cloneData}
        selected={[]}
        handleNameClick={handleNameClick}
        canViewPublicMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(1);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.false;
  });

  it('should trigger callback for clicking the name when user can view public materials', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
        canViewPublicMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(1);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.true;
  });

  it('should not trigger callback for clicking the name when user cannot view any materials data', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={groupMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(1);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.false;
  });

  it('should validate count and display error', () => {
    const data = groupMaterials.push(
      groupMaterials.get(0).set('id', 'ord_count_absent').setIn(['orderable_materials', '0', 'count'], ''),
      groupMaterials.get(0).set('id', 'ord_count_absent').setIn(['orderable_materials', '0', 'count'], 0),
      groupMaterials.get(0).set('id', 'ord_count_invalid').setIn(['orderable_materials', '0', 'count'], -4),
    );
    wrapper = shallow(
      <MaterialOrderGroupItems
        data={data}
        selected={[]}
        forceValidation
      />);
    const validatedComponents = wrapper.find(List).dive()
      .find(Table).dive()
      .find('Validated');
    expect(validatedComponents
      .filterWhere(ele => ele.props().error === ''))
      .to.have.lengthOf(1);
    expect(validatedComponents
      .filterWhere(ele => ele.props().error === 'Required'))
      .to.have.lengthOf(1);
    expect(validatedComponents
      .filterWhere(ele => ele.props().error === 'Must be greater than 0'))
      .to.have.lengthOf(2);
  });
});
