import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Imm from 'immutable';
import { Spinner, SearchField, ZeroState } from '@transcriptic/amino';

import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import ModalActions from 'main/actions/ModalActions';
import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { simulateAPICallComplete } from 'main/components/PageWithSearchAndList/PageWithSearchAndList.spec';
import MaterialOrderStore from 'main/stores/MaterialOrderStore';
import { MaterialOrdersPage, props as StateFromStores } from './MaterialOrdersPage';
import MaterialOrdersSearchResults from './MaterialOrdersSearchResults';
import MaterialOrdersSearchFilter from './MaterialOrdersSearchFilters';

const mountWrapper = (options = {}) => {
  const searchOptions = Imm.fromJS({ activeStatus: [''] });
  const search = Imm.fromJS({ results: [] });
  const actions = {
    doSearch: () => { },
    resetSelected: () => { }
  };
  const requiredFieldsDefault = {
    history: {},
    zeroStateSearchOptions: {},
    resultUrl: () => {},
    onSortChange: () => {},
    onSearchInputChange: () => {},
    onSearchFilterChange: () => {},
    onSearchPageChange: () => {},
    onSearchFailed: () => {},
    selected: [],
    isSearching: false,
    hasPageLayout: false,
    zeroStateProps: {},
    hasResults: true
  };
  return mount(
    <MaterialOrdersPage
      searchOptions={searchOptions}
      search={search}
      actions={actions}
      {...requiredFieldsDefault}
      {...options}
    />
  );
};

describe('OrdersPage', () => {
  const sandbox = sinon.createSandbox();
  let ordersPage;

  afterEach(() => {
    sandbox.restore();
    if (ordersPage) {
      ordersPage.unmount();
    }
  });

  it('should have a spinner', () => {
    ordersPage = mountWrapper({ hasResults: false, isSearching: true });
    expect(ordersPage.find('PageWithSearchAndList').find(Spinner).length).equal(1);
  });

  it('should have correct props as passed along', () => {
    ordersPage = mountWrapper({ zeroStateProps: {
      title: 'Title',
    },
    hasResults: true
    });
    expect(ordersPage.find('PageWithSearchAndList').props().zeroStateProps).to.eql({ title: 'Title' });
    expect(ordersPage.find('PageWithSearchAndList').props().isSearching).to.be.false;
    expect(ordersPage.find('PageWithSearchAndList').props().hasResults).to.be.true;
    expect(ordersPage.find('PageWithSearchAndList').props().hasPageLayout).to.be.false;
  });

  it('should have a zero state', () => {
    ordersPage = mountWrapper(
      { zeroStateProps: {
        title: 'Title'
      },
      hasResults: false
      }
    );

    simulateAPICallComplete(ordersPage);

    expect(ordersPage.find(Spinner)).to.have.lengthOf(0);
    expect(ordersPage.find(ZeroState)).to.have.lengthOf(1);
    expect(ordersPage.find(ZeroState).prop('title')).to.equal('Title');
  });

  it('should have search field and filters', () => {
    ordersPage = mountWrapper({ hasResults: true });
    simulateAPICallComplete(ordersPage);
    const materialOrdersPage = ordersPage.find('PageWithSearchAndList').find(SearchResultsSidebar)
      .find(MaterialOrdersSearchFilter);
    expect(ordersPage.find('PageWithSearchAndList').find(SearchResultsSidebar)
      .find(MaterialOrdersSearchFilter)).to.have.lengthOf(1);
    expect(materialOrdersPage.find(SearchField)).to.have.lengthOf(1);
    expect(ordersPage.find('PageWithSearchAndList').find(MaterialOrdersSearchResults)).to.have.lengthOf(1);
  });

  it('should show search results', () => {
    ordersPage = mountWrapper({
      search: Imm.fromJS({
        results: [
          {
            id: 'id1',
            material: {
              name: 'Material1'
            }
          },
          {
            id: 'id2',
            material: {
              name: 'Material2'
            }
          }
        ]
      }),
      hasResults: true
    });
    simulateAPICallComplete(ordersPage);
    const list = ordersPage.find('PageWithSearchAndList').find(MaterialOrdersSearchResults);
    expect(list.props().data.get(0).getIn(['material', 'name'])).to.equal('Material1');
    expect(list.props().data.get(1).getIn(['material', 'name'])).to.equal('Material2');
  });

  it('should open status picker modal', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    ordersPage = mountWrapper({ hasResults: true });
    simulateAPICallComplete(ordersPage);
    ordersPage.find('PageWithSearchAndList').find('MaterialOrdersSearchResults').prop('onStatusClick')();

    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('MATERIAL_ORDER_STATUS_PICKER');
  });

  it('should open material order assign order id modal', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    ordersPage = mountWrapper({ hasResults: true });
    simulateAPICallComplete(ordersPage);
    ordersPage.find('PageWithSearchAndList').find('MaterialOrdersSearchResults').prop('onAssignOrderIdClick')();

    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('MATERIAL_ORDER_ASSIGN_ORDER_ID_MODAL');
  });

  it('should bulk update order status for selection', () => {
    const updateManySpy = sandbox.spy(MaterialOrderActions, 'updateMany');
    ordersPage = mountWrapper({ hasResults: true, selected: ['id1', 'id2'] });
    simulateAPICallComplete(ordersPage);

    expect(ordersPage.find('MaterialOrderStatusPicker').prop('selected')).to.deep.equal(['id1', 'id2']);

    ordersPage.find('MaterialOrderStatusPicker').prop('onSelected')('PURCHASED');

    expect(updateManySpy.calledOnce).to.be.true;
    expect(updateManySpy.args[0]).to.deep.equal([['id1', 'id2'], { state: 'PURCHASED' }]);
  });

  it('should redirect to details page when clicked on row', () => {
    const mockRowClick = sandbox.stub();
    ordersPage = mountWrapper({
      hasResults: true,
      onViewDetailsClicked: mockRowClick
    });
    simulateAPICallComplete(ordersPage);
    const materialOrdersSearchResults = ordersPage.find('PageWithSearchAndList').find('MaterialOrdersSearchResults');
    materialOrdersSearchResults.props().onRowClick({ id: 'test_id' });
    expect(mockRowClick.calledOnce).to.be.true;
    expect(mockRowClick.calledWith({ id: 'test_id' }));
  });

  it('should get correct state from stores', () => {
    ordersPage = null;
    const materialStore = sandbox.stub(MaterialOrderStore, 'getAll').returns(Imm.fromJS(
      [{ id: 'matOrder1456', name: 'matOrder 1' }, { id: 'matOrder3653', name: 'matOrder 2' }]));
    let props = StateFromStores();
    expect(props.hasResults).to.be.true;
    materialStore.restore();
    sandbox.stub(MaterialOrderStore, 'getAll').returns(Imm.fromJS([]));
    props = StateFromStores();
    expect(props.hasResults).to.be.false;
  });
});
