import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader/DataObjectFileHeader';
import { DataTable, ZeroState } from '@transcriptic/amino';
import DataObjectLcmsSpe from 'main/components/datasets/DataObjectLcms/DataObjectLcmsSpe';
import DataObjectLcms from '../DataObjectLcms';

describe('DataObjectLcmsSpe', () => {
  let dataObjectLcmsSpe;
  const dataObject = Immutable.Map({
    content_type: 'application/json',
    size: 209,
    dataset_id: 'd1h2j6ka77r32u',
    name: 'test_data_spe.json',
    s3_info: {
      url: 'dummy_s3_url',
      headers: {}
    },
    url: 'dummy_s3_url',
    validation_errors: [],
    status: 'valid',
    format: 'lcms_spe',
    type: 'data_objects',
    id: 'do1h3n5ygs3tpqd'
  });

  const data = {
    fractions: [
      {
        fraction: 'F1',
        amount: 'Large',
        RT: '1.082',
        command: 'RunPrep',
        isobar: '1',
        barcode: 'PREW12'
      },
      {
        fraction: 'F2',
        amount: 'Small',
        RT: '1.082',
        command: 'RunPrep',
        isobar: '1',
        barcode: 'TREW12'
      },
      {
        fraction: 'F3',
        amount: 'N/A',
        RT: 'N/A',
        command: 'Discard',
        isobar: '0',
        barcode: 'KREW12'
      },
      {
        fraction: 'N/A',
        amount: 'N/A',
        RT: 'N/A',
        command: 'Discard',
        isobar: '1',
        barcode: 'WREW12'
      }
    ],
    sample_id: 'ABC-PQ2022-043-026',
    method_name: 'ABC_LowpH.M'
  };

  beforeEach(() => {
    dataObjectLcmsSpe = shallow(<DataObjectLcmsSpe data={data} dataObject={dataObject} />);
  });

  afterEach(() => {
    if (dataObjectLcmsSpe) { dataObjectLcmsSpe.unmount(); }
  });

  it('Should render header for lcms fractional analysis', () => {
    const dataObjectFileHeader = dataObjectLcmsSpe.dive().find(DataObjectFileHeader);
    expect(dataObjectFileHeader.length).to.equal(1);
    expect(dataObjectFileHeader.props().dataObject).to.deep.equal(dataObject);
  });

  it('Should render the DataTable for lcms fractional analysis', () => {
    const dataTable =  dataObjectLcmsSpe.find(DataObjectLcms).dive().find(DataTable);
    const expectedTableData = [
      {
        Fraction: 'F1',
        Amount: 'Large',
        RT: '1.082',
        Command: 'RunPrep',
        Isobar: '1',
        Barcode: 'PREW12'
      },
      {
        Fraction: 'F2',
        Amount: 'Small',
        RT: '1.082',
        Command: 'RunPrep',
        Isobar: '1',
        Barcode: 'TREW12'
      },
      {
        Fraction: 'F3',
        Amount: 'N/A',
        RT: 'N/A',
        Command: 'Discard',
        Isobar: '0',
        Barcode: 'KREW12'
      },
      {
        Fraction: 'N/A',
        Amount: 'N/A',
        RT: 'N/A',
        Command: 'Discard',
        Isobar: '1',
        Barcode: 'WREW12'
      }
    ];

    expect(dataTable.prop('headers')).to.deep.equal(['Fraction', 'Barcode', 'Isobar', 'RT', 'Amount', 'Command']);
    expect(dataTable.prop('data').length, 4);
    expect(dataTable.prop('data')).to.deep.equal(expectedTableData);
  });

  it('Should not render the DataTable for lcms fractional analysis if there are no fractions', () => {
    const dataProp = {
      fractions: [],
      sample_id: 'ABC-PQ2022-043-026',
      method_name: 'ABC_LowpH.M' };

    const wrapper = shallow(<DataObjectLcmsSpe data={dataProp} dataObject={dataObject} />);

    expect(wrapper.find(DataObjectLcms).dive().find(DataTable).length).to.equal(0);
    expect(wrapper.find(DataObjectLcms).dive().find(ZeroState)
      .props().title).to.equal('There are no fractions to display for this fractional analysis.');
  });
});
