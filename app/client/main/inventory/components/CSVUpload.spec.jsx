import React from 'react';
import { expect }                   from 'chai';
import { shallow }                  from 'enzyme';
import sinon                        from 'sinon';
import Papa                         from 'papaparse';
import Immutable from 'immutable';

import CSVUpload, { CSVUploadWithInstructions, parseAndSanitizeCSV }  from 'main/inventory/components/CSVUpload';

const csvClean = `
Column 1,Column 2,Column 3,Column 4
1-1,1-2,1-3,1-4
2-1,2-2,2-3,2-4
3-1,3-2,3-3,3-4
4,5,6,7`;

const csvDirtyColumns = `
Column 1,Column 2,Column 3,Column 4,,,,
1-1,1-2,1-3,1-4,,,,
2-1,2-2,2-3,2-4,,,,
3-1,3-2,3-3,3-4,,,,
4,5,6,7,,,,`;

const csvDirtyRows = `
Column 1,Column 2,Column 3,Column 4
1-1,1-2,1-3,1-4
2-1,2-2,2-3,2-4
,,,
3-1,3-2,3-3,3-4
4,5,6,7`;

const csvDirtyWhitespace = `
Column 1,Column 2,Column 3,Column 4
1-1, 1-2 ,             1-3,1-4
2-1,2-2,    2-3     ,2-4
3-1,   3-2   ,3-3,         3-4
    4,5  ,6,7`;

const csvDirtyAll = `
Column 1,Column 2,Column 3,Column 4,,,,
1-1, 1-2 ,             1-3,1-4, ,   ,,
2-1,2-2,    2-3     ,2-4,,,,
,     ,   ,,  ,    ,   ,
3-1,   3-2   ,3-3,         3-4,,  ,  ,
    4,5  ,6,7,,,      ,`;

const parsedClean = [{
  'Column 1': '1-1',
  'Column 2': '1-2',
  'Column 3': '1-3',
  'Column 4': '1-4'
},
{
  'Column 1': '2-1',
  'Column 2': '2-2',
  'Column 3': '2-3',
  'Column 4': '2-4'
},
{
  'Column 1': '3-1',
  'Column 2': '3-2',
  'Column 3': '3-3',
  'Column 4': '3-4'
},
{
  'Column 1': '4',
  'Column 2': '5',
  'Column 3': '6',
  'Column 4': '7'
}];

describe('CSVUpload parsing', () => {

  it('should parse CSV string to object', () => {
    return parseAndSanitizeCSV(csvClean).then(dataObjects => {
      expect(dataObjects).to.eql(parsedClean);
    });
  });

  it('should remove empty columns', () => {
    return parseAndSanitizeCSV(csvDirtyColumns).then(dataObjects => {
      expect(dataObjects).to.eql(parsedClean);
    });
  });

  it('should remove empty rows', () => {
    return parseAndSanitizeCSV(csvDirtyRows).then(dataObjects => {
      expect(dataObjects).to.eql(parsedClean);
    });
  });

  it('should trim outer whitespace of values', () => {
    return parseAndSanitizeCSV(csvDirtyWhitespace).then(dataObjects => {
      expect(dataObjects).to.eql(parsedClean);
    });
  });

  it('should handle all dirty states at once', () => {
    return parseAndSanitizeCSV(csvDirtyAll).then(dataObjects => {
      expect(dataObjects).to.eql(parsedClean);
    });
  });
});

describe('CSVUpload', () => {
  let csvUpload;
  const sandbox = sinon.createSandbox();

  function getWrapper(extraProps = {}) {
    return shallow(<CSVUpload
      onCSVChange={() => { }}
      onFilesDelete={() => { }}
      {...extraProps}
    />);
  }

  afterEach(() => {
    if (csvUpload) csvUpload.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should have dragdrop component', () => {
    csvUpload = getWrapper();
    expect(csvUpload.find('DragDropFilePicker').length).to.equal(1);
  });

  it('should trigger papa parser when file is uploaded', () => {
    csvUpload = getWrapper();
    const parse = sandbox.stub(Papa, 'parse');
    const dragdrop = csvUpload.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    expect(parse.calledOnce).to.be.true;
  });

  it('should have inital state when the upload is aborted', () => {
    csvUpload = getWrapper();
    const dragdrop = csvUpload.find('DragDropFilePicker');
    dragdrop.props().onDrop([{ uuid: 'sample-uuid', file: { name: 'file.csv' }, status: 'uploading' }]);
    dragdrop.props().abortUpload();
    expect(csvUpload.instance().state.files).to.be.eql(Immutable.Map());
  });
});

describe('CSVUploadWithInstructions', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  function getWrapper(extraProps = {}) {
    return shallow(<CSVUploadWithInstructions
      instruction="Instruction"
      payload="C\nCCC\nCCCC"
      downloadName="sample.csv"
      onCSVChange={() => { }}
      onFilesDelete={() => { }}
      {...extraProps}
    />);
  }

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display instructions', () => {
    wrapper = getWrapper({ instruction: 'Download containers.' });

    expect(wrapper.find('p').at(0).text()).to.equal('Download containers. Complete it, then upload it below. ');
    expect(wrapper.find('p').at(1).text()).to.equal('Your download should automatically start within seconds. If it does not, restart the download.');
    expect(wrapper.find('p').at(2).text()).to.equal("(If using Safari, append '.csv' to the 'Unknown' filename after downloading.)");
  });

  it('should display download link', () => {
    wrapper = getWrapper();

    const link = wrapper.find('a');
    expect(link.prop('href')).to.equal('data:txt/csv,C%5CnCCC%5CnCCCC');
    expect(link.prop('download')).to.equal('sample.csv');
  });

  it('should display csv upload with auto size', () => {
    wrapper = getWrapper();

    expect(wrapper.find('CSVUpload').length).to.equal(1);
    expect(wrapper.find('CSVUpload').prop('size')).to.equal('auto');
  });

  it('should emit changes on csv upload file changes', () => {
    const onCSVChangeSpy = sandbox.spy();
    wrapper = getWrapper({ onCSVChange: onCSVChangeSpy });

    wrapper.find('CSVUpload').props().onCSVChange();
    expect(onCSVChangeSpy.calledOnce).to.be.true;
  });

  it('should emit changes on csv upload file deletions', () => {
    const onFilesDeleteSpy = sandbox.spy();
    wrapper = getWrapper({ onFilesDelete: onFilesDeleteSpy });

    wrapper.find('CSVUpload').props().onFilesDelete(['f-1']);
    expect(onFilesDeleteSpy.calledOnce).to.be.true;
  });
});
