import React from 'react';
import Immutable from 'immutable';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Button, List, Molecule, Table, TableLayout, Column, DateTime } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import ACSControls from 'main/util/AcsControls';
import HazardPopoverTags from 'main/components/Hazards/HazardPopoverTags';
import FeatureStore from 'main/stores/FeatureStore';
import CompoundSearchResults from './CompoundSearchResults';

describe('CompoundSearchResults', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const data = Immutable.List([
    Immutable.Map({
      id: 'cmpl1eunkt55cz674',
      type: 'compounds',
      name: 'option1',
      reference_id: 'option1',
      organization_id: 'org13',
      created_by: 'u19ahey7f2vyx',
      created_at: '2020-09-09T03:21:58.628-07:00',
      properties: {},
      search_score: null,
      clogp: '-0.3808',
      formula: 'Rb',
      inchi: 'InChI=1S/Rb',
      inchi_key: 'IGLNJRXAVVLDKE-UHFFFAOYSA-N',
      molecular_weight: '85.47',
      exact_molecular_weight: '84.91179',
      smiles: '[Rb]',
      cas_number: '58-08-2',
      mfcd_number: 'MFCD12345678',
      pub_chem_id: 'pubchem123',
      tpsa: '0.0',
      labels: Immutable.List([
        {
          name: 'test',
          organization_id: 'org13'
        }
      ])
    })
  ]);

  const props = {
    data: Immutable.List(),
    selected: ['cmpl1eunkt55cz674'],
    searchOptions: Immutable.Map({ searchSimilarity: true }),
    pageSize: 12,
    page: 1,
    numPages: 5,
    onSearchPageChange: () => {},
    onSelectRow: () => {},
    onSortChange: () => {},
    onSearchFilterChange: () => {},
    onRowClick: () => {},
    isSearching: false
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('CompoundSearchResults should have List', () => {
    wrapper = mount(<CompoundSearchResults {...props} />);
    const list = wrapper.find(List);
    expect(list.length).to.equal(1);
  });

  it('CompoundSearchResults should have download button if ACS permission is present', () => {
    sandbox.stub(ACSControls, 'isFeatureEnabled').returns(true);
    wrapper = mount(<CompoundSearchResults {...props} />);
    const button = wrapper.find(Button);
    expect(button.length).to.equal(1);
    expect(button.text()).to.equal('Download');
    expect(button.prop('disabled')).to.equal(true);
  });

  it('CompoundSearchResults should have download button if ACS permission is absent', () => {
    sandbox.stub(ACSControls, 'isFeatureEnabled').returns(false);
    wrapper = mount(<CompoundSearchResults {...props} />);
    const button = wrapper.find(Button);
    expect(button.length).to.equal(0);
  });

  it('CompoundSearchResults should have 12 columns by default', () => {
    wrapper = mount(<CompoundSearchResults {...props} />);
    expect(wrapper.find('Table').length).to.equal(1);
    expect(wrapper.find('Table').instance().props.children.length).to.equal(12);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(12);
  });

  it('CompoundSearchResults should allow toggling of columns', () => {
    wrapper = mount(<CompoundSearchResults {...props} />);
    expect(wrapper.find('Table').length).to.equal(1);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(12);

    wrapper.find('.tx-type--secondary').at(0).simulate('click');
    const cbPubChemID = wrapper.find('Checkbox').filterWhere((n) => n.text() === 'Pubchem ID');
    cbPubChemID.simulate('change', { target: { value: 'Pubchem ID' } });
    expect(wrapper.instance().state.visibleColumns.length).to.equal(13);
    expect(wrapper.instance().state.visibleColumns.includes('Pubchem ID')).to.be.true;
    expect(wrapper.find('Table').instance().props.children.length).to.equal(13);
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

    wrapper = mount(<CompoundSearchResults {...props} />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.COMPOUNDS_TABLE
    });
  });

  it('CompoundSearchResults should have relative width for structure, nickname and labels', () => {
    wrapper = shallow(
      <CompoundSearchResults {...Object.assign(props, { data })} />
    );
    wrapper.setState({
      visibleColumns: ['structure', 'nickname', 'labels', 'id']
    });
    const list = wrapper.find(List);
    const listColumn = list.find(Column).filterWhere(t => t.props().relativeWidth);

    const structureTableCell = listColumn
      .at(0);
    const nicknameCall = listColumn
      .at(1);
    const labelCell = listColumn
      .at(2);
    expect(structureTableCell.props().relativeWidth).be.eq(1.4);
    expect(nicknameCall.props().relativeWidth).be.eq(1.1);
    expect(labelCell.props().relativeWidth).be.eq(1.1);
  });

  it('should be able to pass visiblColumns as prop', () => {
    wrapper = shallow(<CompoundSearchResults {...Object.assign(props, { visibleColumns: ['a', 'b'] })} />);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(2);
  });

  it('should set selection props as default', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const list = wrapper.find(List);
    expect(list.prop('disabledSelection')).to.equal(false);
    expect(list.prop('selected')).to.deep.equal({ cmpl1eunkt55cz674: true });
  });

  it('should be able to disable selection', () => {
    wrapper = shallow(<CompoundSearchResults {...props} enableSelection={false} />);
    const list = wrapper.find(List);
    expect(list.prop('disabledSelection')).to.equal(true);
    expect(list.prop('selected')).to.deep.equal({});
  });

  it('should not have actions when hideActions prop is true', () => {
    wrapper = shallow(<CompoundSearchResults {...Object.assign(props, { hideActions: true })} />);
    expect(wrapper.find(List).prop('actions')).to.be.equal(undefined);
  });

  it('should render actions if hideActions prop is false', () => {
    sandbox.stub(ACSControls, 'isFeatureEnabled').returns(true);
    wrapper = shallow(<CompoundSearchResults {...Object.assign(props, { hideActions: false })} />);
    expect(wrapper.find(List).prop('actions')).to.be.not.equal(undefined);
    expect(wrapper.find(List).dive().find(Button).dive()
      .find('span')
      .text()).equal('Download');
  });

  it('should have cas number as non default column', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    expect(wrapper.instance().state.visibleColumns.includes('CAS number')).to.be.false;
  });

  it('should have mfcd number as non default column', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    expect(wrapper.instance().state.visibleColumns.includes('MFCD number')).to.be.false;
  });

  it('should have pubchem ID as non default column', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    expect(wrapper.instance().state.visibleColumns.includes('Pubchem ID')).to.be.false;
  });

  it('should show correct column data', () => {
    const compound = data.get('0');
    wrapper = shallow(<CompoundSearchResults {...props} data={data} visibleColumns={undefined} />);
    wrapper.instance().setState({
      visibleColumns: [
        ...wrapper.instance().state.visibleColumns,
        'CAS number',
        'MFCD number',
        'Pubchem ID'
      ] });

    const table = wrapper.find(List).dive().find(Table).dive();

    expect(table.find(TableLayout.BodyCell).at(1).find(Molecule).prop('SMILES')).to.equal(compound.get('smiles'));
    expect(table.find(TableLayout.BodyCell).at(2).dive().find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('name'));
    expect(table.find(TableLayout.BodyCell).at(4).dive().find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('reference_id'));
    expect(table.find(TableLayout.BodyCell).at(5).dive().find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('id'));
    expect(table.find(TableLayout.BodyCell).at(6).dive().find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('formula'));
    expect(table.find(TableLayout.BodyCell).at(7).dive().find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('molecular_weight'));
    expect(table.find(TableLayout.BodyCell).at(9).dive().find(HazardPopoverTags)
      .props().hazards.length).to.equal(0);
    expect(table.find(TableLayout.BodyCell).at(10).dive().find('Tooltip')
      .dive()
      .text()).to.equal('Private');
    expect(table.find(TableLayout.BodyCell).at(11).find(DateTime).dive()
      .text()).to.equal('Sep 9, 2020');
    expect(table.find(TableLayout.BodyCell).at(13).find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('cas_number'));
    expect(table.find(TableLayout.BodyCell).at(14).find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('mfcd_number'));
    expect(table.find(TableLayout.BodyCell).at(15).find('Tooltip')
      .dive()
      .text()).to.equal(compound.get('pub_chem_id'));
  });

  it('CompoundSearchResults columns are sortable', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);
    expect(table.find(Column).at(0).props().sortable).to.be.false;
    expect(table.find(Column).at(1).props().sortable).to.be.true;
    expect(table.find(Column).at(2).props().sortable).to.be.false;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.false;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
    expect(table.find(Column).at(6).props().sortable).to.be.true;
    expect(table.find(Column).at(7).props().sortable).to.be.true;
    expect(table.find(Column).at(8).props().sortable).to.be.true;
    expect(table.find(Column).at(9).props().sortable).to.be.true;
    expect(table.find(Column).at(10).props().sortable).to.be.true;
    expect(table.find(Column).at(11).props().sortable).to.be.false;
    expect(table.find(Column).at(12).props().sortable).to.be.false;
    expect(table.find(Column).at(13).props().sortable).to.be.true;
    expect(table.find(Column).at(14).props().sortable).to.be.true;
    expect(table.find(Column).at(15).props().sortable).to.be.true;
    expect(table.find(Column).at(16).props().sortable).to.be.true;
  });

  it('should have pop over on table header', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);
    expect(table.prop('popoverOnHeader')).to.be.true;
  });

  it('should have pop over on column value', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);
    expect(table.find(Column).at(1).prop('popOver')).to.be.true;
    expect(table.find(Column).at(3).prop('popOver')).to.be.true;
    expect(table.find(Column).at(4).prop('popOver')).to.be.true;
    expect(table.find(Column).at(5).prop('popOver')).to.be.true;
    expect(table.find(Column).at(6).prop('popOver')).to.be.true;
    expect(table.find(Column).at(7).prop('popOver')).to.be.true;
    expect(table.find(Column).at(8).prop('popOver')).to.be.true;
    expect(table.find(Column).at(9).prop('popOver')).to.be.true;
    expect(table.find(Column).at(10).prop('popOver')).to.be.true;
  });

  it('should render fa-empty-set icon for structureless compound', () => {
    const updatedData = Immutable.List([
      Immutable.Map({
        id: 'cmpl1eunkt55cz674',
        type: 'compounds',
        name: 'option1',
        reference_id: 'option1',
        organization_id: 'org13',
        created_by: 'u19ahey7f2vyx',
        created_at: '2020-09-09T03:21:58.628-07:00',
        properties: {},
        search_score: null,
        clogp: null,
        formula: null,
        inchi: null,
        inchi_key: null,
        molecular_weight: null,
        exact_molecular_weight: null,
        smiles: null,
        cas_number: null,
        mfcd_number: null,
        pub_chem_id: null,
        tpsa: null,
        labels: Immutable.List([
          {
            name: 'test',
            organization_id: 'org13'
          }
        ])
      })
    ]);
    wrapper = mount(<CompoundSearchResults {...props} data={updatedData} visibleColumns={undefined} />);
    const icon = wrapper.find('Molecule').find('i').at(1).prop('className');
    expect(icon).to.include('fal fa-empty-set');
  });

  it('CompoundSearchResults should render organization column if user have VIEW_LAB_COMPOUNDS permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);

    expect(table.find(Column).length).to.equal(20);
    expect(table.find(Column).at(16).props().header).to.equal('Organization');
    expect(table.find(Column).at(16).props().sortable).to.be.true;
  });

  it('CompoundSearchResults should not render organization column for Scientist user', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(false);
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);

    expect(table.find(Column).length).to.equal(19);
    table.find(Column).findWhere((column) => expect(column.prop('header')).to.not.equal('Organization'));
  });

  it('should have libraries as non default column', () => {
    wrapper = shallow(<CompoundSearchResults {...props} />);
    expect(wrapper.instance().state.visibleColumns.includes('Libraries')).to.be.false;
  });

  it('CompoundSearchResults should render libraries column if user have VIEW_LIBRARIES permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);

    expect(table.find(Column).length).to.equal(20);
    expect(table.find(Column).at(12).props().header).to.equal('Libraries');

  });

  it('CompoundSearchResults should not render libraries column if user dont have VIEW_LIBRARIES permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LIBRARIES).returns(false);
    wrapper = shallow(<CompoundSearchResults {...props} />);
    const table = wrapper.find(List);

    expect(table.find(Column).length).to.equal(19);
    table.find(Column).findWhere((column) => expect(column.prop('header')).to.not.equal('Libraries'));

  });

});
