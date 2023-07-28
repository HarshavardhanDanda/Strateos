import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Papa from 'papaparse';

import csvData from 'main/test/dataobject/lcmrm/testCSVData';
import { Section, CsvViewer, Button, Plate, Radio, RadioGroup, Select, Table, Legend, DataTable } from '@transcriptic/amino';

import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';
import testData from 'main/test/dataobject/lcmrm/testData.json';
import NotificationActions from 'main/actions/NotificationActions';
import testDataSamples from 'main/test/dataobject/lcmrm/testDataSamples.json';
import ContainerAPI from 'main/api/ContainerAPI';

import DataObjectLcmrm from './DataObjectLcmrm';
import LcmrmCSV from './LcmrmCSV';

describe('DataObjectLcmrm', () => {
  let dataObjectLcmrm;
  let calculateSection;
  let button;
  let selectFirstAnalyte;
  let selectSecondtAnalyte;
  const sandbox = sinon.createSandbox();

  const dataObject = Immutable.Map({
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
  });

  const mockResponse = {
    data: [
      {
        id: 'ct1cvke9drbr9jy',
        type: 'containers',
        attributes: {
          barcode: '20439570',
          container_type_id: '384-flat-white-white-proxiplate-plus',
        },
      }
    ],
    included: [
      {
        id: '384-flat-white-white-proxiplate-plus',
        type: 'container_types',
        attributes: {
          id: '384-flat-white-white-proxiplate-plus',
          well_count: 384,
          well_depth_mm: '5.3',
          well_volume_ul: '28.0',
          shortname: '384-flat-white-white-proxiplate-plus',
          col_count: 24,
          is_tube: false
        }
      }
    ]
  };

  const expectedTableData = Immutable.fromJS([
    {
      analyte: 'H3K9',
      label: 'substrate',
      precursor: 619.4,
      product: 70.1
    },
    {
      analyte: 'H3K9',
      label: 'internal_standard',
      precursor: 608.02,
      product: 70.1
    },
    {
      analyte: 'H3K9',
      label: 'product',
      precursor: 605,
      product: 70.1
    }
  ]);

  const optionsWithRatio = [
    {
      value: 'Ratio History',
      name: 'Ratio History',
      isHeader: true
    },
    {
      value: 'h3k9-substrate-h3k9-product',
      name: '1. H3K9 substrate / H3K9 product'
    },
    {
      value: 'Analyte',
      name: 'Analyte',
      isHeader: true
    },
    { value: 'h3k9-substrate',
      name: '1. H3K9 substrate'
    },
    {
      value: 'h3k9-internal_standard',
      name: '2. H3K9 internal_standard'
    },
    { value: 'h3k9-product',
      name: '3. H3K9 product'
    }
  ];

  const options = [
    {
      value: 'Analyte',
      name: 'Analyte',
      isHeader: true
    },
    { value: 'h3k9-substrate',
      name: '1. H3K9 substrate'
    },
    {
      value: 'h3k9-internal_standard',
      name: '2. H3K9 internal_standard'
    },
    { value: 'h3k9-product',
      name: '3. H3K9 product'
    }
  ];

  afterEach(() => {
    sandbox.restore();
    if (dataObjectLcmrm) { dataObjectLcmrm.unmount(); }
    if (sandbox) sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(ContainerAPI, 'index')
      .returns({
        done: (result) => {
          result(mockResponse);
        }
      });
    dataObjectLcmrm = shallow(
      <DataObjectLcmrm dataObject={dataObject} data={testData} runID={'r1ezzv9tpqrq23'} />
    );
    calculateSection = dataObjectLcmrm.find(Section).at(1);
    selectFirstAnalyte = calculateSection.find(Select).at(0).prop('onChange');
    selectSecondtAnalyte = calculateSection.find(Select).at(1).prop('onChange');
    button = calculateSection.find(Button);
  });

  it('should render header', () => {
    const header = dataObjectLcmrm.find(DataObjectFileHeader);
    expect(header.length).equal(1);
    expect(header.props().dataObject).to.deep.equal(dataObject);
  });

  it('should contain a card', () => {
    expect(dataObjectLcmrm.find('Card')).to.have.length(1);
  });

  it('should render transition table', () => {
    const transitionTable = dataObjectLcmrm.find(Table).at(0);
    expect(transitionTable.props().data).to.deep.equal(expectedTableData);
    const bodyCell1 = transitionTable.dive().find('BodyCell').at(0);
    expect(bodyCell1.dive().find('Text').props().data).to.equal(1);
    const bodyCell2 = transitionTable.dive().find('BodyCell').at(1);
    expect(bodyCell2.dive().find('Text').props().data).to.equal('H3K9');
    const bodyCell3 = transitionTable.dive().find('BodyCell').at(2);
    expect(bodyCell3.dive().find('Text').props().data).to.equal('substrate');
    const bodyCell4 = transitionTable.dive().find('BodyCell').at(3);
    expect(bodyCell4.dive().find('Text').props().data).to.equal(619.4);
    const bodyCell5 = transitionTable.dive().find('BodyCell').at(4);
    expect(bodyCell5.dive().find('Text').props().data).to.equal(70.1);
  });

  it('should show empty message in transition table when there are no transitions', () => {
    dataObjectLcmrm = shallow(
      <DataObjectLcmrm
        dataObject={dataObject}
        data={{ barcode: 'W000124518', transition_details: {} }}
        runID={'r1ezzv9tpqrq23'}
      />
    );
    const transitionTable = dataObjectLcmrm.find(Table).at(0);
    expect(transitionTable.dive().find('em').text()).to.equal('There are no transitions');
  });

  it('should show dropdowns for calculate ratio', () => {
    expect(calculateSection.props().title).to.equal('Calculate ratios');
    const firstDropdown = calculateSection.find(Select).at(0);
    const secondDropdown = calculateSection.find(Select).at(1);
    const expectedDropdownOptions = [
      { name: '1. H3K9 (substrate)', value: 'h3k9-substrate' },
      { name: '2. H3K9 (internal_standard)', value: 'h3k9-internal_standard' },
      { name: '3. H3K9 (product)', value: 'h3k9-product' }
    ];
    expect(firstDropdown.props().options).to.deep.equal(expectedDropdownOptions);
    expect(secondDropdown.props().options).to.deep.equal(expectedDropdownOptions);
  });

  it('calculate ratio button should be disabled when both analytes are not selected', () => {
    expect(calculateSection.props().title).to.equal('Calculate ratios');
    expect(calculateSection.find(Button).props().disabled).to.be.true;
    expect(calculateSection.find(Button).props().label).to.equal('Numerator and denominator must be selected');
    selectFirstAnalyte({ target: { value: 'h3k9-product' } });
    expect(dataObjectLcmrm.find(Section).at(1).find(Button).props().disabled).to.be.true;
    selectSecondtAnalyte({ target: { value: 'h3k9-substrate' } });
    expect(dataObjectLcmrm.find(Section).at(1).find(Button).props().disabled).to.be.false;
  });

  it('should add ratio in table on click on calculate ratio button ', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-product' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-substrate' } });
    button.simulate('click');
    const ratioTable = dataObjectLcmrm.find(Table).at(1);
    const bodyCell1 = ratioTable.dive().find('BodyCell').at(0);
    expect(bodyCell1.dive().find('Text').props().data).to.equal(1);
    const bodyCell2 = ratioTable.dive().find('BodyCell').at(1);
    expect(bodyCell2.dive().find('Text').props().data).to.equal('H3K9 product / H3K9 substrate');
  });

  it('should show toast message on click on calculate ratio button if ratio already exist in table', () => {
    const notificationActionSpy = sandbox.stub(NotificationActions, 'createNotification');
    selectFirstAnalyte({ target: { value: 'h3k9-product' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-substrate' } });
    button.simulate('click');
    expect(notificationActionSpy.calledOnceWithExactly({
      text: 'Ratio already exist in the table',
      isError: true
    }));
  });

  it('should remove ratio from table on click on delete icon ', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-product' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-substrate' } });
    button.simulate('click');
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    dataObjectLcmrm.setState({ hoveredRecordId: 'h3k9-product-h3k9-substrate' });
    const ratioTable = dataObjectLcmrm.find(Table).at(1);

    const deleteButton = ratioTable.dive().find('BodyCell').at(2).find(Button);
    deleteButton.simulate('click');

    const updatedRatioTable = dataObjectLcmrm.find(Table).at(1);
    expect(updatedRatioTable.dive().find('Body').find('Row').length).to.equal(1);
    const bodyCell1 = updatedRatioTable.dive().find('BodyCell').at(0);
    expect(bodyCell1.dive().find('Text').props().data).to.equal(1);
    const bodyCell2 = updatedRatioTable.dive().find('BodyCell').at(1);
    expect(bodyCell2.dive().find('Text').props().data).to.equal('H3K9 substrate / H3K9 product');
  });

  it('should add new custom column when selecting ratios and clicking on calculate button', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    const csvDataObjects =  Papa.parse(dataObjectLcmrm.find(LcmrmCSV).props().csvData);
    const headers = csvDataObjects.data[0].filter(header =>  header);
    expect(headers.length).to.equal(5);
    expect(headers.pop()).to.equal('H3K9 substrate / H3K9 product');
    expect(csvDataObjects.data[1].pop()).to.equal('Area ratio');
    expect(csvDataObjects.data[2].pop()).to.equal('63.2342');
  });

  it('should delete new custom column when clicked on delete button in ratio table', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    const csvDataObjects = Papa.parse(dataObjectLcmrm.find(LcmrmCSV).props().csvData);
    const csvTableHeader1 = csvDataObjects.data[0];
    expect(csvTableHeader1.pop()).to.equal('H3K9 substrate / H3K9 product');

    dataObjectLcmrm.setState({ hoveredRecordId: 'h3k9-substrate-h3k9-product' });
    dataObjectLcmrm.find(Table).at(1).dive().find('BodyCell')
      .at(2)
      .find(Button)
      .simulate('click');
    const csvDataObjects1 = Papa.parse(dataObjectLcmrm.find(LcmrmCSV).props().csvData);
    const headers = csvDataObjects1.data[0].filter(header =>  header);
    expect(headers.length).to.equal(4);
    expect(headers.pop()).to.equal('H3K9 product');
  });

  it('should show the computed csv table', () => {
    const lcrmCsv = dataObjectLcmrm.find('LcmrmCSV').dive();
    const csvTable = lcrmCsv.find(CsvViewer);

    expect(csvTable.dive().find('h3').text()).to.equal('qqq_computed.csv');
    expect(csvTable.length).equal(1);
    expect(csvTable.props().data).to.equal(csvData);
  });

  it('should render all the data in the computed csv table', () => {
    const csvDataObjects =  Papa.parse(dataObjectLcmrm.find(LcmrmCSV).props().csvData);
    const testDataAnalytes = _.keys(testData.transition_labels);

    for (let i = 2; i < testData.samples.length; i++) {
      const dataColumn = csvDataObjects.data[i];
      const testDataSampleIndex = i - 2;
      expect(dataColumn.length).to.equal(5);
      expect(dataColumn[0]).to.equal(testData.samples[testDataSampleIndex].sample_name);
      expect(dataColumn[1]).to.equal(testData.samples[testDataSampleIndex].well_name);
      for (let j = 0; j < testDataAnalytes.length; j++) {
        const dataColumnIndex = j + 2;
        expect(parseInt(dataColumn[dataColumnIndex], 10)).to.equal(testData.samples[testDataSampleIndex][testDataAnalytes[j]].area);
      }
    }
  });

  it('should render the default columns only in the computed csv table', () => {
    const csvDataObjects =  Papa.parse(dataObjectLcmrm.find(LcmrmCSV).props().csvData);
    const subheaderColumns = csvDataObjects.data[1];

    expect(subheaderColumns.length).to.equal(5);
    expect(subheaderColumns[0]).to.equal('Name');
    expect(subheaderColumns[1]).to.equal('Pos.');
    for (let i = 2; i < subheaderColumns.length; i++) {
      expect(subheaderColumns[i]).to.equal('Area');
    }
  });

  it('should have select component with options to select analyte', () => {
    expect(dataObjectLcmrm.find(Select).length).to.be.eql(3);
    expect(dataObjectLcmrm.find(Select).at(2).props().options).to.deep.equals(options);
    dataObjectLcmrm.find(Select).at(2).prop('onChange')({ target: { value: 'h3k9-product' } });
    expect(dataObjectLcmrm.state().analyteLabel).to.equal('h3k9-product');
  });

  it('should have Peak area and RT value radio buttons', () => {
    expect(dataObjectLcmrm.find(RadioGroup).length).to.be.eql(1);
    expect(dataObjectLcmrm.find(Radio).length).to.be.eql(2);
    expect(dataObjectLcmrm.find(Radio).at(0).props().label).to.equal('Peak area');
    expect(dataObjectLcmrm.find(Radio).at(1).props().label).to.equal('RT value');
  });

  it('should set state for well_count,col_count and dataWithWellIndex', () => {
    expect(dataObjectLcmrm.instance().state.well_count).to.be.eql(384);
    expect(dataObjectLcmrm.instance().state.col_count).to.be.eql(24);
    expect(dataObjectLcmrm.instance().state.dataWithWellIndex).to.deep.equals(testDataSamples);
  });

  it('should have Plate component with wells and legend', () => {
    expect(dataObjectLcmrm.find(Plate).length).to.be.eql(1);
    expect(dataObjectLcmrm.find(Plate).props().rows).to.equal(16);
    expect(dataObjectLcmrm.find(Plate).props().cols).to.equal(24);
    expect(dataObjectLcmrm.find(Legend).length).to.be.eql(1);
  });

  it('should have color defined in well map when volume is present', () => {
    const plate = dataObjectLcmrm.find(Plate);
    const wells = plate.props().wellMap;
    expect(wells.getIn([0, 'hasVolume'])).to.be.true;
    expect(wells.getIn([0, 'color'])).to.not.be.undefined;
    expect(wells.getIn([1, 'hasVolume'])).to.be.true;
    expect(wells.getIn([1, 'color'])).to.not.be.undefined;
    expect(wells.getIn([40, 'hasVolume'])).to.be.undefined;
    expect(wells.getIn([40, 'color'])).to.be.undefined;
  });

  it('should render aliquot table with well data', () => {
    const aliquotTable = dataObjectLcmrm.find(DataTable);
    expect(aliquotTable.length).equal(1);
    expect(aliquotTable.props().data).lengthOf(164);
    const data = aliquotTable.props().data[0];
    expect(data.Well).to.equal('A1');
    expect(data['a.u.']).to.equal(52105);
  });

  it('should render aliquot table with headers well and a.u.', () => {
    const aliquotTable = dataObjectLcmrm.find(DataTable);
    const headers = aliquotTable.props().headers;
    expect(headers).lengthOf(2);
    expect(headers[0]).to.equal('Well');
    expect(headers[1]).to.equal('a.u.');
  });

  it('should have select component with options of ratio history & analyte', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    dataObjectLcmrm.find(Select).at(2).prop('onChange')({ target: { value: 'h3k9-substrate-h3k9-product' } });
    expect(dataObjectLcmrm.state().analyteLabel).to.equal('h3k9-substrate-h3k9-product');
    expect(dataObjectLcmrm.find(Select).at(2).props().options).to.deep.equals(optionsWithRatio);
  });

  it('should make RT value disable and show ratio data in aliquot table when selected', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    dataObjectLcmrm.find(Select).at(2).prop('onChange')({ target: { value: 'h3k9-substrate-h3k9-product' } });

    expect(dataObjectLcmrm.find(RadioGroup).length).to.be.eql(1);
    expect(dataObjectLcmrm.find(Radio).length).to.be.eql(2);
    expect(dataObjectLcmrm.find(Radio).at(1).props().disabled).to.be.eql(true);

    const aliquotTable = dataObjectLcmrm.find(DataTable);
    expect(aliquotTable.length).equal(1);
    const data = aliquotTable.props().data[0];
    expect(data.Well).to.equal('A1');
    expect(data['a.u.']).to.equal(63.2342);
  });

  it('should remove ratio history from select option when deleted from ratio table', () => {
    selectFirstAnalyte({ target: { value: 'h3k9-substrate' } });
    selectSecondtAnalyte({ target: { value: 'h3k9-product' } });
    button.simulate('click');
    dataObjectLcmrm.find(Select).at(2).prop('onChange')({ target: { value: 'h3k9-substrate-h3k9-product' } });
    expect(dataObjectLcmrm.find(Select).at(2).props().options).to.deep.equals(optionsWithRatio);

    dataObjectLcmrm.setState({ hoveredRecordId: 'h3k9-substrate-h3k9-product' });
    dataObjectLcmrm.find(Table).at(1).dive().find('BodyCell')
      .at(2)
      .find(Button)
      .simulate('click');
    expect(dataObjectLcmrm.find(Select).at(2).props().options).to.deep.equals(options);
    expect(dataObjectLcmrm.state().analyteLabel).to.equal('h3k9-substrate');
  });
});
