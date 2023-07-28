import React from 'react';
import enzyme from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Button } from '@transcriptic/amino';

import SubmitButton from './SubmitButton';

describe('RxPage SubmitButton', () => {
  it('renders a button', () => {
    const API = {
      createRun: () => new Promise(() => {})
    };
    const wrapper = enzyme.shallow(
      <SubmitButton
        ReactionAPI={API}
        reactionId="foo"
        onSuccess={() => {}}
        onFailure={() => {}}
      />
    );
    expect(wrapper.find(Button).length).to.equal(1);
    wrapper.unmount();
  });

  it('submits the reaction onclick successfully', () => {
    const API = {
      createRun: () => new Promise(() => {}, () => {})
    };
    sinon.spy(API, 'createRun');
    const wrapper = enzyme.mount(
      <SubmitButton
        ReactionAPI={API}
        reactionId="r12345"
        onSuccess={() => {}}
        onFailure={() => {}}
        setSubmitting={() => {}}
      />
    );
    const button = wrapper.find(Button);
    button.prop('onClick')(() => {});
    expect(API.createRun.called).to.be.true;
    expect(API.createRun.getCall(0).args[0]).to.equal('r12345');
  });
});
