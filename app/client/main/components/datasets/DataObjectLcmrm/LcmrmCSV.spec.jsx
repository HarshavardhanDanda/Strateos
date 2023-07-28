import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import csvData from 'main/test/dataobject/lcmrm/testCSVData';
import CSVUtil from 'main/util/CSVUtil';
import LcmrmCSV from './LcmrmCSV';

describe('LcmrmCSV', () => {
  let component;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
    if (component) {
      component.unmount();
    }
  });

  it('should display csv, with file name as header', () => {
    component = shallow(<LcmrmCSV csvData={csvData} name="test.csv" />);
    const csvTable = component.find('CsvViewer');
    expect(csvTable.length).equal(1);
    expect(csvTable.dive().find('h3').text()).equal('test.csv');
  });

  it('should be able to download csv', () => {
    const downloadStub = sandbox.stub(CSVUtil, 'downloadCSV');
    component = shallow(<LcmrmCSV csvData={csvData} name="test.csv" />);
    const downloadButton = component.dive().find('Button');

    expect(downloadButton.length).equal(1);
    expect(downloadButton.props().icon).equal('fa fa-download');

    downloadButton.simulate('click');

    expect(downloadStub.calledOnce).to.be.true;
    expect(downloadStub.calledWithExactly(csvData, 'test', true));
  });
});
