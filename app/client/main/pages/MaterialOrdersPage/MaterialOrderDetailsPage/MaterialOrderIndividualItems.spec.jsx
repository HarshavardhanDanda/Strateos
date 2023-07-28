import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { List, Table } from '@transcriptic/amino';

import MaterialStore from 'main/stores/MaterialStore';
import { individualMaterials } from 'main/pages/MaterialOrdersPage/mocks/materials.js';
import MaterialOrderIndividualItems from './MaterialOrderIndividualItems';

describe('MaterialOrderIndividualItems', () => {
  const sandbox = sinon.createSandbox();
  const privateMaterials = individualMaterials.setIn([0, 'is_private'], true);
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have 7 visible columns', () => {
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const header = table.dive().find('Block').find('Header').find('Row');
    expect(table.length).to.equal(1);
    expect(table.dive().instance().props.children.length).to.equal(7);
    expect(header.find('HeaderCell').at(1).dive().text()).to.equal('structure');
    expect(header.find('HeaderCell').at(2).dive().text()).to.equal('name');
    expect(header.find('HeaderCell').at(3).dive().text()).to.equal('vendor');
    expect(header.find('HeaderCell').at(4).dive().text()).to.equal('sku');
    expect(header.find('HeaderCell').at(5).dive().text()).to.equal('quantity');
    expect(header.find('HeaderCell').at(6).dive().text()).to.equal('amount');
    expect(header.find('HeaderCell').at(7).dive().text()).to.equal('cost');
  });

  it('should display rows', () => {
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(table.length).to.equal(1);
    expect(body.find('BodyCell').at(1).find('div').find('Molecule')
      .prop('SMILES')).to.equal('CCCCC');
    expect(body.find('BodyCell').at(2).dive().text()).to.equal('BetaPharma');
    expect(body.find('BodyCell').at(3).dive().text()).to.equal('eMolecules');
    expect(body.find('BodyCell').at(4).dive().text()).to.equal('436500315');
    expect(body.find('BodyCell').at(5).find('TextInput').prop('value')).to.equal(1);
    expect(body.find('BodyCell').at(6).dive().text()).to.equal('500mg');
    expect(body.find('BodyCell').at(7).dive().text()).to.equal('$554.00');
  });

  it('should display totalCost in footer', () => {
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
      />);
    const footer = wrapper.find('.material-order-items__footer-item');
    expect(footer.text()).to.equal('Total: $554.00');
  });

  it('checkbox should not be visible on disableSelection', () => {
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
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

  it('should render the items from materials in new order', () => {
    sandbox.stub(MaterialStore, 'getById').returns(individualMaterials.getIn(['0']));
    const spy = sandbox.spy(MaterialOrderIndividualItems.prototype, 'lowestAmountRender');
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        disableSelection
        isCreatedFromMaterials
        handleMaterialsByAmount={() => {}}
      />);
    expect(spy.calledOnce).to.be.true;
  });

  it('should render select component if isCreatedFromMaterials is true in amount column', () => {
    sandbox.stub(MaterialStore, 'getById').returns(individualMaterials.getIn([0]));
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        isCreatedFromMaterials
        handleMaterialsByAmount={() => {}}
      />);

    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(body.find('BodyCell').at(6).dive().find('Select').length).to.equal(1);
  });

  it('should not render select component if isCreatedFromMaterials is false', () => {
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        isCreatedFromMaterials={false}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    expect(body.find('BodyCell').at(6).dive().find('Select').length).to.equal(0);
  });

  it('should trigger callback on changing of amount', () => {
    sandbox.stub(MaterialStore, 'getById').returns(individualMaterials.getIn([0]));
    const handleMaterialsByAmount = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        isCreatedFromMaterials
        handleMaterialsByAmount={handleMaterialsByAmount}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const select = body.find('Select');
    expect(select.length).to.equal(1);
    expect(handleMaterialsByAmount.calledOnce).to.be.false;
    select.simulate('change', { target: { value: 's1' } });
    expect(handleMaterialsByAmount.calledOnce).to.be.true;
  });

  it('should redirect to the compound page on clicking the compound', () => {
    const onCompoundClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        onCompoundClick={onCompoundClick}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const structure = body.find('BodyCell').at(1);
    structure.find('div').simulate('click', { stopPropagation: () => undefined });
    expect(onCompoundClick.calledOnce).to.be.true;
  });

  it('should not redirect to the compound page on clicking the compound when user cannot view the compound', () => {
    const onCompoundClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const structure = body.find('BodyCell').at(1);
    structure.find('div').simulate('click');
    expect(onCompoundClick.calledOnce).to.be.false;
  });

  it('should trigger callback for clicking the name when user can view private materials', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
        canManageAllMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(2);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.true;
  });

  it('should not trigger callback for clicking the name when user cannot view private materials', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={privateMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
        canViewPublicMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(2);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.false;
  });

  it('should trigger callback for clicking the name when user can view public materials', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
        canViewPublicMaterials
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(2);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.true;
  });

  it('should not trigger callback for clicking the name when user cannot view any materials data', () => {
    const handleNameClick = sandbox.spy();
    wrapper = shallow(
      <MaterialOrderIndividualItems
        data={individualMaterials}
        selected={[]}
        handleNameClick={handleNameClick}
      />);
    const table = wrapper.find(List).dive().find(Table);
    const body = table.dive().find('Block').find('Body').find('Row')
      .at(0);
    const nameCell = body.find('BodyCell').at(2);
    nameCell.find('div').simulate('click');
    expect(handleNameClick.calledOnce).to.be.false;
  });

  it('should validate count and display error', () => {
    const data = individualMaterials.push(
      individualMaterials.get(0).set('id', 'ord_count_absent').setIn(['orderable_materials', '0', 'count'], ''),
      individualMaterials.get(0).set('id', 'ord_count_absent').setIn(['orderable_materials', '0', 'count'], 0),
      individualMaterials.get(0).set('id', 'ord_count_invalid').setIn(['orderable_materials', '0', 'count'], -4),
    );
    wrapper = shallow(
      <MaterialOrderIndividualItems
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
