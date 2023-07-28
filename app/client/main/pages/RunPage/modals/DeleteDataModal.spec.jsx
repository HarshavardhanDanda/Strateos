import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import _ from 'lodash';
import SessionStore from 'main/stores/SessionStore';
import DatasetActions from 'main/actions/DatasetActions';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import { Select, Table, TableLayout, Tooltip } from '@transcriptic/amino';
import InstructionStore from 'main/stores/InstructionStore';
import DeleteDataModal from './DeleteDataModal';

describe('DeleteDataModal', () => {
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
    const user = {
      id: 'u18dcbwhctbnj',
      name: 'john doe',
      email: 'jdoe@transcriptic.com',
      lastSignInIp: '0.0.0.0',
      createdAt: '2020-05-27T09:16:16.522-07:00'
    };
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.fromJS(user));
    sandbox.stub(InstructionStore, 'getById').returns(instruction);
  });

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  });

  const datasets = [
    {
      created_at: '2022-05-02T15:22:25.852-07:00',
      id: 'd1gz28yexavtr9',
      is_analysis: true,
      run_id: 'r1ezzv9tpqrq23',
      title: 'sample19.csv',
      uploaded_by: 'u18dcbwhctbnj',
    },
    {
      created_at: '2022-05-02T15:22:25.852-07:00',
      id: 'd1gz28yeyui67',
      is_analysis: false,
      instruction_id: 'i1e7ptjt7tthsa',
      title: null,
      uploaded_by: 'u18dcbwhctbnj',
    }
  ];
  const run = { datasets, id: 'r1ezzv9tpqrq23' };

  const deleteDataModal = shallow(
    <DeleteDataModal
      run={Immutable.fromJS(run)}
    />
  );

  it('should render with correct props', () => {
    expect(deleteDataModal.prop('modalId')).to.equal('DELETE_FILE_MODAL');
    expect(deleteDataModal.prop('title')).to.equal('Delete Files');
    expect(deleteDataModal.prop('hasDrawer')).to.equal(true);
    expect(deleteDataModal.prop('drawerTitle')).to.equal('Delete file');
  });

  it('should display a list of analysis datasets with file name, type, id and date created', () => {
    const columns = deleteDataModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('File Name');
    expect(columns.at(1).prop('header')).to.equal('Type');
    expect(columns.at(2).prop('header')).to.equal('ID');
    expect(columns.at(3).prop('header')).to.equal('Date Created');

    const analyses = deleteDataModal.find('Table').prop('data').toJS();
    expect(analyses.length).to.equal(1);
    expect(analyses[0].title).to.equal(datasets[0].title);
    expect(analyses[0].is_analysis).to.equal(datasets[0].is_analysis);
    expect(analyses[0].id).to.equal(datasets[0].id);
    expect(analyses[0].created_at).to.equal(datasets[0].created_at);
  });

  it('should display 6 columns in list of measurement datasets', () => {
    deleteDataModal.find(Select).prop('onChange')({ target: { value: 'measurement' } });
    const columns = deleteDataModal.find('Column');
    expect(columns.at(0).prop('header')).to.equal('Name');
    expect(columns.at(1).prop('header')).to.equal('Instruction Name');
    expect(columns.at(2).prop('header')).to.equal('Dataset ID');
    expect(columns.at(3).prop('header')).to.equal('Instruction ID');
    expect(columns.at(4).prop('header')).to.equal('Type');
    expect(columns.at(5).prop('header')).to.equal('Date Created');

    const measurements = deleteDataModal.find('Table').prop('data').toJS();

    expect(measurements.length).to.equal(1);
    expect(measurements[0].title).to.equal(datasets[1].title);
    expect(measurements[0].instruction_id).to.equal(datasets[1].instruction_id);
    expect(measurements[0].is_analysis).to.equal(datasets[1].is_analysis);
    expect(measurements[0].id).to.equal(datasets[1].id);
    expect(measurements[0].created_at).to.equal(datasets[1].created_at);
  });

  it('should display correct data in list of measurement datasets', () => {
    deleteDataModal.find(Select).prop('onChange')({ target: { value: 'measurement' } });
    const table = deleteDataModal.find(Table).dive();

    expect(table.find(TableLayout.BodyCell).at(1).dive().find(Tooltip)
      .prop('title')).to.equal('data_ref');
    expect(table.find(TableLayout.BodyCell).at(2).dive().find('p')
      .text()).to.equal(_.capitalize(instruction.get('op').split('_').join(' ')));
    expect(table.find(TableLayout.BodyCell).at(3).dive().find('p')
      .text()).to.equal(datasets[1].id);
    expect(table.find(TableLayout.BodyCell).at(4).dive().find('p')
      .text()).to.equal(datasets[1].instruction_id);
    expect(table.find(TableLayout.BodyCell).at(5).dive().find('p')
      .text()).to.equal('Measurement');
    expect(table.find(TableLayout.BodyCell).at(6).dive().find('p')
      .text()).to.equal('05/02/2022');
  });

  it('should delete a dataset with comment', () => {
    const datasetActionsAPI = sandbox.stub(DatasetActions, 'destroy');
    const data = ['d1gz28yeyui67', 'r1ezzv9tpqrq23', 'incorrect'];
    deleteDataModal.find('Table').dive().find('Checkbox').at(0)
      .simulate('change', { target: { checked: 'checked' } });
    deleteDataModal.find('Button').at(1).simulate('click');
    deleteDataModal.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal').dive()
      .find('ModalDrawer')
      .dive()
      .find('Select')
      .simulate('change', { target: { value: 'incorrect' }, stopPropagation: () => undefined });
    deleteDataModal.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal').dive()
      .find('ModalDrawer')
      .dive()
      .find('Button')
      .at(1)
      .simulate('click');
    expect(datasetActionsAPI.lastCall.args).to.deep.equal(data);
  });

  it('should not display measurement option if it has only user role', () => {
    const select = deleteDataModal.find(Select);
    expect(select.prop('options')).to.be.deep.equal([{ value: 'analysis', name: 'Analysis' }]);
  });

  it('should display measurement option if it has another than user role', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS).returns(true);
    const deleteDataModal = shallow(<DeleteDataModal run={Immutable.fromJS(run)} />);
    const select = deleteDataModal.find(Select);

    expect(select.prop('options')).to.be.deep.equal([{ value: 'analysis', name: 'Analysis' }, { value: 'measurement', name: 'Measurement' }]);
  });

  it('should not show note or reason when select dataset for deletion', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').returns(true);
    const wrapper = shallow(
      <DeleteDataModal
        run={Immutable.fromJS(run)}
      />
    );
    wrapper.find('Table').dive().find('Checkbox').at(0)
      .simulate('change', { target: { checked: 'checked' } });
    wrapper.find('Button').at(1).simulate('click');
    expect(wrapper.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal').dive()
      .find('ModalDrawer')
      .dive()
      .find('Select')
      .prop('placeholder')).to.equal('Provide your comment here');
  });

});
