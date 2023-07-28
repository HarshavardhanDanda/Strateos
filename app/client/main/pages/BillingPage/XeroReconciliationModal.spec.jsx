import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Table, Column } from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';
import { Loading } from 'main/components/page';
import InvoiceActions from 'main/actions/InvoiceActions';
import  XeroReconciliationModal from './XeroReconciliationModal';
import mockData from './Mocks/XeroReconcile.json';

describe('xero reconciliation modal test', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const data = Immutable.fromJS(mockData);
  const date = 'Sun Apr 15 2007 03:14:15';
  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should show loading when data is empty', () => {
    sandbox.stub(InvoiceActions, 'fetchXeroReconcileData').returns([]);
    wrapper = shallow(<XeroReconciliationModal />);
    expect(wrapper.find(Loading)).to.have.length(1);
  });

  it('should display 6 columns', () => {
    sandbox.stub(InvoiceActions, 'fetchXeroReconcileData').returns({
      then: (cb) => {
        cb(data);
      }
    }
    );
    wrapper = shallow(<XeroReconciliationModal />);
    wrapper.find(SinglePaneModal).prop('onOpen')();
    const table = wrapper.dive().find(Table);

    expect(table.find(Column).length).to.equal(6);

    expect(table.find(Column).at(0).props().header).to.equal('ID');
    expect(table.find(Column).at(1).props().header).to.equal('Organization');
    expect(table.find(Column).at(2).props().header).to.equal('Xero Date');
    expect(table.find(Column).at(3).props().header).to.equal('Local Charged Date');
    expect(table.find(Column).at(4).props().header).to.equal('Local Created Date');
    expect(table.find(Column).at(5).props().header).to.equal('Total (Xero)');
  });

  it('should have the correct modal props', () => {
    sandbox.stub(InvoiceActions, 'fetchXeroReconcileData').returns({
      then: (cb) => {
        cb(data);
      }
    }
    );
    wrapper = shallow(<XeroReconciliationModal modalId={'XERO_RECONCILIATION_MODAL'} />);
    const modal = wrapper.find(SinglePaneModal);

    expect(modal.prop('modalSize')).to.equal('large');
    expect(modal.prop('modalId')).to.equal('XERO_RECONCILIATION_MODAL');
    expect(modal.prop('title')).to.equal('Xero Reconciliation');
    expect(modal.prop('onOpen')).to.not.equal(undefined);
  });

  it('should render modal text', () => {
    sandbox.stub(InvoiceActions, 'fetchXeroReconcileData').returns({
      then: (cb) => {
        cb(data);
      }
    }
    );
    wrapper = shallow(<XeroReconciliationModal modalId={'XERO_RECONCILIATION_MODAL'} date={date} />);

    expect(wrapper.find('p').text()).to.equal('Capturing invoices from 15 Apr 2007 through end of that month. All invoices in Xero shown here have been paid.');
  });

  it('should have the correct table props', () => {
    sandbox.stub(InvoiceActions, 'fetchXeroReconcileData').returns({
      then: (cb) => {
        cb(data);
      }
    }
    );
    wrapper = shallow(<XeroReconciliationModal modalId={'XERO_RECONCILIATION_MODAL'} date={date} />);
    wrapper.find(SinglePaneModal).prop('onOpen')();
    const table = wrapper.dive().find(Table);

    expect(table.prop('disabledSelection')).to.equal(true);
    expect(table.prop('footer')).to.equal(true);
    expect(table.prop('id')).to.equal('xero-reconcile-table');
    expect(table.prop('loaded')).to.equal(true);
    expect(table.prop('data')).to.deep.equal(data.get('merged').valueSeq().toList());
  });
});
