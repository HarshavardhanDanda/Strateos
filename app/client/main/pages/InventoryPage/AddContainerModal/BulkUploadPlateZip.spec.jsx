import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import * as CSVUpload from 'main/inventory/components/CSVUpload';
import * as PlateCreateFromCSV from 'main/components/PlateCreateFromCSV';
import  ContainerTypeStore from 'main/stores/ContainerTypeStore';

import BulkUploadPlateZip from './BulkUploadPlateZip';

const props = {
  plateTypes: Immutable.fromJS([{ id: 0, name: 'test' }]),
  createNewPlate: () => {}
};

describe('BulkUploadPlateZIP', () => {
  let cmp;
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    if (cmp) {
      cmp.unmount();
      cmp = undefined;
    }
    sandbox.restore();
  });

  it('should mount', () => {
    cmp = shallow(
      <BulkUploadPlateZip {...props} />
    );
  });

  it('should handle ZIPs and CSVs seperately', () => {
    const handleCSV = sandbox.spy(BulkUploadPlateZip.prototype, 'handleCSV');
    const handleZIP = sandbox.spy(BulkUploadPlateZip.prototype, 'handleZIP');

    cmp = shallow(
      <BulkUploadPlateZip {...props} />
    );
    cmp.instance().handleFiles([{ uuid: 'sample-uuid-1', file: { name: 'somename.csv' } }, { uuid: 'sample-uuid-2', file: { name: 'othername.zip' } }]);

    cmp.instance().processFiles();
    expect(handleCSV.called).to.eq(true);
    expect(handleZIP.called).to.eq(true);
  });

  it('should call createNewPlate Prop from createNewPlate method', done => {

    sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve({}));
    sandbox.stub(PlateCreateFromCSV, 'createWellMap').returns(Immutable.Map({}));
    sandbox.stub(ContainerTypeStore, 'getById').returns(0);

    const fakeOnChange = () => {
      expect(createNewPlate.calledOnce).to.eq(true);
      done();
    };

    const createNewPlate = sinon.spy(fakeOnChange);

    cmp = shallow(
      <BulkUploadPlateZip {...props} createNewPlate={createNewPlate} />
    );
    cmp.setState({ plateTypeId: '0', storageCondition: 'fake_condition', coverStatus: 'foil' });

    cmp.instance().handleFiles([{ file: { name: 'somename.csv' } }]);
  });
});

describe('Drag Drop File Picker', () => {
  let csvUpload;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (csvUpload) csvUpload.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should call DragDropFilePicker component when form is filled', () => {
    const createNewPlate = sinon.spy();

    csvUpload = shallow(
      <BulkUploadPlateZip {...props} createNewPlate={createNewPlate} />
    );
    csvUpload.setState({ plateTypeId: '0', storageCondition: 'fake_condition', coverStatus: 'foil' });
    expect(csvUpload.find('DragDropFilePicker').length).to.equal(1);
  });

  it('should have inital state when the upload is aborted', () => {
    const createNewPlate = sinon.spy();
    csvUpload = shallow(
      <BulkUploadPlateZip {...props} createNewPlate={createNewPlate} />
    );
    csvUpload.setState({ plateTypeId: '0', storageCondition: 'fake_condition', coverStatus: 'foil' });
    const dragdrop = csvUpload.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    dragdrop.props().abortUpload();
    expect(csvUpload.instance().state.files).to.be.eql(Immutable.Map());
  });
});
