import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import { DateTime, Table, Column } from '@transcriptic/amino';
import IdtOrderStore from 'main/stores/IdtOrderStore';
import { IdtOrdersTable } from './IdtOrdersPage';

const props = {
  orders: Immutable.List([
    Immutable.fromJS({
      created_at: '2017-02-25T12:00:16.398-08:00',
      id: '48',
      order_number: '13484076',
      order_placed_at: '2017-02-25T12:00:33.592-08:00',
      purchase_order: 'PO1',
      lab: {
        name: 'Menlo Park'
      }
    })
  ])
};

describe('IdtOrders page table test', () => {

  let idtOrders;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(IdtOrderStore, 'getAll').returns(props.orders);
  });
  afterEach(() => {
    if (idtOrders) idtOrders.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have Table', () => {
    idtOrders = shallow(<IdtOrdersTable {...props} />);
    expect(idtOrders.find(Table).length).to.equal(1);
  });

  it('should have 6 columns', () => {
    idtOrders = shallow(<IdtOrdersTable {...props} />);
    const table = idtOrders.find(Table);
    expect(table.find(Column).length).to.equal(6);

    expect(table.find(Column).at(0).props().header).to.equal('ID');
    expect(table.find(Column).at(1).props().header).to.equal('Order number');
    expect(table.find(Column).at(2).props().header).to.equal('Purchase Order');
    expect(table.find(Column).at(3).props().header).to.equal('Lab');
    expect(table.find(Column).at(4).props().header).to.equal('Order Placed At');
    expect(table.find(Column).at(5).props().header).to.equal('created At');
  });

  it('should have columns sortable', () => {
    idtOrders = shallow(<IdtOrdersTable {...props} />);
    const table = idtOrders.find(Table);
    expect(table.find(Column).length).to.equal(6);

    expect(table.find(Column).at(0).props().sortable).to.be.false;
    expect(table.find(Column).at(1).props().sortable).to.be.true;
    expect(table.find(Column).at(2).props().sortable).to.be.true;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.true;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
  });

  it('Check values of First row', () => {
    idtOrders = shallow(<IdtOrdersTable {...props} />);
    idtOrders.setState({ loaded: true });

    const table = idtOrders.find(Table);
    const firstRowColumns = table.dive().find('BodyCell');
    expect(firstRowColumns.at(0).dive()
      .text()).to.eql('48');
    expect(firstRowColumns.at(1).dive()
      .text()).to.eql('13484076');
    expect(firstRowColumns.at(2).dive()
      .text()).to.eql('PO1');
    expect(firstRowColumns.at(3).dive()
      .text()).to.eql('Menlo Park');
    expect(firstRowColumns.at(4).dive()
      .find(DateTime).dive()
      .text()).to.eql('Feb 25 2017, 3:00:33 pm');
    expect(firstRowColumns.at(5).dive()
      .find(DateTime).dive()
      .text()).to.eql('Feb 25 2017, 3:00:16 pm');
  });
});
