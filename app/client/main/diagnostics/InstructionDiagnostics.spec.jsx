import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import DiagnosticsActions from 'main/diagnostics/DiagnosticsActions';
import InstructionDiagnostics from './InstructionDiagnostics';

const props = {
  sensorTypes: ['temperature'],
  instruction: {
    id: 'i18pryz84e7kn',
    operation: {
      dataref: 'test_instruction',
      object: 'test_plate_384',
      mode: 'top',
      op: 'image_plate'
    },
    completed_at: '2016-02-16T10:57:21.253-08:00',
    executed_at: '2016-02-16T10:54:48.536-08:00',
    run: {
      id: 'r18pryz844aqc',
      status: 'complete',
      title: 'maxAxes test 1.4x AccX AccY 5x AccZ, MaxSpeed 800'
    },
    warps: [{
      reported_started_at: '2023-02-16T10:57:21.253-08:00',
      reported_completed_at: '2023-02-16T10:57:21.253-08:00'
    }]
  }
};

describe('InstructionDiagnostics', () => {
  let wrapper;
  let getSensorDataSpy;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    getSensorDataSpy = sandbox.spy(DiagnosticsActions, 'getSensorData');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('renders without error', () => {
    wrapper = shallow(
      <InstructionDiagnostics {...props} />
    );
  });

  it('should re-fetch sensor data when instruction prop is changed', () => {
    wrapper = shallow(<InstructionDiagnostics {...props} />);
    const instructionDiagnostics = wrapper.find('InstructionDiagnostics').dive();
    expect(getSensorDataSpy.calledOnce).to.be.true;
    instructionDiagnostics.setProps({ ...props, instruction: { ...props.instruction, id: 'i134hd74e813' } });
    expect(getSensorDataSpy.calledTwice).to.be.true;
  });

  it('should re-fetch sensor data when sensorTypes prop is changed', () => {
    wrapper = shallow(<InstructionDiagnostics {...props} />);
    const instructionDiagnostics = wrapper.find('InstructionDiagnostics').dive();
    expect(getSensorDataSpy.calledOnce).to.be.true;
    instructionDiagnostics.setProps({ ...props, sensorTypes: ['heat'] });
    expect(getSensorDataSpy.calledTwice).to.be.true;
  });

  it('should not re-fetch sensor data when same instruction prop is set', () => {
    wrapper = shallow(<InstructionDiagnostics {...props} />);
    const instructionDiagnostics = wrapper.find('InstructionDiagnostics').dive();
    expect(getSensorDataSpy.calledOnce).to.be.true;
    instructionDiagnostics.setProps({ ...props, instruction: { ...props.instruction, id: 'i18pryz84e7kn' } });
    expect(getSensorDataSpy.calledOnce).to.be.true;
  });

  it('should not re-fetch sensor data when same sensorTypes prop is set', () => {
    wrapper = shallow(<InstructionDiagnostics {...props} />);
    const instructionDiagnostics = wrapper.find('InstructionDiagnostics').dive();
    expect(getSensorDataSpy.calledOnce).to.be.true;
    instructionDiagnostics.setProps({ ...props, sensorTypes: ['temperature'] });
    expect(getSensorDataSpy.calledOnce).to.be.true;
  });
});
