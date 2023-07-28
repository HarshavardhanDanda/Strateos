import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Imm from 'immutable';
import { PizzaTracker } from '@transcriptic/amino';
import DatasetAPI from 'main/api/DatasetAPI';
import FeatureStore from 'main/stores/FeatureStore';
import sinon from 'sinon';
import UploadFileModal from './UploadFileModal';
import { run } from './ItemForModalTest';

describe('UploadFileModal', () => {

  const sandbox = sinon.createSandbox();
  const testRun = Imm.fromJS(run);
  afterEach(() => {
    sandbox.restore();
  });

  const uploadWOMeasurementDataPermission = shallow(
    <UploadFileModal
      runId="r1gv6fytdba5g7"
      run={Imm.fromJS(run)}
    />
  );

  it('should have a progress bar display current step', () => {
    expect(uploadWOMeasurementDataPermission.find('PizzaTracker')).to.have.lengthOf(1);
  });

  it('configure step should not allow user without permission to manage measurement data to select between analysis and measurement', () => {
    const options = uploadWOMeasurementDataPermission.find('PizzaTracker').dive().find('Radio');
    expect(options).to.have.lengthOf(1);
    expect(options.at(0).prop('value')).to.equal('analysis');
  });

  it('configure step should allow user with permission to manage measurement data to select between analysis and measurement', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab')
      .returns(1);
    const uploadWithMeasurementDataPermission = shallow(
      <UploadFileModal
        runId={testRun.get('id')}
        run={testRun}
      />
    );
    const options = uploadWithMeasurementDataPermission.find('PizzaTracker').dive().find('Radio');
    expect(options).to.have.lengthOf(2);
    expect(options.at(0).prop('value')).to.equal('analysis');
    expect(options.at(1).prop('value')).to.equal('measurement');
  });

  it('upload step should allow user to drag and drop documents', () => {
    uploadWOMeasurementDataPermission.find('PizzaTracker').dive().find('Button').at(1)
      .simulate('click');
    uploadWOMeasurementDataPermission.update();
    expect(uploadWOMeasurementDataPermission.find('PizzaTracker').dive().find('DragDropFilePicker')).to.have.lengthOf(1);
  });

  it('should allow users with permission to select instructions', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab')
      .returns(1);
    const uploadWithMeasurementDataPermission = shallow(
      <UploadFileModal
        runId={testRun.get('id')}
        run={testRun}
      />
    );
    const event = { target: { value: 'measurement' } };
    uploadWithMeasurementDataPermission.find('PizzaTracker').dive().find('RadioGroup')
      .simulate('change', event);
    uploadWithMeasurementDataPermission.update();
    const selectButton = uploadWithMeasurementDataPermission.find('PizzaTracker').dive().find('Button').at(0);
    expect(selectButton.dive().text()).to.equal('Select instruction');
  });

  it('should have a comment when uploading', () => {
    const uploadWithMeasurementDataPermission = shallow(
      <UploadFileModal
        runId="r1gv6fytdba5g7"
        run={Imm.fromJS(run)}
        canManageMeasurementData
      />
    );
    const data = {
      type: 'datasets',
      title: 'txtfile.csv',
      run_id: 'r1gv6fytdba5g7',
      analysis_tool: '',
      analysis_tool_version: '',
      upload_id: undefined,
      comment: 'Comment'
    };
    const mockDatasetAPI = sandbox.stub(DatasetAPI, 'createDataset');
    const pizzaTracker = uploadWithMeasurementDataPermission.find(PizzaTracker);
    pizzaTracker.dive().find('TextArea').simulate('change', { target: { value: 'Comment' } });
    pizzaTracker.dive().find('Button').at(1)
      .simulate('click');
    const filePicker = uploadWithMeasurementDataPermission.find(PizzaTracker).dive().find('DragDropFilePicker');
    const file = new File([], 'txtfile.csv');
    filePicker.prop('onDrop')([{ uuid: 'sample-uuid', file: file }]);
    uploadWithMeasurementDataPermission.find(PizzaTracker).dive().find('Button').at(2)
      .simulate('click');
    expect(mockDatasetAPI.calledWithExactly(data)).to.be.true;
    uploadWithMeasurementDataPermission.unmount();
  });

  it('should not display note when open upload file modal', () => {
    const wrapper = shallow(
      <UploadFileModal
        runId="r1gv6fytdba5g7"
        run={Imm.fromJS(run)}
      />);
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal').dive()
      .find('PizzaTracker')
      .dive()
      .find('TextArea')
      .dive()
      .prop('value')).to.equal('');
  });

  it('should allow multiple files upload when data type is analysis', () => {
    const wrapper = shallow(
      <UploadFileModal
        runId="r1gv6fytdba5g7"
        run={Imm.fromJS(run)}
      />);
    wrapper.find(PizzaTracker).dive().find('Button').at(1)
      .simulate('click');
    expect(wrapper.find('PizzaTracker')
      .dive().find('DragDropFilePicker').props().multiple).equal(true);
    wrapper.unmount();
  });

  it('should call the required apis when multiple files are uploaded', () => {
    const wrapper = shallow(
      <UploadFileModal
        runId="r1gv6fytdba5g7"
        run={Imm.fromJS(run)}
      />
    );
    const mockDatasetAPI = sandbox.stub(DatasetAPI, 'createDataset');
    wrapper.find(PizzaTracker).dive().find('Button').at(1)
      .simulate('click');
    const filePicker = wrapper.find(PizzaTracker).dive().find('DragDropFilePicker');
    const file_1 = new File([], '1.csv');
    const file_2 = new File([], '2.csv');
    filePicker.prop('onDrop')([{ uuid: 'sample-uuid-1', file: file_1 }, { uuid: 'sample-uuid-2', file: file_2 }]);
    wrapper.find(PizzaTracker).dive().find('Button').at(2)
      .simulate('click');
    expect(mockDatasetAPI.calledTwice).to.be.true;
    wrapper.unmount();
  });

  it('should allow only single file when data type is measurement', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab')
      .returns(1);
    const wrapper = shallow(
      <UploadFileModal
        runId="r1gv6fytdba5g7"
        run={Imm.fromJS(run)}
      />);
    const event = { target: { value: 'measurement' } };
    wrapper.find(PizzaTracker).dive().find('RadioGroup')
      .simulate('change', event);
    wrapper.find(PizzaTracker).dive().find('Button').at(2)
      .simulate('click');

    expect(wrapper.find('PizzaTracker')
      .dive().find('DragDropFilePicker').props().multiple).equal(false);
    wrapper.unmount();
  });

});
