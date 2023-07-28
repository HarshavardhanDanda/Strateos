import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import _ from 'lodash';
import { Button } from '@transcriptic/amino';
import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';

import WellInputs from './WellInputs';

describe('Well inputs test', () => {

  let wellInputs;
  const sandbox = sinon.createSandbox();

  const props = {
    selectedWells: Immutable.fromJS({
      0: {
        selected: true,
        hasError: true,
        hasVolume: true,
        name: '',
        volume: '',
        mass: ''
      }
    }),
    maxVolume: '160.0',
    onChange: () => {},
    onClear: () => {},
    forceValidate: true
  };

  afterEach(() => {
    wellInputs.unmount();
    sandbox.restore();
  });

  it('hasError value is true when volume is not in between 0 and 160', () => {
    sandbox.stub(PlateCreateLogic, 'massVolumeError').returns({ volumeError: 'Must be between 0 and 160.0', massError: undefined });

    const onChange = sinon.spy();
    const testProps = _.assign(props, { onChange: onChange });
    wellInputs = shallow(<WellInputs {...testProps} />);
    const input = wellInputs.find('InputWithUnits').first();
    input.simulate('change', { target: { value: 0 } });
    expect(onChange.calledWith('volume', 0, true)).to.be.true;
  });

  it('hasError value is false when volume is in between 0 and 160', () => {
    sandbox.stub(PlateCreateLogic, 'massVolumeError').returns({ volumeError: undefined, massError: undefined });

    const onChange = sinon.spy();
    const testProps = _.assign(props, { onChange: onChange });
    wellInputs = shallow(<WellInputs {...testProps} />);
    const input = wellInputs.find('InputWithUnits').first();
    input.simulate('change', { target: { value: 12 } });
    expect(onChange.calledWith('volume', 12, false)).to.be.true;
  });

  it('hasError value is true when mass is in between 0 and 320 and volume is not in between 0 and 160', () => {
    sandbox.stub(PlateCreateLogic, 'massVolumeError').returns({ volumeError: 'Must be between 0 and 160.0', massError: undefined });

    const onChange = sinon.spy();
    const testProps = _.assign(props, { onChange: onChange });
    wellInputs = shallow(<WellInputs {...testProps} />);
    const input = wellInputs.find('InputWithUnits').last();
    input.simulate('change', { target: { value: 2 } });
    expect(onChange.calledWith('mass', 2, true)).to.be.true;
  });

  it('hasError value is false when volume is in between 0 and 160 and mass is in between 0 and 320', () => {
    sandbox.stub(PlateCreateLogic, 'massVolumeError').returns({ volumeError: undefined, massError: undefined });

    const onChange = sinon.spy();
    const testProps = _.assign(props, { onChange: onChange });
    wellInputs = shallow(<WellInputs {...testProps} />);
    const input = wellInputs.find('InputWithUnits').last();
    input.simulate('change', { target: { value: 12 } });
    expect(onChange.calledWith('mass', 12, false)).to.be.true;
  });

  it('Should contain clear selected wells button', () => {
    const onChange = sinon.spy();
    const testProps = _.assign(props, { onChange: onChange });
    wellInputs = shallow(<WellInputs {...testProps} />);
    const button = wellInputs.find('div').last();
    expect(button.hasClass('clear-wells')).to.be.true;
    expect(wellInputs.find(Button).shallow().find('span').text()).to.be.equal('Clear selected wells');
  });
});
