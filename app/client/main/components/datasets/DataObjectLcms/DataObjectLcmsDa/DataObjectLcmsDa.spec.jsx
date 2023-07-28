import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader/DataObjectFileHeader';
import { DataTable, ZeroState } from '@transcriptic/amino';
import DataObjectLcms from 'main/components/datasets/DataObjectLcms/DataObjectLcms';
import DataObjectLcmsDa from './DataObjectLcmsDa';

describe('DataObjectLcmsDa', () => {
  let dataObjectLcmsDa;
  const dataObject = Immutable.Map({
    content_type: 'application/json',
    size: 209,
    well_index: null,
    dataset_id: 'd1h3n5vqpqjwka',
    created_at: '2022-05-26T06:01:45.137-07:00',
    name: 'test_data_da.json',
    validation_errors: [],
    status: 'valid',
    aliquot_id: null,
    updated_at: '2022-05-26T06:01:46.047-07:00',
    format: 'lcms_da',
    container_id: null,
    type: 'data_objects',
    id: 'do1h3n5ygs3tcwe'
  });
  const data = {
    results: [
      {
        purity: '90.8',
        rt: '0.646',
        purity_code: 'B',
        barcode: 'LCMS15259-B1'
      }
    ],
    sample_id: 'BYR-ST2022-047-010',
    method_name: 'Gemini_LowpH.M'
  };
  beforeEach(() => {
    dataObjectLcmsDa = shallow(<DataObjectLcmsDa data={data} dataObject={dataObject} />);
  });
  afterEach(() => {
    if (dataObjectLcmsDa) { dataObjectLcmsDa.unmount(); }
  });

  it('Should render LcmsDa component', () => {
    const dataObjectLcms = dataObjectLcmsDa.find(DataObjectLcms);
    expect(dataObjectLcms.props().data).equal(data);
    expect(dataObjectLcms.props().dataObject).equal(dataObject);
  });

  it('Should render header in LcmsDa', () => {
    const dataObjectFileHeader = dataObjectLcmsDa.dive().find(DataObjectFileHeader);
    expect(dataObjectFileHeader.props().dataObject).to.deep.equal(dataObject);
  });

  it('Should render the DataTable correctly', () => {
    const dataTable =  dataObjectLcmsDa.find(DataObjectLcms).dive().find(DataTable);
    const expectedTableData = [{
      Barcode: 'LCMS15259-B1',
      Purity: '90.8',
      'Purity Code': 'B',
      RT: '0.646'

    }];
    expect(dataTable.prop('headers')).to.deep.equal(['Barcode', 'RT', 'Purity', 'Purity Code']);
    expect(dataTable.prop('data')).to.deep.equal(expectedTableData);
  });

  it('Should not render the data table for lcms da if there are no results in data', () => {
    const data = {
      results: [],
      sample_id: 'BYR-ST2022-047-010',
      method_name: 'Gemini_LowpH.M'
    };
    const wrapper = shallow(<DataObjectLcmsDa data={data} dataObject={dataObject} />);
    expect(wrapper.find(DataObjectLcms).dive().find(ZeroState)
      .props().title).to.equal('There are no results present in this da lcms.');
  });
});
