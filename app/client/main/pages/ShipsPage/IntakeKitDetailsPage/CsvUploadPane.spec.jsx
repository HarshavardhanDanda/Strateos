import React        from 'react';
import { expect }   from 'chai';
import { shallow }    from 'enzyme';
import sinon        from 'sinon';

import Papa       from 'papaparse';
import * as CSVUpload from 'main/inventory/components/CSVUpload';

import CsvUploadPane from './CsvUploadPane';

describe('csv upload pane tests', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  const items = [
    {
      id: 123,
      container_type_id: 'a1-vial',
      barcode: 'b123',
      isValid: false,
      containerId: ''
    },
    {
      id: 234,
      container_type_id: 'd1-vial',
      barcode: 'b1234',
      isValid: false,
      containerId: ''
    },
    {
      id: 345,
      container_type_id: 'd2-vial',
      barcode: 'b1235',
      isValid: false,
      containerId: ''
    },
    {
      id: 456,
      container_type_id: 'd1-vial',
      barcode: 'b234',
      isValid: false,
      containerId: ''
    }
  ];

  const handleBarcodeUpdate = sandbox.stub();

  it('should have drag and drop', () => {
    wrapper = shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    expect(wrapper.find('DragDropFilePicker')).to.have.length(1);
  });

  it('should trigger onDrop when a file is dropped', () => {
    const onDrop = sandbox.stub(CsvUploadPane.prototype, 'onDrop');
    wrapper = shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    expect(onDrop.calledOnce).to.be.true;
  });

  it('should have inital state when the upload is aborted', () => {
    wrapper = shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    dragdrop.props().abortUpload();
    expect(wrapper.instance().state.files).to.deep.equal([]);
    expect(wrapper.instance().state.uploadStatus).to.equal('none');
  });

  it('should trigger onRetryAndAbort when we try to retry or abort upload', () => {
    const onRetryAndAbort = sandbox.stub(CsvUploadPane.prototype, 'onRetryAndAbort');
    wrapper = shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const dragdrop = wrapper.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    dragdrop.props().retryUpload();
    expect(onRetryAndAbort.calledOnce).to.be.true;
    dragdrop.props().abortUpload();
    expect(onRetryAndAbort.calledTwice).to.be.true;
  });

  it('should have bulk intake kit information link', () => {
    wrapper = shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    expect(wrapper.find('a').first().text()).eq('Download the expected csv format');
  });

  it('should give CSV format error when incorrect CSV is given',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const file = new File(
      [`barcode,,format
      abc123,A1,,,`],
      'incorrect.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('CSV Format error, please check your CSV file and retry.');
  });

  it('should give empty CSV file error when empty CSV is given',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve({}));

    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const file = new File(
      [', , , , '],
      'empty.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('Empty CSV file, please check your CSV file and retry.');
  });

  it('should give invalid vial type error when invalid vials type CSV is given',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    const data = [
      {
        format: 'd3-vial',
        barcode: 'b1234'
      }
    ];
    sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(data));

    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const file = new File([''], 'invalidcount.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('Vials should only be of type A1, D1 or D2, please check your CSV file and retry.');
  });

  it('should give invalid count error when invalid vials count CSV is given',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    const data = [
      {
        format: 'd1-vial',
        barcode: 'b1234'
      },
      {
        format: 'd1-vial',
        barcode: 'b134'
      },
      {
        format: 'd1-vial',
        barcode: 'b1235'
      }
    ];
    sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(data));

    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const file = new File(
      [`format,barcode,
      D2,b123,D2,b234,D2,b345,D2,b345,D2,b345,D2,b345,D2,b345,D2,b345,`],
      'invalidcount.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('Some of the vials are exceeding the expected count, please check your CSV file and retry.');
  });

  it('should throw an error if CSV header is wrong',  async () => {
    const onTextSpy = sandbox.spy(CsvUploadPane.prototype, 'showBannerError');
    const data = [
      {
        type: 'd1-vial',
        barcode: 'b1234'
      },
      {
        format: 'd1-vial',
        barcode: 'b1234'
      }
    ];
    sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(data));

    sandbox.stub(Papa, 'parse').throws();
    wrapper =  shallow(<CsvUploadPane items={items} handleBarcodeUpdate={handleBarcodeUpdate} />);
    const file = new File(
      [`format,barcode,
      D2,b123,D2,b234,D2,b345,D2,b345,D2,b345,D2,b345,D2,b345,D2,b345,`],
      'invalidcount.csv');
    await wrapper.instance().handleCsv(file);
    expect(onTextSpy.calledOnce).to.be.true;
    expect(wrapper.state().bannerMessage)
      .to.eql('Mandatory headers missing in CSV file. Expected, format and barcode as headers');
  });
});
