import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader/DataObjectFileHeader';
import { DataTable, ZeroState } from '@transcriptic/amino';
import DataObjectLcmsRm from './DataObjectLcmsRm';
import DataObjectLcms from '../DataObjectLcms';

describe('DataObjectLcmsRm', () => {
  let DataObjectLcmsRmVar;
  const dataObject = Immutable.Map({
    content_type: 'application/json',
    size: 701,
    well_index: null,
    dataset_id: 'd1h3mf638kjg9p',
    created_at: '2022-05-26T01:06:39.102-07:00',
    name: 'RM_Auto_20211019021738986530lowPH_rqdzm4xm.i4l.json',
    validation_errors: [],
    status: 'valid',
    aliquot_id: null,
    updated_at: '2022-05-26T01:06:39.569-07:00',
    format: 'lcms_rm',
    container_id: null,
    type: 'data_objects',
    id: 'do1h3mf7p9x25mz'
  });
  const data = {
    isobars: [
      {
        area_abs: '21.81',
        area_perc: '1.4',
        bpm_neg: '448.2000',
        bpm_pos: '448.2000',
        centroid: '1.135',
        height: '28.76',
        isobar: '1',
        isobar_relative_amt_coi: '100.0',
      }
    ],
    sample_id: 'BYR-PE0027-047',
    method_name: 'Gemini_LowpH.M'
  };
  beforeEach(() => {
    DataObjectLcmsRmVar = shallow(<DataObjectLcmsRm data={data} dataObject={dataObject} />);
  });
  afterEach(() => {
    if (DataObjectLcmsRmVar) { DataObjectLcmsRmVar.unmount(); }
  });

  it('Should render LcmsRm component', () => {
    const dataObjectLcms = DataObjectLcmsRmVar.find(DataObjectLcms);
    expect(dataObjectLcms.props().data).equal(data);
    expect(dataObjectLcms.props().dataObject).equal(dataObject);
  });

  it('Should render header in LcmsRm', () => {
    const dataObjectFileHeader = DataObjectLcmsRmVar.dive().find(DataObjectFileHeader);
    expect(dataObjectFileHeader.props().dataObject).to.deep.equal(dataObject);
  });

  it('Should render the DataTable correctly', () => {
    const dataTable =  DataObjectLcmsRmVar.find(DataObjectLcms).dive().find(DataTable);
    const expectedTableData = [{
      'Area Abs': '21.81',
      'Area percent..': '1.4',
      BPMNeg: '448.2000',
      BPMPos: '448.2000',
      Centroid: '1.135',
      Height: '28.76',
      Isobar: '1',
      'Relative COI Isomer..': '100.0',

    }];
    expect(dataTable.prop('headers')).to.deep.equal(['Isobar', 'Centroid', 'Height', 'Area Abs',
      'Area percent..', 'Relative COI Isomer..',
      'BPMPos', 'BPMNeg']);
    expect(dataTable.prop('data')).to.deep.equal(expectedTableData);
  });

  it('Should not render the DataTable for lcms reaction monitoring if there are no isobars', () => {
    const dataProp = {
      isobars: [],
      sample_id: 'BYR-PE0027-047',
      method_name: 'Gemini_LowpH.M' };

    const wrapper = shallow(<DataObjectLcmsRm data={dataProp} dataObject={dataObject} />);

    expect(wrapper.find(DataObjectLcms).dive().find(DataTable).length).to.equal(0);
    expect(wrapper.find(DataObjectLcms).dive().find(ZeroState)
      .props().title).to.equal('There are no isobars to display for this reaction monitoring.');
  });
});
