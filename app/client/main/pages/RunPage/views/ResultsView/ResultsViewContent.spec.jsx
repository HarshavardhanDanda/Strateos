import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import DataObjectWrapper from 'main/components/datasets/DataObjectWrapper';
import DataObjectPdf from 'main/components/datasets/DataObjectPdf';
import DataObjectLcmsRm from 'main/components/datasets/DataObjectLcms/DataObjectLcmsRm/DataObjectLcmsRm';
import DataObjectLcmsFs from 'main/components/datasets/DataObjectLcms/DataObjectLcmsFs';
import DataObjectLcmsSpe from 'main/components/datasets/DataObjectLcms/DataObjectLcmsSpe';
import DataObjectImage from 'main/components/datasets/DataObjectImage';
import DataObjectCsv from 'main/components/datasets/DataObjectCsv';
import DataObjectLcmrm from 'main/components/datasets/DataObjectLcmrm';
import S3Util                    from 'main/util/S3Util';
import DataObjectLcmsDa from 'main/components/datasets/DataObjectLcms/DataObjectLcmsDa/DataObjectLcmsDa';
import ResultsViewContent from './ResultsViewContent';
import ResultsViewContentHeader from './ResultsViewContentHeader';

const name = 'FA-F2-Product-cycle_1';
const dataObjects = Immutable.fromJS([
  {
    content_type: 'application/pdf',
    size: 5891,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'example.pdf',
    s3_info: {
      url: 'https://strateos-zemoso.s3.ap-south-1.amazonaws.com/d1h2j6ka77r32u/do1h2j6mkqgbpja/zip.zip?response-content-disposition=attachment%3Bfilename%3Dzip.zip&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVKDMSZ4N37RQG47H%2F20220526%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20220526T095008Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=98d2726f7de041feee4013c55d8e2b4932fc6ad77e877815c60d0971ef6de106',
      headers: {}
    },
    url: 'https://strateos-zemoso.s3.ap-south-1.amazonaws.com/d1h2j6ka77r32u/do1h2j6mkqgbpja/zip.zip?response-content-disposition=attachment%3Bfilename%3Dzip.zip&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVKDMSZ4N37RQG47H%2F20220526%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20220526T095008Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=98d2726f7de041feee4013c55d8e2b4932fc6ad77e877815c60d0971ef6de106',
    validation_errors: [],
    status: 'valid',
    format: 'file',
    type: 'data_objects',
    id: 'do1h2j6mkqgbpja'
  }
]);

const csvDataObjects = Immutable.fromJS([
  {
    content_type: 'text/csv',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'sample.csv',
    s3_info: {
      url: 'dummy_s3_url',
      headers: {}
    },
    url: 'dummy_s3_url',
    validation_errors: [],
    status: 'valid',
    format: 'file',
    type: 'data_objects',
    id: 'do1h3n5ygs3trry'
  }
]);

const lcmsRmDataObjects = Immutable.fromJS([
  {
    content_type: 'application/json',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'test_data_rm.json',
    s3_info: {
      url: 'dummy_s3_url',
      headers: {}
    },
    url: 'dummy_s3_url',
    validation_errors: [],
    status: 'valid',
    format: 'lcms_rm',
    type: 'data_objects',
    id: 'do1h3n5ygs3trry'
  }
]);

const imageContentTypes = ['jpg', 'jpeg', 'gif', 'png', 'tif', 'tiff'];
const imagedataObjects = [];
imageContentTypes.forEach((contentType, index) => {
  imagedataObjects.push(
    {
      content_type: 'image/' + contentType,
      size: 200,
      dataset_id: 'd1h2j6ka77r32u',
      name: 'example.' + contentType,
      s3_info: {
        size: 200,
        url: 'dummy_s3_url',
        headers: {}
      },
      url: 'dummy_s3_url',
      validation_errors: [],
      status: 'valid',
      format: 'file',
      type: 'data_objects',
      id: `do1h2j6mkqgbpja${index}`,
      created_at: '2022-05-26T06:01:45.137-08:00'
    }
  );
});

const dataset = Immutable.fromJS({
  instruction_id: 'i1dut3fg5d6jwh',
  data_type: 'file',
  run_id: null,
  attachments: [
    {
      bucket: 'sample-bucket',
      key: 'uploads/31628f0f-b389-440a-9285-825fd6410854/example.pdf'
    }
  ],
  id: 'd1h2j6ka77r32u',
});

const run = Immutable.fromJS({
  refs: [
    {
      container: {
        barcode: '100000X9J',
        container_type_id: 'mrv-medium',
        location_id: 'loc1dssgxed8dzgf',
        organization_id: 'org13',
        public_location_description: 'In storage',
        created_by: 'u1dc39mwq3dkvv',
        organization_name: 'Strateos',
        type: 'containers',
        id: 'ct1duntqzzcnybs'
      },
      name: 'Product',
      run_id: 'r1dut3ffxbtxf7',
      container_id: 'ct1duntqzzcnybs',
      type: 'refs',
      id: '422862'
    }
  ],
  project_id: 'p1dqzdvrqgwx9v',
  protocol_id: 'pr1dtjtg8k3msjg',
  id: 'r1dut3ffxbtxf7',
  instructions: [
    {
      data_name: 'FA-F2-Product-cycle_1',
      op: 'lcms',
      run_id: 'r1dut3ffxbtxf7',
      type: 'instructions',
      id: 'i1dut3fg5d6jwh'
    }
  ],
});

const lcmsFsDataObjects = Immutable.fromJS([
  {
    content_type: 'application/json',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'test_data_fs.json',
    s3_info: {
      url: 'dummy_s3_url',
      headers: {}
    },
    url: 'dummy_s3_url',
    validation_errors: [],
    status: 'valid',
    format: 'lcms_fs',
    type: 'data_objects',
    id: 'do1h3n5ygs3trry'
  }
]);

const lcmsSpeDataObjects = Immutable.fromJS([
  {
    content_type: 'application/json',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'test_data_spe.json',
    s3_info: {
      url: 'dummy_s3_spe_url',
      headers: {}
    },
    url: 'dummy_s3_spe_url',
    validation_errors: [],
    status: 'valid',
    created_at: '2022-05-26T06:01:45.137-08:00',
    format: 'lcms_spe',
    type: 'data_objects',
    id: 'do1h3n5ygs3rre'
  }
]);

const lcmsDaDataObjects = Immutable.fromJS([
  {
    content_type: 'application/json',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'test_data_da.json',
    s3_info: {
      url: 'dummy_s3_url',
      headers: {}
    },
    url: 'dummy_s3_url',
    validation_errors: [],
    status: 'valid',
    format: 'lcms_da',
    type: 'data_objects',
    id: 'do1h3n5ygs3trry'
  }
]);

const lcmrmDataObjects = Immutable.fromJS([{
  id: 'do1123xyz34',
  content_type: 'application/json',
  created_at: '2022-08-24T02:47:59.740-07:00',
  dataset_id: 'd134kjkk133',
  format: 'lcmrm',
  name: 'qqq.json',
  s3_info: {
    url: 's3_url',
    headers: {}
  },
  size: 59516,
  status: 'valid',
  updated_at: '2022-08-24T02:47:59.740-07:00',
  url: 's3_url',
  validation_errors: [],
}]);

describe('RunsViewContent', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(S3Util, 'get').returns({
      then: (cb) => {
        cb({}, 200, { responseText: '{}' });
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    if (sandbox) { sandbox.restore(); }
  });

  it('should render DataObjectPdf viewer when format is pdf and content type is application/pdf', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(dataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).dive();
    expect(dataObjectWrapper.find(DataObjectPdf)).to.have.length(1);
  });

  it('should render DataObjectLcmsRm viewer when format is lcms_rm', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmsRmDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmsRm)).to.have.length(1);
  });

  it('should render DataObjectImage viewer when format is image and content type is one of image/png, image/jpg, image/jpeg, image/gif, image/tif, image/tiff', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(Immutable.fromJS(imagedataObjects))} dataset={dataset} run={run} />);
    const dataObjectWrappers = wrapper.dive().find(DataObjectWrapper);
    expect(dataObjectWrappers.length).to.equal(6);
    dataObjectWrappers.forEach(dataObjectWrapper => {
      expect(dataObjectWrapper.dive().find(DataObjectImage)).to.have.length(1);
    });
  });

  it('should render DataObjectLcmsFs viewer when format is lcms_fs', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmsFsDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmsFs)).to.have.length(1);
  });

  it('should render DataObjectLcmsSpe viewer when format is lcms_spe', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmsSpeDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmsSpe)).to.have.length(1);
  });

  it('should render DataObjectLcmsDa when format is lcms_da', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmsDaDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmsDa)).to.have.length(1);
  });

  it('should render ResultViewContentHeader with run prop', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(dataObjects)} dataset={dataset} run={run} />);
    const resultViewContentHeader = wrapper.dive().find(ResultsViewContentHeader);
    expect(resultViewContentHeader.find(ResultsViewContentHeader)).to.have.length(1);
  });

  it('should render DataObjectCSV when format is file and content type is text', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(csvDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectCsv)).to.have.length(1);
  });

  it('should render DataObjectLcmrm when format is lcmrm', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmrmDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmrm)).to.have.length(1);
  });

  it('should render DataObjectLcmrm first and DataObjectCsv second', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(Immutable.fromJS([csvDataObjects.toJS()[0], lcmrmDataObjects.toJS()[0]]))} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper);
    expect(dataObjectWrapper.at(0).dive().find(DataObjectLcmrm)).to.have.length(1);
    expect(dataObjectWrapper.at(1).dive().find(DataObjectCsv)).to.have.length(1);
  });

  it('should pass run id as prop to DataObjectLcmrm when format is lcmrm', () => {
    wrapper = shallow(<ResultsViewContent name={name} dataObjects={Immutable.Seq(lcmrmDataObjects)} dataset={dataset} run={run} />);
    const dataObjectWrapper = wrapper.dive().find(DataObjectWrapper).at(0).dive();
    expect(dataObjectWrapper.find(DataObjectLcmrm).props().runID).to.equal('r1dut3ffxbtxf7');
  });
});
