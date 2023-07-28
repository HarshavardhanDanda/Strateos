import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Imm from 'immutable';
import { Spinner, ZeroState, SearchField, Button } from '@transcriptic/amino';

import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import Urls from 'main/util/urls';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import MaterialStore from 'main/stores/MaterialStore';
import { MaterialsPage, props as StateFromStores } from './MaterialsPage';
import MaterialsSearchResults from './MaterialsSearchResults';
import MaterialsSearchFilter from './MaterialsSearchFilters';

describe('MaterialsPage', () => {
  const sandbox = sinon.createSandbox();
  let materialsPage;
  const onSearchFilterChange = sandbox.stub();
  const defaultRequiredProps = {
    history: {},
    zeroStateProps: {},
    zeroStateSearchOptions: {},
    hasResults: false,
    isSearching: false,
    selected: [],
    resultUrl: () => {},
    hasPageLayout: false,
    onSearchFailed: () => {},
    onSearchInputChange: () => {},
    onSearchFilterChange,
    onSearchPageChange: () => {},
    onSortChange: () => {}
  };

  beforeEach(() => {
    Urls.use('strateos');
  });

  afterEach(() => {
    sandbox.restore();
    if (materialsPage) {
      materialsPage.unmount();
    }
  });

  it('should have a spinner', () => {
    const searchOptions = Imm.fromJS({});
    const search = Imm.fromJS({ results: [] });
    const actions = {
      doSearch: () => { }
    };
    materialsPage = shallow(
      <MaterialsPage
        {...defaultRequiredProps}
        searchOptions={searchOptions}
        search={search}
        actions={actions}
      />
    ).find('PageWithSearchAndList').dive();
    expect(materialsPage.find(Spinner)).to.have.lengthOf(1);
  });

  it('should have a zero state', () => {
    const searchOptions = Imm.fromJS({});
    const search = Imm.fromJS({ results: [] });
    const selected = [];
    const actions = {
      doSearch: (opts, onFail, onSuccess) => {
        onSuccess();
      }
    };
    materialsPage = mount(
      <MaterialsPage
        {...defaultRequiredProps}
        hasResults={false}
        searchOptions={searchOptions}
        search={search}
        selected={selected}
        actions={actions}
        zeroStateProps={{
          title: 'Title',
          subTitle: 'Subtitle',
          button: (
            <Button>Create material</Button>
          )
        }}
      />
    );

    simulateAPICallComplete(materialsPage);

    expect(materialsPage.find(Spinner)).to.have.lengthOf(0);
    expect(materialsPage.find(ZeroState)).to.have.lengthOf(1);
    expect(materialsPage.find(ZeroState).prop('title')).to.equal('Title');
    expect(materialsPage.find(ZeroState).prop('subTitle')).to.equal('Subtitle');
  });

  it('should have a zero state without create material button', () => {
    const searchOptions = Imm.fromJS({});
    const search = Imm.fromJS({ results: [] });
    const selected = [];
    const actions = {
      doSearch: (opts, onFail, onSuccess) => {
        onSuccess();
      }
    };
    materialsPage = mount(
      <MaterialsPage
        {...defaultRequiredProps}
        hasResults={false}
        searchOptions={searchOptions}
        search={search}
        selected={selected}
        actions={actions}
        zeroStateProps={{
          title: 'No materials were found.'
        }}
      />
    );

    simulateAPICallComplete(materialsPage);

    expect(materialsPage.find(Spinner)).to.have.lengthOf(0);
    expect(materialsPage.find(ZeroState)).to.have.lengthOf(1);
    expect(materialsPage.find(ZeroState).prop('title')).to.equal('No materials were found.');
    expect(materialsPage.find(ZeroState).prop('button')).to.be.undefined;
  });

  it('should call onViewDetailsClicked when a row is clicked', () => {
    const mockRowClick = sandbox.stub();
    const searchOptions = Imm.Map();
    const search = Imm.fromJS({
      results: []
    });
    const actions = {
      doSearch: () => { }
    };

    materialsPage = mount(
      <MaterialsPage
        {...defaultRequiredProps}
        searchOptions={searchOptions}
        search={search}
        selected={[]}
        actions={actions}
        hasResults
        history={history}
        onViewDetailsClicked={mockRowClick}
      />,
    );
    simulateAPICallComplete(materialsPage);
    materialsPage.find(MaterialsSearchResults).props().onRowClick({ id: 'foobar' });

    expect(mockRowClick.calledWith({ id: 'foobar' })).to.be.true;
  });

  it('should have search field and filters', () => {
    onSearchFilterChange.resetHistory();
    const searchOptions = Imm.Map();
    const search = Imm.fromJS({
      results: []
    });
    const actions = {
      doSearch: () => { }
    };

    materialsPage = mount(
      <MaterialsPage
        {...defaultRequiredProps}
        searchOptions={searchOptions}
        search={search}
        actions={actions}
        hasResults
        selected={[]}
      />
    );

    simulateAPICallComplete(materialsPage);
    expect(materialsPage.find(MaterialsSearchResults)).to.have.lengthOf(1);
    const materialsSearchFilter = materialsPage.find(SearchResultsSidebar).find(MaterialsSearchFilter);
    expect(materialsSearchFilter).to.have.lengthOf(1);
    expect(materialsSearchFilter.find(SearchField)).to.have.lengthOf(1);
    expect(materialsPage.find(MaterialsSearchResults)).to.have.lengthOf(1);
    materialsSearchFilter.props().onSearchFilterReset();
    expect(onSearchFilterChange.calledOnce).to.be.true;
  });

  it('should show search results', () => {
    const searchOptions = Imm.Map();
    const search = Imm.fromJS({
      results: [
        {
          id: 'id1',
          name: 'Material1'
        },
        {
          id: 'id2',
          name: 'Material2'
        }
      ]
    });
    const actions = {
      doSearch: () => { }
    };

    materialsPage = mount(
      <MaterialsPage
        {...defaultRequiredProps}
        searchOptions={searchOptions}
        search={search}
        actions={actions}
        hasResults
        selected={[]}
      />
    );
    simulateAPICallComplete(materialsPage);
    const list = materialsPage.find(MaterialsSearchResults);

    expect(list).to.have.lengthOf(1);
    expect(list.props().data.get(0).get('name')).to.equal('Material1');
    expect(list.props().data.get(1).get('name')).to.equal('Material2');
  });

  it('should get correct state from stores', () => {
    materialsPage = null;
    const materialStore = sandbox.stub(MaterialStore, 'getAll').returns(Imm.fromJS(
      [{ id: 'mat12345', name: 'mat 1' }, { id: 'mat67890', name: 'mat 2' }]));
    let props = StateFromStores();
    expect(props.hasResults).to.be.true;
    materialStore.restore();
    sandbox.stub(MaterialStore, 'getAll').returns(Imm.fromJS([]));
    props = StateFromStores();
    expect(props.hasResults).to.be.false;
  });
});
