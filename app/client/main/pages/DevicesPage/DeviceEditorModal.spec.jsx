import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import DeviceEditorModal from './DeviceEditorModal';

describe('DeviceEditorModal', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
  });

  const device = {
    id: '84',
    configuration: {},
    device_class: 'echo',
    device_events: [],
    location_id: 'loc1bv7bn3r8y6v',
    manufactured_at: undefined,
    manufacturer: 'Labcyte',
    model: 'Echo 525',
    name: 'Acoustic Liquid Handler',
    purchased_at: undefined,
    serial_number: undefined
  };

  it('should render select with label', () => {
    wrapper = shallow(
      <DeviceEditorModal
        device={device}
        workUnits={Immutable.Iterable()}
        modalId={'deviceEditorModalTest'}
      />);
    const LabeledInput = wrapper.find('LabeledInput');
    expect(LabeledInput.at(2).props().label).to.equal('Device Sets');
  });
});
