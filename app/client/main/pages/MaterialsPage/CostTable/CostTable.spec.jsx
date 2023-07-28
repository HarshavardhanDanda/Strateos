import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import { Button } from '@transcriptic/amino';
import CostTable from './CostTable';

const data = Immutable.fromJS([
  {
    cost: 200,
    unit: 'mL',
    sku: '23456',
    amount: 15
  },
  {
    cost: 350,
    unit: 'mL',
    sku: '234567',
    amount: 30
  },
  {
    cost: 500,
    unit: 'mL',
    sku: '23456',
    amount: 45
  }
]);

describe('Materials CostTable', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(Date, 'now').returns('1619825009639');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render table when data is passed', () => {
    wrapper = mount(<CostTable data={data} />);
    const headers = wrapper.find('.cost-table__sub_div');
    expect(headers.length).to.equal(4);
    expect(headers.at(0).text()).to.equal('AMOUNT');
    expect(headers.at(1).text()).to.equal('UNIT');
    expect(headers.at(2).text()).to.equal('COST');
    expect(headers.at(3).text()).to.equal('SKU');
    const firstRow = wrapper.find('.inplace-input__content').at(0).find('p');
    expect(firstRow.at(0).text()).to.equal('15');
    expect(firstRow.at(1).text()).to.equal('mL');
    expect(firstRow.at(2).text()).to.equal('$200');
    expect(firstRow.at(3).text()).to.equal('23456');
  });

  it('should not show footer and edit button when footer and editable is not passed', () => {
    wrapper = mount(<CostTable data={data} />);
    const footer = wrapper.find('AddInplace').find(Button);
    expect(footer.length).to.equal(0);
    const firstRow = wrapper.find('tr').at(1);
    firstRow.find('.inplace-input__actions').simulate('mouseenter');
    const edit = firstRow.find(Button);
    expect(edit.length).to.equal(0);
  });

  it('should render "enabled checkin button", when displayCheckin is passed, and is not editable', () => {
    const onCheckinSpy = sandbox.spy();
    wrapper = mount(<CostTable data={data}  displayCheckIn onCheckIn={onCheckinSpy} editable={false} />);
    const headers = wrapper.find('.cost-table__sub_div');
    expect(headers.at(4).text()).to.equal('CHECKIN');
    const checkinButton = wrapper.find(Button).filterWhere((button) => button.text() === 'Checkin');
    checkinButton.at(0).simulate('click');
    expect(checkinButton.at(0).props().disabled).to.be.false;
    expect(onCheckinSpy.calledOnce).to.be.true;
    expect(checkinButton).to.have.length(3);
  });

  it('should render "disabled checkin button", when displayCheckin is passed, and is editable', () => {
    const onCheckinSpy = sandbox.spy();
    wrapper = mount(<CostTable data={data}  displayCheckIn onCheckIn={onCheckinSpy} editable />);
    const headers = wrapper.find('.cost-table__sub_div');
    expect(headers.at(4).text()).to.equal('CHECKIN');
    const checkinButton = wrapper.find(Button).filterWhere((button) => button.text() === 'Checkin');
    expect(checkinButton.at(0).props().disabled).to.be.true;
    expect(checkinButton).to.have.length(3);
  });

  it('should show add new cost item button in footer when footer prop is passed', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = mount(<CostTable data={data} editable onChange={onChangeSpy} />);
    const footer = wrapper.find('AddInplace').find(Button);
    expect(footer.find('span').text()).to.equal('Add cost item');
    footer.simulate('click');
    const newRow = wrapper.find('.inplace-input__content').at(3);
    newRow.find('input').at(0).simulate('change', { target: { name: 'cost', value: 3 } });
    expect(newRow.find('input').length).to.equal(4);
    const rowActions = wrapper.find('.inplace-input__actions').at(3);
    expect(rowActions.find('i').length).to.equal(2);
    rowActions.simulate('mouseenter');
    rowActions.find('i').at(1).simulate('click');
    expect(onChangeSpy.calledOnce).to.be.true;
    expect(onChangeSpy.getCall(0).args[0].toJS()).to.deep.equal([
      {
        cost: 200,
        unit: 'mL',
        sku: '23456',
        amount: 15
      },
      {
        cost: 350,
        unit: 'mL',
        sku: '234567',
        amount: 30
      },
      {
        cost: 500,
        unit: 'mL',
        sku: '23456',
        amount: 45
      }, {
        amount: '',
        cost: 3,
        sku: '',
        unit: 'µL'
      }
    ]);
  });

  it('row should be editable when editable prop is passed', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = mount(<CostTable data={data} editable onChange={onChangeSpy} />);
    const firstRow = wrapper.find('tr').at(1);
    firstRow.find('.inplace-input__actions').simulate('mouseenter');
    const edit = firstRow.find(Button).at(0);
    edit.simulate('click');
    const updatedFirstRow = wrapper.find('tr').at(1);
    updatedFirstRow.find('input').at(0).simulate('change', { target: { name: 'cost', value: 3 } });
    expect(updatedFirstRow.find('input').length).to.equal(4);
    expect(updatedFirstRow.find('.inplace-input__actions').find('i').length).to.equal(2);
    const accept = updatedFirstRow.find('.inplace-input__actions').find('i').at(1);
    accept.simulate('click');
    expect(onChangeSpy.calledOnce).to.be.true;
    expect(onChangeSpy.getCall(0).args[0].toJS()).to.deep.equal([
      {
        cost: 3,
        unit: 'mL',
        sku: '23456',
        amount: 15
      },
      {
        cost: 350,
        unit: 'mL',
        sku: '234567',
        amount: 30
      },
      {
        cost: 500,
        unit: 'mL',
        sku: '23456',
        amount: 45
      }
    ]);
  });

  it('should delete row when delete action is performed on row', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = mount(<CostTable data={data} editable onChange={onChangeSpy} />);
    expect(wrapper.find('tr').length).to.equal(4);
    const firstRow = wrapper.find('tr').at(1);
    firstRow.find('.inplace-input__actions').simulate('mouseenter');
    const rowDelete = firstRow.find(Button).at(1);
    rowDelete.simulate('click');
    expect(onChangeSpy.calledOnce).to.be.true;
    expect(onChangeSpy.getCall(0).args[0].toJS()).to.deep.equal([
      {
        cost: 350,
        unit: 'mL',
        sku: '234567',
        amount: 30
      },
      {
        cost: 500,
        unit: 'mL',
        sku: '23456',
        amount: 45
      }
    ]);
  });

  it('should preserve editing changes when deleting previous row', () => {
    wrapper = mount(<CostTable data={data} editable onChange={() => { }} />);

    let secondRow = wrapper.find('tr').at(2);
    secondRow.find('.inplace-input__actions').simulate('mouseenter');
    secondRow.find(Button).at(0).simulate('click');
    secondRow = wrapper.find('tr').at(2);
    secondRow.find('input').at(0).simulate('change', { target: { name: 'cost', value: 999 } });

    let firstRow = wrapper.find('tr').at(1);
    firstRow.find('CostRow').prop('onDelete')();
    wrapper.update();
    firstRow = wrapper.find('tr').at(1);

    expect(wrapper.find('tr').length).to.equal(3);
    expect(firstRow.find('button.inplace-input__action--accept').length).to.equal(1);
    expect(firstRow.find('TextInput').at(1).prop('value')).to.equal(999);
    expect(wrapper.state().data.toJS()).to.deep.equal([
      {
        key: '16198250096391',
        cost: 350,
        unit: 'mL',
        sku: '234567',
        amount: 30
      },
      {
        key: '16198250096392',
        cost: 500,
        unit: 'mL',
        sku: '23456',
        amount: 45
      }
    ]);
  });

  it('should show View Stock button in View mode when displayViewStock is true', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    wrapper = mount(<CostTable data={data} displayViewStock isValidMaterial />);
    const headers = wrapper.find('.cost-table__sub_div');
    expect(headers.at(4).text()).to.equal('STOCK');

    const viewStockButton = wrapper.find(Button).filterWhere((button) => button.text() === 'View Stock');
    expect(viewStockButton).to.have.length(3);
  });

  it('should show View Stock button in Edit mode when displayViewStock is true', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    wrapper = mount(<CostTable data={data} displayViewStock editable isValidMaterial />);

    const viewStockButton = wrapper.find(Button).filterWhere((button) => button.text() === 'View Stock');
    expect(viewStockButton).to.have.length(3);
  });
});
