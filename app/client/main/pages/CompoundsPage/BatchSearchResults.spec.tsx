import React from 'react';
import { HTMLAttributes, shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Pagination, List, Table, Column, Button } from '@transcriptic/amino';
import Immutable from 'immutable';
import SessionStore from 'main/stores/SessionStore';
import ReactionStore from 'main/stores/ReactionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import BatchSearchResults from 'main/pages/CompoundsPage/BatchSearchResults';
import RelatedRunsModal from 'main/pages/CompoundsPage/RelatedRunsModal';
import { CompoundBatchesPageActions } from 'main/pages/CompoundsPage/CompoundBatchesActions';
import { BatchesPageActions } from 'main/pages/CompoundsPage/BatchesActions';
import Urls from 'main/util/urls';

interface ListProps extends HTMLAttributes {
   onSelectRow: (batches: Array<Object>, willBeChecked: boolean, selectedRow: Object) => {},
   onSelectAll: (object: Object) => {}
}

const mockReaction = {
  id: 'a6caf6d8-12e2-45f4-b769-fd75fbd265b0',
  name: 'Miracle reaction',
};

describe('BatchSearchResults', () => {
  const sandbox = sinon.createSandbox();
  const batchesData = [{
    samples_created_at: '2022-06-15T11:14:37.217-07:00',
    purity: 51,
    post_purification_mass_yield_mg: 1.1,
    compound: {
      smiles: 'CC(C)(C)c1ccc(S(=O)(=O)Cl)cc1',
    },
    reaction_id: 'a6caf6d8-12e2-45f4-b769-fd75fbd265b0',
    type: 'batches',
    id: 'bat1gujg54nq0002',
    run_count: 2,
    name: 'batch1',
    user: {
      id: 'user123',
      name: 'User Name'
    },
    compound_link_id: 'cmpl1ebsudv4wcwrz',
    synthesis_program_name: 'Demo Synthesis Program',
    synthesis_request_name: 'Demo synthesis_request'
  }];

  const records = Immutable.fromJS(batchesData);

  const visibleColumns = ['structure', 'name', 'status', 'reaction', 'mass yield', 'purity %', 'created at', 'related runs', 'synthesis program', 'synthesis request'];

  const props = {
    data: records,
    selected: {},
    searchOptions: Immutable.fromJS({}),
    pageSize: 12,
    page: 1,
    numPages: 5,
    onSearchPageChange: sandbox.spy(),
    onSelectRow: sandbox.spy(),
    onSortChange: sandbox.spy(),
    history: { push: sandbox.spy() },
    isSearching: false,
    enableSelection: false
  };

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ subdomain: 'test' }));
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_RUNS_IN_LABS).callsFake(() => true);
    sandbox.stub(ReactionStore, 'getById').returns(Immutable.fromJS(mockReaction));
  });

  it('should have a default empty message', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const table = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    expect(table.text()).to.equal('No records.');
  });

  it('should have 9 columns by default', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive();
    expect(list.find('.list__topBar--right').render().text()).to.contains('Columns 9');

    expect(list.find(Table).find(Column).at(0).props().header).to.be.eq('structure');
    expect(list.find(Table).find(Column).at(1).props().header).to.be.eq('name');
    expect(list.find(Table).find(Column).at(2).props().header).to.be.eq('status');
    expect(list.find(Table).find(Column).at(3).props().header).to.be.eq('mass yield');
    expect(list.find(Table).find(Column).at(4).props().header).to.be.eq('purity %');
    expect(list.find(Table).find(Column).at(5).props().header).to.be.eq('created at');
    expect(list.find(Table).find(Column).at(6).props().header).to.be.eq('related runs');
    expect(list.find(Table).find(Column).at(7).props().header).to.be.eq('synthesis program');
    expect(list.find(Table).find(Column).at(8).props().header).to.be.eq('synthesis request');
  });

  it('should render correct data in the table', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    const body = list.find('Block').find('Body').find('Row').at(0);
    expect(body.find('BodyCell').length).to.equal(10);
    const bodycell1 = body.find('BodyCell').at(1);
    expect(bodycell1.dive().find('Molecule').at(0).prop('SMILES')).to.equal('CC(C)(C)c1ccc(S(=O)(=O)Cl)cc1');
    expect(list.find('BodyCell').at(2).dive().find(Button)
      .props().children).to.equal('batch1');
    expect(list.find('BodyCell').at(3).dive().find('StatusPill')
      .dive()
      .text()).to.equal('Failed');
    expect(list.find('BodyCell').at(4).dive().find('Text')
      .props().data).to.equal('1.1 mg');
    expect(list.find('BodyCell').at(5).dive().find('Text')
      .props().data).to.equal('51 %');
    expect(list.find('BodyCell').at(6).dive().find('Time')
      .props().data).to.be.equal('2022-06-15T11:14:37.217-07:00');
    expect(list.find('BodyCell').at(7).dive().find('a')
      .text()).to.equal('2 run(s)');
    expect(list.find('BodyCell').at(8).dive().find('Text')
      .props().data).to.equal('Demo Synthesis Program');
    expect(list.find('BodyCell').at(9).dive().find('Text')
      .props().data).to.equal('Demo synthesis_request');
  });

  it('should render empty column when synthesis program name or synthesis request name is not present', () => {
    const newBatchesData = [{ ...batchesData[0], synthesis_program_name: null, synthesis_request_name: null }];
    const records = Immutable.fromJS(newBatchesData);
    const input = { ...props };
    input.data = records;
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    expect(list.find('HeaderCell').at(8).find('Tooltip').props().children).to.equal('synthesis program');
    expect(list.find('BodyCell').at(8).dive().find('Text')
      .props().data).to.equal('-');
    expect(list.find('HeaderCell').at(9).find('Tooltip').props().children).to.equal('synthesis request');
    expect(list.find('BodyCell').at(9).dive().find('Text')
      .props().data).to.equal('-');
  });

  it('should contain one row', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    const rows = list.find('Block').find('Body').find('Row');
    expect(rows.length).to.equal(1);
  });

  it('should be able to sort columns of search results table', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List)
      .dive()
      .find(Table);
    expect(list.find(Column).at(0).props().sortable).to.be.false;
    expect(list.find(Column).at(1).props().sortable).to.be.true;
    expect(list.find(Column).at(2).props().sortable).to.be.false;
    expect(list.find(Column).at(3).props().sortable).to.be.true;
    expect(list.find(Column).at(4).props().sortable).to.be.true;
    expect(list.find(Column).at(5).props().sortable).to.be.true;
    expect(list.find(Column).at(6).props().sortable).to.be.false;
    expect(list.find(Column).at(7).props().sortable).to.be.true;
    expect(list.find(Column).at(8).props().sortable).to.be.true;
  });

  it('should contain related runs modal', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} visibleColumns={visibleColumns} />)
      .find(List)
      .dive()
      .find(Table)
      .dive();
    expect(list.find('BodyCell').at(8).dive().find(RelatedRunsModal).length).to.be.equal(1);
  });

  it('should have pop over on table header', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List);
    expect(list.prop('popoverOnHeader')).to.be.true;
  });

  it('should have pop over on column value', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />)
      .find(List);
    expect(list.find(Column).at(1).prop('popOver')).to.be.true;
    expect(list.find(Column).at(2).prop('popOver')).to.be.true;
    expect(list.find(Column).at(3).prop('popOver')).to.be.true;
    expect(list.find(Column).at(4).prop('popOver')).to.be.true;
    expect(list.find(Column).at(5).prop('popOver')).to.be.true;
    expect(list.find(Column).at(6).prop('popOver')).to.be.true;
    expect(list.find(Column).at(8).prop('popOver')).to.be.true;
  });

  it('should show pagination if there are records', () => {
    const input = { ...props };
    const list = shallow(<BatchSearchResults {...input} />).find(List);
    expect(list.dive().find(Pagination)).to.have.length(1);
  });

  it('should not show pagination if there are no records', () => {
    const input = { ...props };
    input.data = Immutable.fromJS([]);
    const list = shallow(<BatchSearchResults {...input} />).find(List);
    expect(list.dive().find(Pagination)).to.have.length(0);
  });

  it('should show reaction name url in reaction column in batches page', () => {
    const input = { ...props };
    let list = shallow(<BatchSearchResults {...input} visibleColumns={visibleColumns} />).find(List).dive().find(Table)
      .dive();
    expect(list.find('BodyCell').at(4).dive().find('Url')
      .props().data).to.deep.equal({ url: Urls.reaction('test', batchesData[0].reaction_id), text: 'Miracle reaction' });
    sandbox.restore();
    sandbox.stub(ReactionStore, 'getById').returns(undefined);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ subdomain: 'test' }));
    list = shallow(<BatchSearchResults {...input} visibleColumns={visibleColumns} />).find(List).dive().find(Table)
      .dive();
    expect(list.find('BodyCell').at(4).dive().text()).to.equal('-');
  });

  it('should navigate to compound details page batches tab if batch name is clicked', () => {
    const actionStub = sandbox.stub(CompoundBatchesPageActions, 'updateState');
    const batchSearchResults = mount(<BatchSearchResults {...props} />);
    const list =  batchSearchResults.find(List).find(Table);
    const button = list.find('BodyCell').at(2).find(Button);

    expect(button.length).to.equal(1);
    expect(button.props().children).to.equal(batchesData[0].name);

    button.simulate('click');
    expect(actionStub.calledWith({ searchInput: batchesData[0].id })).to.be.true;
    expect(props.history.push.calledOnce).to.be.true;
    expect(props.history.push.args[0][0]).to.deep.equal({ pathname: Urls.compound(batchesData[0].compound_link_id), state: { tab: 'Batches' } });
  });

  it('should have button with text of batch id if batch does not have a name', () => {
    const newBatchesData = [{ ...batchesData[0], name: undefined }];
    const newProps = { ...props, data: Immutable.fromJS(newBatchesData) };
    const batchSearchResults = mount(<BatchSearchResults {...newProps} />);
    const list =  batchSearchResults.find(List).find(Table);
    const button = list.find('BodyCell').at(2).find(Button);

    expect(button.length).to.equal(1);
    expect(button.props().children).to.equal(newBatchesData[0].id);
  });

  it('should have download button', () => {
    const wrapper = shallow(<BatchSearchResults {...props} />).find('List').dive();
    const button = wrapper.find(Button);

    expect(button.length).to.equal(1);
    expect(button.props().children).to.equal('Download');
    expect(button.prop('disabled')).to.equal(true);
  });

  it('should trigger download action', () => {
    const updatedProps = { ...props, selected: { b1: true } };
    const downloadCSVStub = sandbox.stub(BatchesPageActions, 'downloadCSV');
    const wrapper = shallow(<BatchSearchResults {...updatedProps} />).find('List').dive();

    wrapper.find(Button).simulate('click');
    expect(downloadCSVStub.calledWith(['b1'])).to.be.true;
  });

  it('should have props for selection if enableSelection is true', () => {
    const updatedProps = { ...props, enableSelection: true };
    const list = shallow(<BatchSearchResults {...updatedProps} />).find('List');

    expect(list.props()).to.have.property('onSelectRow');
    expect(list.props()).to.have.property('onSelectAll');
  });

  it('should not have props for selection if enableSelection is false', () => {
    const updatedProps = { ...props, enableSelection: false };
    const list = shallow(<BatchSearchResults {...updatedProps} />).find('List');

    expect(list.props()).to.not.have.property('onSelectRow');
    expect(list.props()).to.not.have.property('onSelectAll');
  });

  it('should call onSelectRow when row is selected', () => {
    const updatedProps = { ...props, selected: { b1: true }, enableSelection: true };
    const wrapper = shallow(<BatchSearchResults {...updatedProps} />);
    const list = wrapper.find('List');
    const listProps = list.props() as ListProps;

    expect(listProps.selected).to.deep.equal({ b1: true });
    listProps.onSelectRow(batchesData, true, { b1: 'value' });
    listProps.onSelectAll([{ b1: 'value' }, { b2: 'value' }]);
    expect(props.onSelectRow.calledTwice).to.be.true;
    expect(props.onSelectRow.calledWith({ b1: 'value' })).to.be.true;
    expect(props.onSelectRow.calledWith([{ b1: 'value' }, { b2: 'value' }])).to.be.true;
  });
});
