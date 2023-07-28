import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import { List, Button } from '@transcriptic/amino';

import AcsControls from 'main/util/AcsControls';
import { simulateAPICallComplete } from 'main/components/SelectorContent/SelectorContentNew.spec';
import FeatureConstants  from '@strateos/features';
import CompoundSourceSelectorHOC, { CompoundSourceSelector } from 'main/pages/ReactionPage/CompoundSourceSelector';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import CompoundStore from 'main/stores/CompoundStore';
import MaterialStore from 'main/stores/MaterialStore';
import CompoundSourceSearchFilters from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceSearchFilters';
import CompoundLinkedContainerSearchResults from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundLinkedContainerSearchResults';
import { getDefaultSearchPerPage } from 'main/util/List';
import EMoleculesSearchResults from './EMoleculesSearchResults';
import ResourceEmptyState from './ResourceEmptyState';
import MaterialSearchResults from './MaterialSearchResults';

describe('CompoundSourceSelector', () => {

  const sandbox = sinon.createSandbox();

  let page;
  const compound = {
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
    refId: '1233',
    id: '123456778',
    linkId: 'cmp1'
  };

  const originalCompound = {
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
    refId: '1233',
    id: '123456778',
    linkId: 'cmp1'
  };

  const eM = Immutable.fromJS([{
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: '1,3,7-trimethyl-2,3,6,7-tetrahydro-1h-purine-2,6-dione',
    id: '1317_1',
    supplierName: 'InterBioScreen',
    tier: 3,
    estimatedCost: '$0.25/mg',
    sku: '327919424',
    tierText: 'Tier 3, Ships within 4 weeks',
    structureUrl: 'https://strateos-bb.emolecules.com/cgi-bin/more?vid=480615'
  }]);

  const emptyEM = Immutable.List();

  const container = Immutable.fromJS({
    id: 'ct1',
    type: 'containers',
    label: 'container',
    created_at: new Date(2019, 10, 24),
    updated_at: new Date(2020, 10, 24)
  }
  );

  const material = Immutable.fromJS({
    vendor_name: 'Acros Organics',
    material_type: 'individual',
    vendor: {
      id: 'vend185rru7rd8rg',
      name: 'Acros Organics'
    },
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: 'Benzylamine',
    supplier: { name: 'Acros Organics' },
    is_private: false,
    compound_id: '123456778',
    vendor_id: 'vend185rru7rd8rg',
    compoundName: 'cust1',
    orderbale_material_components: [
      {
        material_id: 'mat1fvcvr6hfvpeb',
        resource_id: 'rs1fvcvmb3e9xhw'
      }
    ],
    material_components: [
      {
        resource: {
          compound: {
            model: {
              id: 'id-1'
            }
          }
        }
      }
    ],
    id: 'mat1fvcvr6hfvpeb',
    tier: '6 days'
  });

  const searchSource = 'user_inventory';

  const search = Immutable.fromJS({
    results: [{ id: 'ct1' }],
    page: 1,
    num_pages: 1,
    per_page: getDefaultSearchPerPage()
  });

  const compoundInfo = Immutable.fromJS({
    id: 'cmp1',
    name: 'cust1',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    reference_id: '1233'
  });

  const props = {
    onRowClick: () => {},
    onSelectRow:  () => {},
    hasResults: true,
    search: search,
    searchSource: searchSource,
    numPages: 1,
    data: Immutable.fromJS({ source: searchSource, labId: 'lab1', compound: compound, originalCompound: originalCompound })
  };

  afterEach(() => {
    page.unmount();
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(ContainerStore, 'getById').returns(container);
    sandbox.stub(ContainerTypeStore, 'getById')
      .returns(Immutable.Map({
        isTube: true
      }));
    sandbox.stub(MaterialStore, 'getById').returns(material);
    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS)
      .returns(true);
  });

  it('should have tablayout and spinner', () => {
    page = mount(<CompoundSourceSelectorHOC {...props} hasResults={false} />);
    expect(page.find('TabLayout')).to.have.lengthOf(1);
    expect(page.find('Spinner')).to.have.lengthOf(1);
  });

  it('should have a sidebar', () => {
    page = mount(<CompoundSourceSelectorHOC {...props} />);

    simulateAPICallComplete(page);
    expect(page.find('Spinner')).to.have.lengthOf(0);
    expect(page.find('ZeroState')).to.have.lengthOf(0);
    expect(page.find(CompoundSourceSearchFilters)).to.have.lengthOf(1);
  });

  it('CompoundLinkedContainersSearchResults should have 8 columns', () => {
    page = mount(<CompoundSourceSelectorHOC {...props} />);

    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find(CompoundLinkedContainerSearchResults);
    const columns = ContainerSearchResults.find('HeaderCell');
    expect(columns).to.have.length(9);
    expect(columns.at(0).find('MasterCheckbox').length).to.equal(1);
    expect(columns.at(1).text()).to.equal('structure');
    expect(columns.at(2).text()).to.equal('name');
    expect(columns.at(3).text()).to.equal('ref id');
    expect(columns.at(4).text()).to.equal('type');
    expect(columns.at(5).text()).to.equal('container');
    expect(columns.at(6).text()).to.equal('compound id');
    expect(columns.at(7).text()).to.equal('created');
    expect(columns.at(8).text()).to.equal('last used');
  });

  it('CompoundLinkedContainersSearchResults should have 2 sortable columns', () => {
    sandbox.stub(CompoundStore, 'getById').returns(compoundInfo);
    page = mount(<CompoundSourceSelectorHOC {...props} />);
    simulateAPICallComplete(page);

    const ContainerSearchResults = page.find(CompoundLinkedContainerSearchResults);
    const table = ContainerSearchResults.find(List).find('Table');
    const sortableColumns = table.find('SortableHeader');
    expect(sortableColumns).to.have.length(2);
  });

  it('should select container on row select', () => {
    sandbox.stub(CompoundStore, 'getById').returns(compoundInfo);
    const onSelectRow = sandbox.stub();
    const actions = {
      updateState: sandbox.stub(),
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(<CompoundSourceSelectorHOC {...props} onSelectRow={onSelectRow} actions={actions} />);
    simulateAPICallComplete(page);
    const ContainerSearchResults = page.find(CompoundLinkedContainerSearchResults).find(List);
    const table = ContainerSearchResults.find('Table');
    expect(table).to.have.length(1);
    const checkbox = table.find('Checkbox');
    const input = checkbox.find('input').at(1);
    input.simulate('change', { target: { checked: 'checked' } });
    expect(onSelectRow.calledOnce).to.equal(true);
    expect(actions.updateState.calledWith({ selected: ['ct1'] })).to.be.true;
  });

  it('EMoleculesSearchResults should have 6 columns', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        data={Immutable.fromJS({ source: 'e_molecules', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'e_molecules'}
        eMoleculesCurrentPage={eM}
        actions={actions}
      />);

    simulateAPICallComplete(page);

    const eMoleculesSearchResults = page.find(EMoleculesSearchResults);
    const columns = eMoleculesSearchResults.find('HeaderCell');
    expect(columns).to.have.length(7);
    expect(columns.at(0).find('MasterCheckbox').length).to.equal(1);
    expect(columns.at(1).text()).to.equal('structure');
    expect(columns.at(2).text()).to.equal('name');
    expect(columns.at(3).text()).to.equal('supplier');
    expect(columns.at(4).text()).to.equal('url');
    expect(columns.at(5).text()).to.equal('estimated cost');
    expect(columns.at(6).text()).to.equal('tier');
  });

  it('EMoleculesSearchResults should have 1 sortable columns', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        data={Immutable.fromJS({ source: 'e_molecules', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'e_molecules'}
        eMoleculesCurrentPage={eM}
        actions={actions}
      />);

    simulateAPICallComplete(page);
    const eMoleculesSearchResults = page.find(EMoleculesSearchResults);
    const sortableColumns = eMoleculesSearchResults.find('SortableHeader');
    expect(sortableColumns).to.have.length(1);
  });

  it('Zero EMoleculesSearchResults should have zero state', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        hasResults={false}
        data={Immutable.fromJS({ source: 'e_molecules', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'e_molecules'}
        eMoleculesCurrentPage={emptyEM}
        actions={actions}
      />);
    simulateAPICallComplete(page);
    const eMoleculesSearchResults = page.find(ResourceEmptyState);
    expect(eMoleculesSearchResults).to.have.length(1);
  });

  it('Strateos Source Results should have 8 columns', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    sandbox.stub(CompoundStore, 'getById').returns(compoundInfo);

    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        data={Immutable.fromJS({ source: 'strateos', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'strateos'}
        actions={actions}
      />);
    simulateAPICallComplete(page);

    const materialSearchResults = page.find(MaterialSearchResults);
    const columns = materialSearchResults.find('HeaderCell');
    expect(columns).to.have.length(9);
    expect(columns.at(0).find('MasterCheckbox').length).to.equal(1);
    expect(columns.at(1).text()).to.equal('structure');
    expect(columns.at(2).text()).to.equal('name');
    expect(columns.at(3).text()).to.equal('ref id');
    expect(columns.at(4).text()).to.equal('mol wt');
    expect(columns.at(5).text()).to.equal('compound id');
    expect(columns.at(6).text()).to.equal('supplier');
    expect(columns.at(7).text()).to.equal('vendor');
    expect(columns.at(8).text()).to.equal('tier');
  });

  it('Strateos Source Zero MaterialSearchResults should have zero state', () => {
    const search = Immutable.fromJS({
      results: [],
      page: 1,
      num_pages: 1,
      per_page: getDefaultSearchPerPage()
    });

    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        hasResults={false}
        search={search}
        isSearching={false}
        searchSource={'strateos'}
        actions={actions}
      />);
    simulateAPICallComplete(page);

    const materialSearchResults = page.find(ResourceEmptyState);
    expect(materialSearchResults).to.have.length(1);
  });

  it('should have add container button when source is User inventory', () => {
    const search = Immutable.fromJS({
      results: [],
      page: 1,
      num_pages: 1,
      per_page: getDefaultSearchPerPage()
    });

    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };

    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        search={search}
        searchSource={'user_inventory'}
        actions={actions}
      />);
    simulateAPICallComplete(page);

    const button = page.find(Button);
    expect(button.children().text()).to.equal('Add container');
  });

  it('should not have add container button when feature code not present', () => {
    sandbox.restore();

    sandbox.stub(AcsControls, 'isFeatureEnabled')
      .withArgs(FeatureConstants.CREATE_SAMPLE_SHIPMENTS)
      .returns(false);
    sandbox.stub(ContainerStore, 'getById').returns(container);

    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };

    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        data={Immutable.fromJS({ source: 'strateos', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'user_inventory'}
        actions={actions}
      />);
    simulateAPICallComplete(page);

    const button = page.find(Button);
    expect(button.exists()).to.be.false;
  });

  it('EMoleculesSearchResults should have 7 columns for Alternate Forms', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    page = mount(
      <CompoundSourceSelectorHOC
        {...props}
        data={Immutable.fromJS({ source: 'e_molecules', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        eMoleculesSearchType={'ALTERNATE'}
        searchSource={'e_molecules'}
        eMoleculesCurrentPage={eM}
        actions={actions}
      />);
    simulateAPICallComplete(page);

    const eMoleculesSearchResults = page.find(EMoleculesSearchResults);
    const columns = eMoleculesSearchResults.find('HeaderCell');
    expect(columns).to.have.length(8);
    expect(columns.at(0).find('MasterCheckbox').length).to.equal(1);
    expect(columns.at(1).text()).to.equal('structure');
    expect(columns.at(2).text()).to.equal('name');
    expect(columns.at(3).text()).to.equal('CAS');
    expect(columns.at(4).text()).to.equal('supplier');
    expect(columns.at(5).text()).to.equal('url');
    expect(columns.at(6).text()).to.equal('estimated cost');
    expect(columns.at(7).text()).to.equal('tier');
  });

  it('should call load method when component is mounted', () => {
    const actions = {
      doSearch: sandbox.stub(),
      onSearchFilterChange: sandbox.stub()
    };
    const loadSpy = sandbox.spy(CompoundSourceSelector.prototype, 'load');
    page = mount(
      <CompoundSourceSelector
        {...props}
        onSortChange={() => {}}
        onSearchInputChange={() => {}}
        onSearchFilterChange={() => {}}
        onSearchPageChange={() => {}}
        onSearchFailed={() => {}}
        page={() => {}}
        numPages={() => {}}
        pageSize={() => {}}
        searchOptions={{}}
        isSearching
        data={Immutable.fromJS({ source: 'strateos', labId: 'lab1', compound: compound, originalCompound: originalCompound })}
        searchSource={'user_inventory'}
        actions={actions}
      />);
    expect(loadSpy.calledOnce).to.be.true;
  });
});
