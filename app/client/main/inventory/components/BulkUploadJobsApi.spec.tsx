import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import BulkUploadJobsApi, { JobsApiError } from './BulkUploadJobsApi';

describe('BulkUploadJobsApi', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const testFiles = [
    new File(['foo,bar'], 'sample1.csv', { type: 'text/csv' }),
    new File(['foo,baz'], 'sample2.csv', { type: 'text/csv' })
  ];

  const testData = [
    [{ foo: 'bar' }],
    [{ foo: 'baz' }]
  ];

  const errors: JobsApiError[] = [
    {
      fileName: 'plates/plates_1.csv',
      errors: [
        {
          entity: 'container',
          sourceIdentifier: '0',
          description: 'ROW[5], HEADER[ct_label_m], ERROR[Characters Comma(,) and Slash(/) are not allowed for column ct_label_m]'
        }
      ]
    }
  ];

  const props = {
    onCsvChange: () => {},
    jobsApiErrors: [],
    resetJobsApiErrors: () => {}
  };

  const getPlateInput = () => wrapper.find('CSVUpload').at(0);
  const getTubeInput = () => wrapper.find('CSVUpload').at(1);

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display title', () => {
    wrapper = shallow(<BulkUploadJobsApi {...props} />);

    expect(wrapper.find('h3').text()).to.equal('Bulk upload CSVs to Job Shipment API');
  });

  it('should display plate csv upload', () => {
    wrapper = shallow(<BulkUploadJobsApi {...props} />);

    const plateInput = wrapper.find('LabeledInput').at(0);
    expect(plateInput.prop('label')).to.equal('Plates');
    expect(plateInput.dive().find('CSVUpload').length).to.equal(1);
  });

  it('should display tube csv upload', () => {
    wrapper = shallow(<BulkUploadJobsApi {...props} />);

    const tubeInput = wrapper.find('LabeledInput').at(1);
    expect(tubeInput.prop('label')).to.equal('Tubes');
    expect(tubeInput.dive().find('CSVUpload').length).to.equal(1);
  });

  it('should emit changes on csv file changes', () => {
    const onCsvChangeSpy = sandbox.spy();
    wrapper = mount(<BulkUploadJobsApi {...props} onCsvChange={onCsvChangeSpy} />);

    getPlateInput().props().onCSVChange(testData, 'sample1.csv', 'file-1', testFiles[0]);
    getTubeInput().props().onCSVChange(testData, 'sample2.csv', 'file-2', testFiles[1]);
    wrapper.setProps({});

    expect(onCsvChangeSpy.calledTwice).to.be.true;
    expect(onCsvChangeSpy.getCall(0).args).to.deep.equal([Immutable.fromJS([testFiles[0]]), Immutable.fromJS([])]);
    expect(onCsvChangeSpy.getCall(1).args).to.deep.equal([Immutable.fromJS([testFiles[0]]), Immutable.fromJS([testFiles[1]])]);
  });

  it('should emit changes on csv file deletion', () => {
    const onCsvChangeSpy = sandbox.spy();
    wrapper = mount(<BulkUploadJobsApi {...props} onCsvChange={onCsvChangeSpy} />);

    getPlateInput().props().onCSVChange(testData, 'sample1.csv', 'file-1', testFiles[0]);
    getTubeInput().props().onCSVChange(testData, 'sample2.csv', 'file-2', testFiles[1]);
    getPlateInput().props().onFilesDelete(['file-1']);
    wrapper.setProps({});

    expect(onCsvChangeSpy.callCount).to.equal(3);
    expect(onCsvChangeSpy.getCall(2).args).to.deep.equal([Immutable.fromJS([]), Immutable.fromJS([testFiles[1]])]);
  });

  it('should display jobs api error message', () => {
    wrapper = shallow(<BulkUploadJobsApi {...props} jobsApiErrors={errors} />);

    const banner = wrapper.find('Banner');
    expect(banner.length).to.equal(1);
    expect(banner.prop('bannerTitle')).to.equal('The following errors were found in your file: plates/plates_1.csv');
    expect(banner.dive().find('li').at(0).text()).to.equal('ROW[5], HEADER[ct_label_m], ERROR[Characters Comma(,) and Slash(/) are not allowed for column ct_label_m]');
  });

  it('should not display jobs api error message if errors are empty', () => {
    wrapper = shallow(<BulkUploadJobsApi {...props} jobsApiErrors={[]} />);

    expect(wrapper.find('Banner').length).to.equal(0);
  });
});
