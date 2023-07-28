import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import { Select, Table, TableLayout, Tooltip } from '@transcriptic/amino';
import InstructionStore from 'main/stores/InstructionStore';
import DownloadFileModal from './DownloadFileModal';
import { datasets, run } from './ItemForModalTest.js';

describe('DownloadFileModal', () => {

  const sandbox = sinon.createSandbox();
  const instruction = Immutable.fromJS({
    aliquot_ids: null,
    data_name: 'data_name',
    op: 'lcms',
    generated_containers: [],
    executed_at: '2020-03-12T14:50:53.114-07:00',
    operation: {
      op: 'lcms',
      target_mass: 282.06,
      injection_volume: '1500:microliter',
      sample_info: 'SID!Mar12_2218:BAR!700000VHT:B!Mar12_22182020-03-11T2218561:F!C13H9F3N2O2:CHEMS!:IRT!1.128:IIM!Gemini_LowpH.M:AT!FS:SN!Product:PS!Prep:G!Prep',
      dataref: 'data_ref'
    },
    run_id: 'r1e7ptjt6wekhg',
    type: 'instructions',
    id: 'i1e7ptjt7tthsa',
  });

  beforeEach(() => {
    sandbox.stub(InstructionStore, 'getById').returns(instruction);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const downloadFileModal = shallow(
    <DownloadFileModal
      run={Immutable.fromJS(run)}
    />
  );

  it('should display a list of analysis datasets for download', () => {
    const columns = downloadFileModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('File Name');
    expect(columns.at(1).prop('header')).to.equal('Type');
    expect(columns.at(2).prop('header')).to.equal('ID');
    expect(columns.at(3).prop('header')).to.equal('Date Created');

    const analyses = downloadFileModal.find('Table').prop('data').toJS();
    expect(analyses.length).to.equal(2);
    expect(analyses[0].title).to.equal(datasets[0].title);
    expect(analyses[0].is_analysis).to.equal(datasets[0].is_analysis);
    expect(analyses[0].id).to.equal(datasets[0].id);
    expect(analyses[0].created_at).to.equal(datasets[0].created_at);
  });

  it('should display a list of measurement datasets for download', () => {
    downloadFileModal.find(Select).prop('onChange')({ target: { value: 'measurement' } });
    const columns = downloadFileModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('File Name');
    expect(columns.at(1).prop('header')).to.equal('Type');
    expect(columns.at(2).prop('header')).to.equal('ID');
    expect(columns.at(3).prop('header')).to.equal('Date Created');

    const measurements = downloadFileModal.find('Table').prop('data').toJS();
    expect(measurements.length).to.equal(2);
    expect(measurements[0].title).to.equal(datasets[2].title);
    expect(measurements[0].is_analysis).to.equal(datasets[2].is_analysis);
    expect(measurements[0].id).to.equal(datasets[2].id);
    expect(measurements[0].created_at).to.equal(datasets[2].created_at);
  });

  it('should display a list of all datasets for download ', () => {
    downloadFileModal.find(Select).prop('onChange')({ target: { value: 'all' } });
    const columns = downloadFileModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('File Name');
    expect(columns.at(1).prop('header')).to.equal('Type');
    expect(columns.at(2).prop('header')).to.equal('ID');
    expect(columns.at(3).prop('header')).to.equal('Date Created');

    const all_datasets = downloadFileModal.find('Table').prop('data').toJS();
    expect(all_datasets.length).to.equal(4);
    expect(all_datasets[0].is_analysis).to.equal(datasets[0].is_analysis);
    expect(all_datasets[1].is_analysis).to.equal(datasets[1].is_analysis);
    expect(all_datasets[2].is_analysis).to.equal(datasets[2].is_analysis);
    expect(all_datasets[3].is_analysis).to.equal(datasets[3].is_analysis);
  });

  it('should display correct data in list of measurement datasets', () => {
    downloadFileModal.find(Select).prop('onChange')({ target: { value: 'measurement' } });
    const table = downloadFileModal.find(Table).dive();

    expect(table.find(TableLayout.BodyCell).at(1).dive().find(Tooltip)
      .prop('title')).to.equal('data_ref');
    expect(table.find(TableLayout.BodyCell).at(2).dive().find('p')
      .text()).to.equal('Measurement');
    expect(table.find(TableLayout.BodyCell).at(3).dive().find('p')
      .text()).to.equal(datasets[2].id);
  });
});
