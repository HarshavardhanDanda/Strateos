import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { DragDropFilePicker } from '@transcriptic/amino';
import CSVUtil from 'main/util/CSVUtil';
import Papa from 'papaparse';
import * as CSVUpload from 'main/inventory/components/CSVUpload';

import GenericCSVUploadPane from './GenericCSVUploadPane';

describe('GenericCSVUploadPane', () => {
  let wrapper;
  let mockedFn;
  const sandbox = sinon.createSandbox();

  let file = new File(
    [''],
    'sample.csv');

  const csvData = [
    {
      csvHeader1: 'csv data 1',
      csvHeader2: 'csv data 2',
    }
  ];

  const props = {
    template: [],
    setCSVData: () => {},
    handleError: () => {},
    handleBannerMsg: () => {}
  };

  const mock = (done, args = null) => {
    const mockFn = () => {
      const promise = Promise.resolve(mockedFn);
      promise.then(() => {
        expect(mockedFn.calledOnce).to.equal(true);
        done();

        if (args) {
          expect(mockedFn.args[0]).to.equal(['error', 'CSV Format error, please check your file and retry.']);
          done();
        }
      }).catch(() => {
        // Suppresses UnhandledPromiseRejectionWarning
      });
    };

    mockedFn = sinon.spy(mockFn);
  };

  beforeEach(() => {
    wrapper = shallow(<GenericCSVUploadPane {...props} />);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    if (sandbox) {
      sandbox.restore();
    }
  });

  describe('Download Template button', () => {
    it('should have the Download Template button', () => {
      const button = wrapper.find('Button').first();

      expect(button.first().dive().text()).to.equal('<Icon />Download template');
      expect(button.props().type).to.equal('secondary');
      expect(button.props().onClick).to.exist;
      expect(button.props().height).to.equal('short');
      expect(button.props().icon).to.equal('far fa-download');
    });

    it('should download the csv template when the Download Template button is clicked', () => {
      const downloadCSVFromJSONStub = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
      const downloadButton = wrapper.find('Button').first();
      downloadButton.simulate('click');

      expect(downloadCSVFromJSONStub.calledOnceWith(props.template, 'containers')).to.be.true;
    });
  });

  describe('DragDropFilePicker', () => {
    it('should have a DragDropFilePicker', () => {
      const filePicker = wrapper.find(DragDropFilePicker);

      expect(filePicker.length).to.equal(1);
      expect(filePicker.props().accept).to.equal('.csv');
      expect(filePicker.props().multiple).to.equal(false);
      expect(filePicker.props().size).to.equal('auto');
      expect(filePicker.props().onDrop).to.not.equal(undefined);
      expect(filePicker.props().abortSingleUpload).to.not.equal(undefined);
      expect(filePicker.props().retryUpload).equal(undefined);
    });

    it('should call onDrop and set files', async () => {
      await wrapper.find(DragDropFilePicker).props().onDrop([file]);

      expect(wrapper.find(DragDropFilePicker).props().files.length).to.equal(1);
    });

    it('should handle successful file upload', async () => {
      sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(csvData));
      await wrapper.find(DragDropFilePicker).props().onDrop([file]);

      expect(wrapper.find(DragDropFilePicker).props().files[0].status).to.equal('success');
    });

    it('should call retryUpload and reset files state', () => {
      wrapper = shallow(<GenericCSVUploadPane {...props} showRetry />);
      wrapper.find(DragDropFilePicker).props().retryUpload();

      expect(wrapper.find(DragDropFilePicker).props().files.length).to.equal(0);
    });

    it('should call abortSingleUpload and reset files state', () => {
      wrapper.find(DragDropFilePicker).props().abortSingleUpload();

      expect(wrapper.find(DragDropFilePicker).props().files.length).to.equal(0);
    });

    it('should handle empty csv error', done => {
      file = new File(
        [', , , , '],
        'empty.csv');

      mock(done, ['error', 'Empty CSV file, please check your CSV file and retry.']);

      wrapper = shallow(<GenericCSVUploadPane {...props} handleBannerMsg={mockedFn} />);
      wrapper.find(DragDropFilePicker).props().onDrop([file]);
    });

    it('should handle csv format error', done => {
      mock(done, ['error', 'CSV Format error, please check your file and retry.']);

      wrapper = shallow(<GenericCSVUploadPane {...props} handleBannerMsg={mockedFn} />);
      wrapper.find(DragDropFilePicker).props().onDrop([file]);
    });

    it('should set csv data after parsing the csv', done => {
      sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(csvData));
      sandbox.stub(Papa, 'parse').throws();

      mock(done);

      wrapper = shallow(<GenericCSVUploadPane {...props} setCSVData={mockedFn} />);
      wrapper.find(DragDropFilePicker).props().onDrop([file]);
    });

    it('should call handleError after parsing the csv', done => {
      sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(csvData));
      sandbox.stub(Papa, 'parse').throws();

      mock(done);

      wrapper = shallow(<GenericCSVUploadPane {...props} handleError={mockedFn} />);
      wrapper.find(DragDropFilePicker).props().onDrop([file]);
    });

    it('should validate csv data if "validateCsvData" prop exist', async () => {
      sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(csvData));
      const validateCsvDataStub = sandbox.stub().returns({ isError: true, errorMessage: 'Some error' });

      wrapper = shallow(<GenericCSVUploadPane {...props} validateCsvData={validateCsvDataStub} />);
      await wrapper.find(DragDropFilePicker).props().onDrop([file]);

      expect(validateCsvDataStub.args[0][0]).to.deep.equal(csvData);
    });

    it('should emit banner change event if validation returns error message', async () => {
      sandbox.stub(CSVUpload, 'parseAndSanitizeCSV').returns(Promise.resolve(csvData));
      const validateCsvDataStub = sandbox.stub().returns({ isError: true, errorMessage: 'Some error' });
      const handleBannerMsgSpy = sandbox.spy();

      wrapper = shallow(
        <GenericCSVUploadPane
          {...props}
          validateCsvData={validateCsvDataStub}
          handleBannerMsg={handleBannerMsgSpy}
        />
      );
      await wrapper.find(DragDropFilePicker).props().onDrop([file]);

      expect(handleBannerMsgSpy.args[0][0]).to.equal('error');
      expect(handleBannerMsgSpy.args[0][1]).to.equal('Some error');
    });
  });
});
