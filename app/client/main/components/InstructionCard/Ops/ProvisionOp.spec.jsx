import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import { Param } from '@transcriptic/amino';
import { WellTag }     from 'main/components/InstructionTags/index';
import Unit            from 'main/components/unit';

import ProvisionOp from './ProvisionOp';

describe('Provision', () => {
  it('provision volume without measure_mode', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        to: [
          {
            volume: '52.3456:milliliter',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('52345.6:microliter');

  });

  it('provision volume in milliliters without decimals', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'volume',
        to: [
          {
            volume: '50:milliliter',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const params = wrapper.find(Param);
    expect(params.length).to.equal(2);
    expect(params.find({ value: 'rs17gmh5wafm5p' }).exists()).to.be.true;
    const wellTag = wrapper.find(WellTag);
    expect(wellTag.props().refName).to.equal('w1/0');
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('50:milliliter');

  });

  it('provision volume in milliliters with decimals', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'volume',
        to: [
          {
            volume: '52.3456:milliliter',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('52345.6:microliter');

  });

  it('provision mass in grams without decimals', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'mass',
        to: [
          {
            mass: '50:gram',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('50:gram');

  });

  it('provision mass in grams with decimals', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'mass',
        to: [
          {
            mass: '52.3456:gram',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('52345.6:milligram');

  });

  it('provision with invalid measurement mode', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'invalid',
        to: [
          {
            mass: '52.3456:gram',
            well: 'w1/0'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    expect(unit.props().value).to.equal('Unsupported Measurement Mode');

  });

  it('provision in multiple wells', () => {
    const instruction = {
      operation: {
        op: 'provision',
        resource_id: 'rs17gmh5wafm5p',
        measurement_mode: 'mass',
        to: [
          {
            mass: '52.3456:gram',
            well: 'w1/0'
          },
          {
            mass: '52.3456:gram',
            well: 'w1/1'
          }
        ]
      }
    };
    const run = Immutable.fromJS({
      refs: [{ name: 'foo' }]
    });
    const wrapper = mount(<ProvisionOp instruction={instruction} run={run} />);
    const unit = wrapper.find(Unit);
    const wellTag = wrapper.find(WellTag);
    expect(unit.length).to.be.equals(2);
    expect(wellTag.length).to.be.equals(2);

  });
});
