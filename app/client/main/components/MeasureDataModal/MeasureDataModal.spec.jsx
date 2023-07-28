import React                        from 'react';
import Immutable                    from 'immutable';
import MeasureDataModal             from 'main/components/MeasureDataModal';
import testRun                      from 'main/test/run-json/everyInstructionAdminRun.json';
import { expect }                   from 'chai';
import { shallow }                  from 'enzyme';
import Sinon                        from 'sinon';
import Papa                         from 'papaparse';

describe('MeasureDataModal', () => {
  const immutableTestRun = Immutable.fromJS(testRun);
  const measureConcentration = testRun.instructions.filter(i => i.operation.op === 'measure_concentration')[0];
  const immutableInstruction = Immutable.fromJS(measureConcentration);
  let wrapper;
  const sandbox = Sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render without throwing', () => {
    return shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
  });

  it('should have a dragdrop component', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    expect(wrapper.find('DragDropFilePicker').length).to.equal(1);
  });

  it('should have inital state when the upload is aborted', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    wrapper.instance().setState({ file: { name: 'xyz.csv', status: 'uploading' } });
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().abortUpload();
    expect(wrapper.instance().state.file).to.be.eql(undefined);
  });

  it('when file uploaded papa parser should triggered', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    const parse = sandbox.stub(Papa, 'parse');
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    expect(parse.calledOnce).to.be.true;
  });

  it('should display danger alert message when have parsing errors', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    const mockData = [1, 2, 3];
    wrapper.instance().setState({ csvParsingErrors: mockData });
    expect(wrapper.find('#danger').hasClass('alert-danger')).to.be.true;
  });

  it('should display success alert message when no errors', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    wrapper.instance().setState({ loadedDataFromCSV: true });
    expect(wrapper.find('#success').hasClass('alert-success')).to.be.true;
  });

  it('should trigger papa parser when retry upload action performed', () => {
    wrapper = shallow(
      <MeasureDataModal
        title="Measure Fun Times"
        run={immutableTestRun}
        instruction={immutableInstruction}
        onInstructionUpdate={() => {}}
        modalId="abc123"
      />
    );
    const parse = sandbox.stub(Papa, 'parse');
    wrapper.instance().setState({ file: { uuid: 'uuid', file: { name: 'xyz.csv' }, status: 'fail' } });
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().retryUpload();
    expect(parse.calledOnce).to.be.true;
  });
  // I tried to do some more substantial testing here, but was having a problem with children rendering. Specifically,
  // I was not able to find MeasureData components in the tree
});
