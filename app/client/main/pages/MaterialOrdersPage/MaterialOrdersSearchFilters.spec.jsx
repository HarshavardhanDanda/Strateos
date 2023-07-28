import React from 'react';
import sinon from 'sinon';
import Imm from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { SearchFilter } from '@transcriptic/amino';
import LabAPI from 'main/api/LabAPI';
import VendorActions from 'main/actions/VendorActions';
import MaterialOrdersSearchFilters from './MaterialOrdersSearchFilters';

describe('MaterialOrdersSearchFilters', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const searchOptions = Imm.Map({
    searchLab: 'all',
    searchType: 'all',
    searchVendor: 'all',
    activeStatus: []
  });

  const vendors = {
    results: [
      {
        id: '1',
        name: 'CisBio'
      },
      {
        id: '2',
        name: 'CSL'
      }
    ]
  };

  const labs = {
    data: [
      {
        id: '1',
        attributes: {
          name: 'Menlo Park'
        }
      },
      {
        id: '2',
        attributes: {
          name: 'SanDiego'
        }
      }
    ]
  };

  const stubLabFeatures = () => {
    sandbox.stub(LabAPI, 'loadAllLabWithFeature').returns({
      done: (cb) => {
        return { data: cb(labs), fail: () => ({}) };
      }
    });
  };

  const stubVendors = () => {
    sandbox.stub(VendorActions, 'getVendorsList').returns({
      done: (cb) => {
        return { data: cb(vendors), fail: () => ({}) };
      }
    });
  };

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have labs filter ', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(3);
    expect(searchFilters.at(0).props()).to.deep.include({
      title: 'Lab',
      currentSelection: 'all',
      options: [
        {
          display: 'All Labs',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'Menlo Park',
          queryTerm: '1'
        },
        {
          display: 'SanDiego',
          queryTerm: '2'
        }
      ]
    });
  });

  it('should have Type filter ', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(3);
    expect(searchFilters.at(1).props()).to.deep.include({
      title: 'Type',
      currentSelection: 'all',
      options: [{ queryTerm: 'all', display: 'All', allOption: true },
        { queryTerm: 'group', display: 'Group' },
        { queryTerm: 'individual', display: 'Individual' }]
    });
  });

  it('should have Vendor filter', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();
    stubVendors();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(4);
    expect(searchFilters.at(2).props()).to.deep.include({
      title: 'Vendors',
      currentSelection: 'all',
      options: [
        {
          display: 'All vendors',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'CisBio',
          queryTerm: '1'
        },
        {
          display: 'CSL',
          queryTerm: '2'
        }
      ]
    });
  });

  it('should have Status filter ', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    const searchFilters = wrapper.find(SearchFilter);
    expect(searchFilters.length).to.equal(3);
    expect(searchFilters.at(2).props()).to.deep.include({
      title: 'Status',
      currentSelection: [],
      options: [
        { queryTerm: 'pending', display: 'Pending' },
        { queryTerm: 'purchased', display: 'Purchased' },
        { queryTerm: 'shipped', display: 'Shipped' },
        { queryTerm: 'arrived', display: 'Arrived' },
        { queryTerm: 'checkedin', display: 'Checked-in' }]
    });
  });

  it('should trigger multiple status filters', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };
    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    wrapper.instance().onSelectOption('activeStatus')(['pending', 'purchased', 'shipped']);
    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    expect(actions.onSearchFilterChange.args[0][0].get('activeStatus')).to.have.same.members(['pending', 'purchased', 'shipped']);
  });

  it('should have selectable filters', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();

    wrapper.instance().onSelectOption('searchLab')('2');

    expect(actions.onSearchFilterChange.calledOnce).to.be.true;
    expect(actions.onSearchFilterChange.args[0][0].get('searchLab')).to.equal('2');
  });

  it('should have SearchField to search orders', () => {
    const actions = {
      onSearchFilterChange: sandbox.stub()
    };

    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={options => actions.onSearchFilterChange(options)}
      />
    ).dive();
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    const searchField = searchFilterWrapper.find('SearchField').dive();

    expect(searchFilterWrapper.props().title).to.equal('Search');
    expect(searchFilterWrapper.find('SearchField').length).to.be.equal(1);
    expect(searchField.find('Select').length).to.be.equal(1);
  });

  it('should have searchField options of name and order id', () => {
    const onSearchFilterChange = sandbox.stub();
    stubLabFeatures();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    ).dive();
    const searchFilterWrapper = wrapper.dive().find('SearchFilterWrapper').at(0);
    expect(searchFilterWrapper.find('SearchField').props().categories.length).to.equal(2);
    expect(searchFilterWrapper.find('SearchField').props().categories[0].value).to.equal('name');
    expect(searchFilterWrapper.find('SearchField').props().categories[1].value).to.equal('vendor_order_id');
  });

  it('should call onSearchFilterChange when change category in search field', () => {
    const onSearchFilterChange = sandbox.stub();

    wrapper = shallow(
      <MaterialOrdersSearchFilters
        searchOptions={searchOptions}
        onSearchFilterChange={onSearchFilterChange}
      />
    ).dive();
    const searchFilterWrapper = wrapper.find('SearchFilterWrapper').at(0);
    searchFilterWrapper.find('SearchField').props().onCategoryChange({}, { value: 'vendor_order_id' });
    expect(onSearchFilterChange.calledOnce).to.be.true;
    expect(onSearchFilterChange.lastCall.args[0].get('searchField')).to.equal('vendor_order_id');
  });
});
