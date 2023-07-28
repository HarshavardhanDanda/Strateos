import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { PdfViewer } from '@transcriptic/amino';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';
import DataObjectPdf from './DataObjectPdf';

describe('DataObjectPdf', () => {
  let dataObjectPdf;

  const dataObject = Immutable.Map({
    id: 'do1123xyz',
    content_type: 'application/pdf',
    created_at: '2022-04-27T23:56:14.509-07:00',
    validation_errors: [],
    format: 'pdf',
    name: 'sample.pdf',
    url: 'dummy-url'
  });

  afterEach(() => {
    if (dataObjectPdf) { dataObjectPdf.unmount(); }
  });

  it('should render PdfViewer', () => {
    dataObjectPdf = shallow(
      <DataObjectPdf dataObject={dataObject} />
    );
    const pdfViewer = dataObjectPdf.find(PdfViewer);
    expect(pdfViewer.length).equal(1);
    expect(pdfViewer.props().file).equal('dummy-url');
  });

  it('should render header in PdfViewer', () => {
    dataObjectPdf = shallow(
      <DataObjectPdf dataObject={dataObject} />
    );
    const header = dataObjectPdf.find(PdfViewer).dive().find(DataObjectFileHeader);
    expect(header.length).equal(1);
    expect(header.props().dataObject).to.deep.equal(dataObject);
  });

  it('should contain a Card for the PdfViewer', () => {
    dataObjectPdf = shallow(
      <DataObjectPdf dataObject={dataObject} />
    );
    expect(dataObjectPdf.find('Card')).to.have.length(1);
  });

});
