import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import CreditActions from 'main/actions/CreditActions';
import InvoiceAPI from '../../../api/InvoiceAPI';
import ApplyCreditModal from './modal';

describe('Apply Credit', () => {
  let component;
  const sandbox = sinon.createSandbox();

  const props = {
    isAdmin: false,
    customerOrgId: 'org13',
    customerSubdomain: 'test',
    modalId: 'ApplyCreditCardModalId'
  };

  afterEach(() => {
    sandbox.restore();
    if (component) {
      component.unmount();
    }
  });

  it('should make approriate api calls if its not admin', () => {
    const loadByOrg = sandbox.stub(CreditActions, 'loadByOrg').returns({
      done: (cb) => {
        cb();
        return {
          always: () => {} };
      },
    });

    const indexAll = sandbox.stub(InvoiceAPI, 'indexAll').returns({
      done: (cb) => {
        cb();
        return {
          always: () => {} };
      },
    });

    component = shallow(<ApplyCreditModal {...props} />);
    const applyCreditToInvoiceProps = component.dive().dive().find('ApplyCreditToInvoice').props();
    expect(loadByOrg.calledOnce).to.be.true;
    expect(loadByOrg.calledWithExactly(props.customerSubdomain, props.customerOrgId)).to.be.true;
    expect(indexAll.calledOnce).to.be.true;
    expect(indexAll.calledWithExactly({ filters: { organization_id: props.customerOrgId },
      version: 'v1',
      limit: 100,
      includes: ['payment_method']
    })).to.be.true;
    expect(applyCreditToInvoiceProps.customerSubdomain).to.equal(props.customerSubdomain);
    expect(applyCreditToInvoiceProps.isAdmin).to.equal(props.isAdmin);
  });
});
