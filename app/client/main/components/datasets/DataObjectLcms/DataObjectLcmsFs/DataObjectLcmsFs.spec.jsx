import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader/DataObjectFileHeader';
import { DataTable, ZeroState } from '@transcriptic/amino';
import DataObjectLcmsFs from './DataObjectLcmsFs';
import DataObjectLcms from '../DataObjectLcms';

describe('DataObjectLcmsFs', () => {
  let dataObjectLcmsFs;
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
    fractions: [
      {
        group: '1',
        source_barcode: '700002CLK',
        fraction_barcode: '700001LEC',
        fraction_volume: '9.01',
        command: 'Discard'
      },
      {
        group: '2',
        source_barcode: '700002CLK',
        fraction_barcode: '700001LDT',
        fraction_volume: '4.98',
        command: 'Selected'
      }
    ],
    sample_id: 'BYR-ST2022-047-036BYR-ST2022-047-036',
    method_name: 'PGM18_A30_60S_40mL.M',
    message: 'The largest fraction collected was not selected.'
  };
  beforeEach(() => {
    dataObjectLcmsFs = shallow(<DataObjectLcmsFs data={data} dataObject={dataObject} />);
  });
  afterEach(() => {
    if (dataObjectLcmsFs) { dataObjectLcmsFs.unmount(); }
  });

  it('Should render LcmsFs component', () => {
    const dataObjectLcms = dataObjectLcmsFs.find(DataObjectLcms);
    expect(dataObjectLcms.props().data).equal(data);
    expect(dataObjectLcms.props().dataObject).equal(dataObject);
  });

  it('Should render header in LcmsFs', () => {
    const dataObjectFileHeader = dataObjectLcmsFs.dive().find(DataObjectFileHeader);
    expect(dataObjectFileHeader.props().dataObject).to.deep.equal(dataObject);
  });

  it('Should render the DataTable correctly', () => {
    const dataTable =  dataObjectLcmsFs.find(DataObjectLcms).dive().find(DataTable);
    const expectedTableData = [
      {
        Command: 'Discard',
        Fraction: 1,
        'Fraction Barcode': '700001LEC',
        'Fraction Volume (mL)': '9.01',
        Group: '1',
        'Source Barcode': '700002CLK'
      },
      {
        Command: 'Selected',
        Fraction: 2,
        'Fraction Barcode': '700001LDT',
        'Fraction Volume (mL)': '4.98',
        Group: '2',
        'Source Barcode': '700002CLK'
      }
    ];
    expect(dataTable.prop('headers')).to.deep.equal(['Fraction', 'Group', 'Source Barcode', 'Fraction Barcode', 'Fraction Volume (mL)', 'Command']);
    expect(dataTable.prop('data').length, 2);
    expect(dataTable.prop('data')).to.deep.equal(expectedTableData);
  });

  it('Should not render the DataTable for lcms fractional selection if there are no fractions', () => {
    const dataProp = {
      fractions: [],
      sample_id: 'BYR-ST2022-047-036BYR-ST2022-047-036',
      method_name: 'PGM18_A30_60S_40mL.M'
    };

    const wrapper = shallow(<DataObjectLcmsFs data={dataProp} dataObject={dataObject} />);

    expect(wrapper.find(DataObjectLcms).dive().find(DataTable).length).to.equal(0);
    expect(wrapper.find(DataObjectLcms).dive().find(ZeroState)
      .props().title).to.equal('There are no fractions to display for this fraction selection.');
  });
});
