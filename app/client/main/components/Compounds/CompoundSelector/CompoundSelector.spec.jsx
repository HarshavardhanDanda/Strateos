import React from 'react';
import sinon from 'sinon';
import _ from 'lodash';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';

import { Button } from '@transcriptic/amino';
import CompoundSelector from 'main/components/Compounds/CompoundSelector';
import SessionStore from 'main/stores/SessionStore';
import { CompoundSelectorModalState, CompoundSelectorPublicModalState, } from 'main/pages/CompoundsPage/CompoundsState';
import { CompoundSelectorModalActions, CompoundSelectorPublicModalActions } from 'main/pages/CompoundsPage/CompoundsActions';
import { getDefaultSearchPerPage } from 'main/util/List';

describe('CompoundSelector', () => {

  const sandbox = sinon.createSandbox();
  const modalProps = {
    onStructureSearchClick: () => {},
    onRowClick: () => {},
    onUseCompound: () => {},
    onSelectRow: () => {},
    isSingleSelect: true,
    visibleColumns: ['name', 'clogp'],
  };

  const compounds = Immutable.List([
    Immutable.Map({
      id: 'cp1',
      name: 'cust1',
      clogp: '1.2543',
      molecular_weight: 350.4,
      formula: 'C16H18N2O5S',
      smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
      tpsa: '108.05',
      created_by: 'cc'
    }),
    Immutable.Map({
      id: 'cp2',
      name: 'cust2',
      clogp: '1.256',
      molecular_weight: 351.4,
      formula: 'C16H18N2O5S',
      smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
      tpsa: '108.05',
      created_by: 'cc'
    })
  ]);

  const search = Immutable.fromJS({
    __search_completed_at: 1670998133936,
    num_pages: 1435,
    page: 1,
    per_page: getDefaultSearchPerPage(),
    query: '',
    results: compounds
  });

  let wrapper;
  let onSearchFilterChange;
  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should allow register compound by default', () => {
    wrapper = mount(<CompoundSelector {...modalProps} />);
    const instance = wrapper.find('CompoundSelector').instance();
    const searchResults = shallow(instance.searchResults(compounds));
    expect(searchResults.find(Button).dive().find('span').text()).to.equal('Register New Compound');
    searchResults.unmount();
  });

  it('should not allow register compound when allowCompoundRegistration is false', () => {
    wrapper = mount(<CompoundSelector {...modalProps} allowCompoundRegistration={false} />);
    const instance = wrapper.find('CompoundSelector').instance();
    const searchResults = shallow(instance.searchResults(compounds));
    expect(searchResults.find('Button')).to.have.lengthOf(0);
    searchResults.unmount();
  });

  it('should not have register compound action in zeroStateProp when admin', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    wrapper = shallow(<CompoundSelector {...modalProps} allowCompoundRegistration={false} showSource={false} />);
    expect(_.size(wrapper.find('CompoundSelector').prop('zeroStateProps'))).to.be.equal(2);
    expect(wrapper.find('CompoundSelector').prop('zeroStateProps')).to.deep.equal({ title: 'No compounds match your search terms.', button: null });
  });

  it('should have register compound action in zeroStateProp when smile search is empty', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    wrapper = shallow(<CompoundSelector {...modalProps} allowCompoundRegistration showSource />);
    expect(_.size(wrapper.find('CompoundSelector').prop('zeroStateProps'))).to.be.equal(2);
    expect(wrapper.find('CompoundSelector').prop('zeroStateProps').title).to.be.equal('No compounds match your search terms.');
    expect(wrapper.find('CompoundSelector').prop('zeroStateProps').button).to.be.not.null;
  });

  it('selected columns should persist after applying a filter', () => {
    wrapper = mount(<CompoundSelector
      {...modalProps}
      onSearchFilterChange={() => {}}
    />);
    expect(wrapper.props().visibleColumns.length).to.be.equal(2);
    wrapper.setProps({ visibleColumns: ['name', 'clogp', 'tspa'] });
    expect(wrapper.props().visibleColumns.length).to.be.equal(3);
    wrapper.find('CompoundSelector').instance().onSearchFilterChange(Immutable.Map({
      searchWeight: { min: 1, max: 2 },
    }));
    wrapper.update();

    expect(wrapper.props().visibleColumns.length).to.be.equal(3);
  });

  it('should trigger onRegisterClick callback when register compound action button is clicked', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(false);
    const onRegisterClick = sinon.spy();
    wrapper = mount(<CompoundSelector {...modalProps} allowCompoundRegistration showSource onRegisterClick={onRegisterClick} />);
    const button = wrapper.find('CompoundSelector').prop('zeroStateProps').button;
    button.props.onClick();
    expect(onRegisterClick.calledOnce).to.be.true;
  });

  it('should call handleColumnChange', () => {
    const handleColumnChangeSpy = sandbox.spy();
    wrapper = mount(<CompoundSelector
      {...modalProps}
      handleColumnChange={handleColumnChangeSpy}
    />);
    const instance = wrapper.find('CompoundSelector').instance();
    instance.onColumnSelectionChange('name');
    expect(handleColumnChangeSpy.called).to.be.true;
  });

  it('should remove selection if not present in searched results post search', () => {
    const updateStateSpy = sandbox.spy();
    wrapper = mount(<CompoundSelector
      {...modalProps}
      selected={['cp3']}
      actions={{ updateState: updateStateSpy }}
    />);
    wrapper.find('CompoundSelector').instance().onSearchSucceed({ data: compounds.toJS() });
    expect(updateStateSpy.called).to.be.true;
    expect(updateStateSpy.calledWith({ selected: [] })).to.be.true;
  });

  it('should keep selection present in searched results post search', () => {
    const updateStateSpy = sandbox.spy();
    wrapper = mount(<CompoundSelector
      {...modalProps}
      selected={['cp1', 'cp3']}
      actions={{ updateState: updateStateSpy }}
    />);
    wrapper.find('CompoundSelector').instance().onSearchSucceed({ data: compounds.toJS() });
    expect(updateStateSpy.called).to.be.true;
    expect(updateStateSpy.calledWith({ selected: ['cp1'] })).to.be.true;
  });

  it('should keep selection even if present in searched results post search when persistSearchResultSelection prop is passed as false', () => {
    const updateStateSpy = sandbox.spy();
    wrapper = mount(<CompoundSelector
      persistSearchResultSelection={false}
      {...modalProps}
      selected={['cp1', 'cp3']}
      actions={{ updateState: updateStateSpy }}
    />);
    wrapper.find('CompoundSelector').instance().onSearchSucceed({ data: compounds.toJS() });
    expect(updateStateSpy.calledOnce).to.be.true;
    expect(updateStateSpy.calledWith({ selected: ['cp1', 'cp3'] })).to.be.true;
  });

  describe('Search source', () => {
    const mountWrapper = () => {
      onSearchFilterChange = sinon.spy();
      wrapper = mount(<CompoundSelector
        {...modalProps}
        onSearchFilterChange={onSearchFilterChange}
        showSource
      />);
    };

    it('should call onSearchFilterChange with updated source when new source is public', () => {
      mountWrapper();

      wrapper.find('CompoundSelector').props().onSearchFilterChange(Immutable.Map({
        searchSource: 'public',
      }));

      expect(onSearchFilterChange.args[0][0].get('searchSource')).to.equal('public');
    });

    it('should call onSearchFilterChange with updated source when new source is private', () => {
      mountWrapper();

      wrapper.find('CompoundSelector').props().onSearchFilterChange(Immutable.Map({
        searchSource: 'private',
      }));

      expect(onSearchFilterChange.args[0][0].get('searchSource')).to.equal('private');
    });

    it('should call onSearchFilterChange with updated source when new source is all', () => {
      mountWrapper();

      wrapper.find('CompoundSelector').props().onSearchFilterChange(Immutable.Map({
        searchSource: 'all',
      }));

      expect(onSearchFilterChange.args[0][0].get('searchSource')).to.equal('all');
    });

    it('should return only public compounds when source is private or all and the container is stock', () => {
      wrapper = shallow(<CompoundSelector
        {...modalProps}
        onSearchFilterChange={onSearchFilterChange}
        showSource
        searchByPublicCompounds
        hasResults
        isSearching
        search={search}
      />);
      const searchResults = wrapper.dive().dive().find('CompoundSearchResults');

      wrapper.find('CompoundSelector').props().onSearchFilterChange(Immutable.Map({
        searchSource: 'private',
      }));
      wrapper.update();

      expect(wrapper.find('CompoundSelector').props().searchOptions.get('searchSource')).to.equal('public');
      expect(searchResults.dive().find('List').dive().find('Table')
        .props().emptyMessage).to.eql('No records.');
    });

    it('should return public compounds when the container is stock and source is  all', () => {
      wrapper = mount(<CompoundSelector
        {...modalProps}
        onSearchFilterChange={onSearchFilterChange}
        showSource
        searchByPublicCompounds
        hasResults
        isSearching
        search={search}
      />);
      const instance = wrapper.find('CompoundSelector').instance();
      const searchResults = shallow(instance.searchResults(compounds));

      instance.onSearchFilterChange(Immutable.Map({
        searchSource: 'all',
      }));
      wrapper.update();

      expect(wrapper.find('CompoundSelector').props().searchOptions.get('searchSource')).to.equal('public');
      expect(searchResults.find('CompoundSearchResults').dive().find('List').props().data.size).to.equal(2);
      searchResults.unmount();
    });

    it('should call appropriate functions and state when we pass the prop searchByPublicCompounds', () => {
      const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
      const normalState = sandbox.spy(CompoundSelectorModalState, 'get');
      const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'searchOptions');
      const normalAction = sandbox.spy(CompoundSelectorModalActions, 'searchOptions');

      wrapper = shallow(<CompoundSelector {...modalProps} searchByPublicCompounds />);
      // When we connect to the store it will get called twice
      // initial state and once from the actions as we fetch searchOptions
      expect(publicState.calledTwice).to.be.true;
      expect(normalState.called).to.be.false;
      expect(publicAction.calledOnce).to.be.true;
      expect(normalAction.called).to.be.false;
    });

    it('should call appropriate functions and state when we do not pass the prop searchByPublicCompounds', () => {
      const publicState = sandbox.spy(CompoundSelectorPublicModalState, 'get');
      const normalState = sandbox.spy(CompoundSelectorModalState, 'get');
      const publicAction = sandbox.spy(CompoundSelectorPublicModalActions, 'searchOptions');
      const normalAction = sandbox.spy(CompoundSelectorModalActions, 'searchOptions');

      wrapper = shallow(<CompoundSelector {...modalProps} />);
      expect(publicState.called).to.be.false;
      // When we connect to the store it will get called twice
      // initial state and once from the actions as we fetch searchOptions
      expect(normalState.calledTwice).to.be.true;
      expect(publicAction.called).to.be.false;
      expect(normalAction.calledOnce).to.be.true;
    });
  });
});
