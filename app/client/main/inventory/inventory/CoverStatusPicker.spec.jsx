import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import ModalActions from 'main/actions/ModalActions';

import CoverStatusPicker from './CoverStatusPicker';

describe('CoverStatusPicker', () => {
  const sandbox = sinon.createSandbox();
  let coverStatusPicker;

  afterEach(() => {
    if (coverStatusPicker) {
      coverStatusPicker.unmount();
    }

    sandbox.restore();
  });

  it('should have a modal id', () => {
    expect(CoverStatusPicker.MODAL_ID).to.equal('COVER_STATUS_PICKER');
  });

  it('should render a modal', () => {
    const updateCoverStatus = sandbox.stub(CoverStatusPicker.prototype, 'updateCoverStatus');
    coverStatusPicker = shallow(
      <CoverStatusPicker options={[{ value: 'uncovered' }]} />
    );

    const modal = coverStatusPicker.find('ConnectedSinglePaneModal');
    expect(modal.length).to.equal(1);
    expect(modal.prop('title')).to.equal('Select cover status');
    expect(modal.prop('acceptText')).to.equal('Assign');

    expect(updateCoverStatus.notCalled).to.be.true;
    modal.prop('onAccept')();
    expect(updateCoverStatus.calledOnce).to.be.true;
  });

  it('should update cover status with uncovered', () => {
    const onChange = sandbox.stub();
    const dismiss = sandbox.stub(CoverStatusPicker.prototype, 'dismiss');

    coverStatusPicker = shallow(
      <CoverStatusPicker options={[{ value: 'foo' }, { value: 'uncovered' }]} onChange={onChange} />
    );
    coverStatusPicker.setState({ value: 'uncovered' });

    const ins = coverStatusPicker.instance();

    expect(onChange.notCalled).to.be.true;
    expect(dismiss.notCalled).to.be.true;
    ins.updateCoverStatus();
    // eslint-disable-next-line no-null/no-null
    expect(onChange.calledWithExactly(null)).to.be.true;
    expect(dismiss.calledOnce).to.be.true;
  });

  it('should update cover status with another value', () => {
    const onChange = sandbox.stub();
    const dismiss = sandbox.stub(CoverStatusPicker.prototype, 'dismiss');

    coverStatusPicker = shallow(
      <CoverStatusPicker options={[{ value: 'foo' }, { value: 'uncovered' }]} onChange={onChange} />
    );
    coverStatusPicker.setState({ value: 'foo' });

    const ins = coverStatusPicker.instance();

    expect(onChange.notCalled).to.be.true;
    expect(dismiss.notCalled).to.be.true;
    ins.updateCoverStatus();
    expect(onChange.calledWithExactly('foo')).to.be.true;
    expect(dismiss.calledOnce).to.be.true;
  });

  it('should dismiss modal', () => {
    const close = sandbox.stub(ModalActions, 'close');
    coverStatusPicker = shallow(
      <CoverStatusPicker options={[{ value: 'foo' }, { value: 'uncovered' }]} />
    );

    const ins = coverStatusPicker.instance();

    expect(close.notCalled).to.be.true;
    ins.dismiss();
    expect(close.calledWithExactly('COVER_STATUS_PICKER')).to.be.true;
  });
});
