import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { BrowserRouter as Router } from 'react-router-dom';
import Imm from 'immutable';
import { MoleculeViewer, Tag, SearchFilter, Checkbox } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import * as Amino from '@transcriptic/amino';

import CompoundsTagInput from 'main/pages/CompoundsPage/CompoundsTagInput.jsx';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import CompoundSearchFilters from 'main/pages/CompoundsPage/CompoundSearchFilters';
import OrganizationTypeAhead from 'main/pages/InventoryPage/OrganizationFilter';
import FeatureStore from 'main/stores/FeatureStore';
import StructureSearchModal from './StructureSearchModal';

describe('CompoundSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  const onSearchFilterChange = sandbox.stub();
  let compoundSearchFilters;
  afterEach(() => {
    sandbox.restore();
    compoundSearchFilters.unmount();
  });

  it('should have SearchField to search the Compounds', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar'
          }
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = compoundSearchFilters.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
  });

  it('SearchField to search the Compounds should have options of all, name, reference id, id, cas number, external system id and library if user have VIEW_LIBRARIES permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar'
          }
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = compoundSearchFilters.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.find('SearchField').props().categories.length).to.equal(7);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].value).to.equal('all');
    expect(searchFilterWrapper.find('SearchField').props().categories[1].value).to.equal('name');
    expect(searchFilterWrapper.find('SearchField').props().categories[2].value).to.equal('reference_id');
    expect(searchFilterWrapper.find('SearchField').props().categories[3].value).to.equal('id');
    expect(searchFilterWrapper.find('SearchField').props().categories[4].value).to.equal('cas_number');
    expect(searchFilterWrapper.find('SearchField').props().categories[5].value).to.equal('external_system_id');
    expect(searchFilterWrapper.find('SearchField').props().categories[6].value).to.equal('library');
  });

  it('SearchField to search the Compounds should have only six fields if do not have VIEW_LIBRARIES Permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LIBRARIES).returns(false);
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar'
          }
        })}
        onSearchFilterChange={onSearchFilterChange}
      />
    );
    const searchFilterWrapper = compoundSearchFilters.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.find('SearchField').props().categories.length).to.equal(6);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].value).to.equal('all');
    expect(searchFilterWrapper.find('SearchField').props().categories[1].value).to.equal('name');
    expect(searchFilterWrapper.find('SearchField').props().categories[2].value).to.equal('reference_id');
    expect(searchFilterWrapper.find('SearchField').props().categories[3].value).to.equal('id');
    expect(searchFilterWrapper.find('SearchField').props().categories[4].value).to.equal('cas_number');
    expect(searchFilterWrapper.find('SearchField').props().categories[5].value).to.equal('external_system_id');
  });

  it('Structure Similarity Search with valid SMILES String', () => {
    const structureSearchModal = sandbox.stub(Amino, 'MoleculeViewer').returns(() => {});
    const drawStructureSpy = sandbox.spy();
    const opts = Imm.Map({ searchSimilarity: 'ClC1CCCCC1' });
    const actions = {
      onSearchSimilarityChange: sinon.stub(),
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = mount(
      <Router>
        <div>
          <StructureSearchModal
            SMILES={opts.get('searchSimilarity')}
            onSave={value => actions.onSearchSimilarityChange(value)}
          />
          <CompoundSearchFilters
            searchOptions={opts}
            drawStructure={drawStructureSpy}
            onSearchSimilarityChange={value => actions.onSearchSimilarityChange(value)}
            onSearchFilterChange={options => actions.onSearchFilterChange(options)}
          />
        </div>
      </Router>
    );

    expect(compoundSearchFilters.find(MoleculeViewer).length).to.eql(1);
    expect(compoundSearchFilters.find(SinglePaneModal).length).to.eql(1);
    // We need to use a string selector for ConnectedModal here because Modal.jsx does some complicated displayName rewriting
    expect(compoundSearchFilters.find(StructureSearchModal).find('ConnectedSinglePaneModal')
      .find('SinglePaneModal').prop('modalOpen')).to.be.false;
    compoundSearchFilters.find('MoleculeViewer').props().onExpand();

    expect(drawStructureSpy.calledOnce).to.equal(true);
    expect(compoundSearchFilters.find('MoleculeViewer').props().SMILES).to.eq('ClC1CCCCC1');
    expect(structureSearchModal.called).to.be.true;
  });

  it('Structure Similarity Search with invalid SMILES String', () => {
    const structureSearchModal = sandbox.stub(Amino, 'MoleculeViewer').returns(() => {});
    const opts = Imm.Map({ searchSimilarity: 'C%$$s' });
    const actions = {
      onSearchSimilarityChange: sinon.stub(),
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = mount(
      <Router>
        <div>
          <StructureSearchModal
            SMILES={opts.get('searchSimilarity')}
            onSave={value => actions.onSearchSimilarityChange(value)}
          />
          <CompoundSearchFilters
            searchOptions={opts}
            drawStructure={() =>  ModalActions.open(StructureSearchModal.MODAL_ID)}
            onSearchSimilarityChange={value => actions.onSearchSimilarityChange(value)}
            onSearchFilterChange={options => actions.onSearchFilterChange(options)}
          />
        </div>
      </Router>
    );
    expect(compoundSearchFilters.find('MoleculeViewer').props().SMILES).to.eq('C%$$s');
    expect(structureSearchModal.called).to.be.true;
  });

  it('should filter by Labels', () => {
    const opts = Imm.Map({ searchLabel: ['python'] });
    const actions = {
      onSearchSimilarityChange: sinon.stub(),
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = mount(
      <CompoundSearchFilters
        searchOptions={opts}
        drawStructure={() =>  ModalActions.open(StructureSearchModal.MODAL_ID)}
        onSearchSimilarityChange={value => actions.onSearchSimilarityChange(value)}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    );

    expect(compoundSearchFilters.length).to.equal(1);
    const filterTitles = compoundSearchFilters.find(CompoundsTagInput);
    const tagInput = filterTitles.find('.tag-input__text');
    tagInput.simulate('input', { target: { value: 'python' } });

    tagInput.simulate('keyup', { key: 'Enter' });
    expect(filterTitles.find(Tag).length).to.eql(1);
    expect(filterTitles.find(Tag).prop('text')).to.eql('python');
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
  });

  it('should filter by hazardous flags', () => {
    const opts = Imm.Map({ searchHazard: ['flammable'], searchSource: 'private' });
    const onSearchFilterChange = sinon.stub();

    compoundSearchFilters = mount(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={onSearchFilterChange}
      />
    );

    const hazardFilter = compoundSearchFilters.find(SearchFilter).at(3);

    expect(hazardFilter.find('h4 > span').text()).to.equal('Hazard');
    expect(hazardFilter.find('.search-filter-wrapper__preview').text()).to.equal('1 item selected');

    hazardFilter.find('SearchFilterWrapper').find('li > div > div').at(0).simulate('click');
    hazardFilter.find(Checkbox).find('input').at(3).simulate('change', { detail: { value: true } });

    const args = onSearchFilterChange.getCall(0).args[0].toJS();
    expect(hazardFilter.find('p.tx-checkbox__label').length).to.equal(9);
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(args).to.deep.equal({ searchHazard: ['flammable', 'strong_acid'], searchSource: 'private' });
  });

  it('should have source filter as optional', () => {
    compoundSearchFilters = enzyme.mount(
      <CompoundSearchFilters
        searchOptions={Imm.Map({})}
        showSource
      />
    );

    expect(compoundSearchFilters.find(SearchFilter).at(2).find('h4 > span').text()).to.equal('Source');
  });

  it('should have organization filter', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);

    const opts = Imm.Map({ organization_id: 'org13' });
    const actions = {
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    );

    expect(compoundSearchFilters.find(OrganizationTypeAhead).length).to.equal(1);
  });

  it('should not have organization filter if disabled props is passed', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);

    const opts = Imm.Map({ organization_id: 'org13' });
    const actions = {
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
        disableOrgFilter
      />
    );

    expect(compoundSearchFilters.find(OrganizationTypeAhead).length).to.equal(0);
  });

  // Operator Context for Custom Properties
  it('should have CustomProperties when an organization is selected', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);

    const opts = Imm.Map({ organization_id: 'org13' });
    const actions = {
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    );

    expect(compoundSearchFilters.find(OrganizationTypeAhead).length).to.equal(1);
    expect(compoundSearchFilters.find(OrganizationTypeAhead).props().organizationSelected).to.equal('org13');
    expect(compoundSearchFilters.find('SearchFilterCustomProperties').length).to.equal(1);
  });

  it('should not have CustomProperties when an organization is not selected', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);

    const opts = Imm.Map({ });
    const actions = {
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    );
    expect(compoundSearchFilters.find(OrganizationTypeAhead).length).to.equal(1);
    expect(compoundSearchFilters.find(OrganizationTypeAhead).props().organizationSelected).to.be.undefined;
    expect(compoundSearchFilters.find('SearchFilterCustomProperties').length).to.equal(0);
  });

  // User with no lab privileges, Custom Properties filter
  it('should have CustomProperties when an organization is selected', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(false);

    const opts = Imm.Map({});
    const actions = {
      onSearchFilterChange: sinon.stub()
    };

    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={opts}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    );

    expect(compoundSearchFilters.find(OrganizationTypeAhead).length).to.equal(0);
    expect(compoundSearchFilters.find('SearchFilterCustomProperties').length).to.equal(1);
  });

  it('should display previews for numeric range filters', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchWeight: { min: 1, max: 2 },
          searchTPSA: { min: 0, max: 2 },
          searchCLOGP: { min: undefined, max: undefined },
        })}
        onSearchFilterChange={() => {}}
      />
    );

    expect(compoundSearchFilters.find('SearchRangeFilter').at(0).props().previewText).to.eql('1-2');
    expect(compoundSearchFilters.find('SearchRangeFilter').at(1).props().previewText).to.eql('0-2');
    expect(compoundSearchFilters.find('SearchRangeFilter').at(2).props().previewText).to.eql('Any');
  });

  it('should display preview text for properties empty state', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {}
        })}
        onSearchFilterChange={() => {}}
      />
    );
    expect(compoundSearchFilters.find('SearchFilterWrapper').at(3).props().previewText).to.eql('Any property');
  });

  it('should display properties preview text', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map()}
        onSearchFilterChange={() => {}}
      />
    );
    expect(compoundSearchFilters.find('SearchFilterWrapper').at(3).props().previewText).to.eql('Any property');
  });

  it('should display preview text for multiple properties selected', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar',
            fizz: 'buzz',
            key: 'value'
          }
        })}
        onSearchFilterChange={() => {}}
      />
    );
    expect(compoundSearchFilters.find('SearchFilterWrapper').at(3).props().title).to.eql('Custom properties');
    expect(compoundSearchFilters.find('SearchFilterWrapper').at(3).props().previewText).to.eql('3 properties selected');
  });

  it('should display preview text for single property selected', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar'
          }
        })}
        onSearchFilterChange={() => {}}
      />
    );
    expect(compoundSearchFilters.find('SearchFilterWrapper').at(3).props().previewText).to.eql('1 property selected');
  });

  it('should have SearchField to search the compounds', () => {
    compoundSearchFilters = shallow(
      <CompoundSearchFilters
        searchOptions={Imm.Map({
          searchProperties: {
            foo: 'bar'
          }
        })}
        onSearchFilterChange={() => {}}
      />
    );
    const searchFilterWrapper = compoundSearchFilters.find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
  });
});
