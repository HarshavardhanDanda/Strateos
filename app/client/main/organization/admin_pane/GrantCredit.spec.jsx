import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import CreditActions from 'main/actions/CreditActions';
import GrantCredit from './GrantCredit';

describe('Grant Credit', () => {
  let component;
  const sandbox = sinon.createSandbox();

  const props = {
    isAdmin: false,
    customerOrgId: 'org13',
  };

  afterEach(() => {
    sandbox.restore();
    if (component) {
      component.unmount();
    }
  });

  it('should make a call to CreditActions if its not admin', () => {
    const createCredit = sandbox.stub(CreditActions, 'createCredit').returns({
      always: () => {}
    });
    component = shallow(<GrantCredit {...props} />);
    component.find('Button').at(1).simulate('click');
    expect(createCredit.calledOnce).to.be.true;
    expect(createCredit.calledWithExactly(
      props.customerOrgId, '', '', 'Runs', undefined
    )).to.be.true;
  });

});
