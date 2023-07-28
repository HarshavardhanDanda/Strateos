import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Button } from '@transcriptic/amino';

import InvoiceProviderIdEdit from './InvoiceProviderIdEdit';

describe('Invoice provider id edit', () => {
  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
    if (component) {
      component.unmount();
    }
  });

  it('should render', () => {
    component = shallow(<InvoiceProviderIdEdit initialValue="foo" onSave={() => {}} />);
  });

  it('should change value on text input', () => {
    component = shallow(<InvoiceProviderIdEdit initialValue="foo" onSave={() => { }} />);

    expect(component.state('value')).to.equal('foo');

    const input = component.find('TextInput');
    input.simulate('change', { target: { value: 'bar' } });

    expect(component.state('value')).to.equal('bar');
  });

  it('should save the value', () => {
    const save = sandbox.stub().returns({ always: () => {} });
    component = shallow(<InvoiceProviderIdEdit initialValue="foo" onSave={save} />);

    const input = component.find('TextInput');
    input.simulate('change', { target: { value: 'ABC123' } });

    const button = component.find(Button);
    button.simulate('click');

    expect(save.calledOnce).to.be.true;
    expect(save.args[0][0]).to.equal('netsuite_customer_id');
    expect(save.args[0][1]).to.equal('ABC123');
  });
});
