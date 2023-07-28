import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import TimeChart from 'main/diagnostics/charting/TimeChart';
import { SensorDataChart } from './SensorDataChart';

const testData = Immutable.fromJS([{ x: 'xfoo', y: 'ybar' }]);

describe('SensorDataChart', () => {
  let wrapper;
  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('renders without error', () => {
    shallow(
      <SensorDataChart
        data={testData}
        width={500}
        height={500}
        sensorType="foo"
        epochRange={[1000000, 10000000]}
      />
    );
  });

  it('renders a TimeChart', () => {
    wrapper = shallow(
      <SensorDataChart
        data={testData}
        width={500}
        height={500}
        sensorType="foo"
        epochRange={[1000000, 10000000]}
      />
    );
    expect(wrapper.find(TimeChart).length).to.equal(1);
  });

  it('uses identity function for labeling unknown sensor types', () => {
    wrapper = shallow(
      <SensorDataChart
        data={testData}
        width={500}
        height={500}
        sensorType="unknown-sensor-type"
        epochRange={[1000000, 10000000]}
      />
    );
    const timeChart = wrapper.find(TimeChart).first();
    const labelForTick = timeChart.props().labelForTick;
    expect(typeof labelForTick).to.equal('function');
    expect(labelForTick(100)).to.equal(100);
  });

  it('formatterForType', () => {
    expect(typeof SensorDataChart.formatterForType()).to.equal('function');
    expect(typeof SensorDataChart.formatterForType('foo')).to.equal('function');

    // temp
    const lidTempLabeler = SensorDataChart.formatterForType('lidTemp');
    expect(lidTempLabeler(25.0304)).to.equal('25.03');

    // gforce
    const gForceLabeler = SensorDataChart.formatterForType('gForce');
    expect(gForceLabeler(25.0304)).to.equal('25.0');
  });
});
