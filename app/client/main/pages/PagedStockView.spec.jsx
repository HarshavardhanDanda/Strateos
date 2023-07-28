import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import Urls from 'main/util/urls';
import { PagedStockView } from 'main/pages/PagedStockView';
import LocationStore from 'main/stores/LocationStore';
import ContainerActions from 'main/actions/ContainerActions';
import ProvisionSpecActions from 'main/actions/ProvisionSpecActions';
import { StockContainerSearchStore } from 'main/stores/search';

function transfers(mode) {
  const transfers = [{
    to: 'CalibrationPlate_2020-04-29',
    to_well_idx: 88,
    dest_type: '96-flat',
    from: 'ct1b4xx6stspe5',
    from_well_idx: 0
  },
  {
    to: 'CalibrationPlate_2020-04-29',
    to_well_idx: 89,
    dest_type: '96-flat',
    from: 'ct1b4xx6stspe5',
    from_well_idx: 0
  }];

  if (mode === 'mass') {
    transfers[0].mass = 100;
    transfers[1].mass = 100;
  } else {
    transfers[0].volume = 100;
    transfers[1].volume = 100;
  }
  return transfers;
}

function sampleData(mode) {
  return {
    provisionSpecs: Immutable.fromJS([
      {
        id: '14700',
        instruction_id: 'i1eczdt2ud45nf',
        transfers: transfers(mode),
        created_at: '2020-12-22T02:28:51.311-08:00',
        updated_at: '2020-12-22T02:28:51.311-08:00',
        resource_id: 'rs1b4xwqsnmx52'
      }
    ]),
    searchParams: {
      resource_id: 'rs1b4xwqsnmx52',
      instruction_id: 'i1eczdt2ud45nf'
    },
    loadStockAction: ContainerActions.loadStock,
    perPage: 12,
    searchStoreQuery: 'rs1b4xwqsnmx52',
    searchStore: StockContainerSearchStore,
    measurementMode: mode,
    highlightedContainerIds: (mode === 'mass') ? Immutable.Set(['ct1b4xx6stspe5']) : undefined,
    actions: [{
      title: 'title',
      action: () => {},
      disabled: false
    }]
  };
}
const propsMassMode = sampleData('mass');

const propsVolumeMode = sampleData('volume');

const search = Immutable.fromJS({
  results: [
    {
      barcode: '3004202102',
      container_type_id: 'vendor-tube',
      location_id: 'loc1av9j3kexxpn',
      created_at: '2018-01-18T15:39:40.832-08:00',
      aliquots: [
        {
          mass_mg: '1229106.6536',
          created_at: '2018-01-18T15:39:40.847-08:00',
          name: null,
          resource_id: 'rs1b4xwqsnmx52',
          container_id: 'ct1b4xx6stspe5',
          id: 'aq1b4xx6sub6vm',
          volume_ul: '1229106.6536'
        }
      ],
      location: {
        ancestors: [
          {
            id: 'loc196bcn7qj58g',
            parent_id: null,
            name: '4C BSL-2 Fridge ',
            position: null,
            human_path: '4C BSL-2 Fridge ',
            ancestor_blacklist: []
          }
        ],
        name: 'Top shelf',
        id: 'loc196bcrjw2wtv'
      },
      label: 'Milli-Q Water for laboratory use',
      updated_at: '2018-01-18T15:39:40.832-08:00',
      container_type: {
        name: 'Vendor tube',
        id: 'vendor-tube'
      },
      id: 'ct1b4xx6stspe5'
    }
  ],
  num_pages: 2,
  per_page: 5,
  page: 1,
  query: 'rs1b4xwqsnmx52',
  __search_completed_at: 1609165379635
});

const searchWithoutLocations = Immutable.fromJS({
  results: [
    {
      container_type_id: 'vendor-tube',
      label: 'Milli-Q Water for laboratory use',
      id: 'ct1b4xx6stspe5'
    }
  ]
});

describe('Paged Stock View Table', () => {
  const sandbox = sinon.createSandbox();
  let provisionSpecActionsStub;
  let table;

  beforeEach(() => {
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: '3A', id: 'loc2' }));
    provisionSpecActionsStub = sandbox.stub(ProvisionSpecActions, 'loadAllForResource').returns({
      done: (cb) => {
        cb();
      }
    });
  });

  afterEach(() => {
    if (table) table.unmount();
    sandbox.restore();
  });

  it('should display empty message if no stock', () => {
    const list = shallow(<PagedStockView {...propsMassMode} />).dive().find('List');
    expect(list.props().emptyMessage).to.equal('No stock containers');
  });

  it('should have table with 7 sortable header columns', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsMassMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    expect(table.find('SortableHeader').length).to.equal(7);
  });

  it('should send correct sort options to the search API when a column is sorted', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    const queryStockFn = sandbox.spy(PagedStockView.prototype, 'queryStock');
    table = shallow(<PagedStockView {...propsMassMode} />).dive().find('List').dive()
      .find('Table')
      .dive();

    table.find('SortableHeader').at(0).dive().find('div')
      .at(0)
      .simulate('click');

    expect(queryStockFn.calledWith(1, 12, 'barcode', 'asc')).to.be.true;

    table.find('SortableHeader').at(0).dive().find('div')
      .at(0)
      .simulate('click');

    expect(queryStockFn.calledWith(1, 12, 'barcode', 'desc')).to.be.true;
  });

  it('should show available and remaining quantity in mass units when measurement mode is mass', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsMassMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    expect(table.find('BodyCell').at(4).dive().find('td')
      .text()).to.equal('Milli-Q Water for laboratory use');
    expect(table.find('BodyCell').at(5).dive().find('td')
      .text()).to.equal('1228906.65 mg');
    expect(table.find('BodyCell').at(6).dive().find('td')
      .text()).to.equal('200 mg');
  });

  it('should show available and remaining quantity in volume units when measurement mode is volume', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsVolumeMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    expect(table.find('BodyCell').at(4).dive().find('td')
      .text()).to.equal('Milli-Q Water for laboratory use');
    expect(table.find('BodyCell').at(5).dive().find('td')
      .text()).to.equal('1228906.65 μL');
    expect(table.find('BodyCell').at(6).dive().find('td')
      .text()).to.equal('200 μL');
  });

  it('should contain Popover in the location column', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsVolumeMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    const row = table.find('BodyCell').at(9).dive().find('td');
    expect(row.find('Popover').length).to.equal(1);
    expect(row.find('a').text()).to.equal('Top shelf');
    expect(row.find('a').props().href).to.equal(Urls.location('loc196bcrjw2wtv'));
  });

  it('should display location column for empty locations', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(searchWithoutLocations);
    table = shallow(<PagedStockView {...propsVolumeMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    const row = table.find('BodyCell').at(9).dive().find('td');
    expect(row.text()).to.equal('-');
  });

  it('should have a link to container page in users console in the id column', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsVolumeMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    const row = table.find('BodyCell').at(1).dive().find('td');
    expect(row.find('a').props().href).to.equal(Urls.container('ct1b4xx6stspe5'));
  });

  it('should not have yellow highlight if id is not in highlightedContainerIds', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsVolumeMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    const row = table.find('BodyCell').at(1).dive().find('td');
    expect(row.find('a').props().className).to.equal('');
  });

  it('should have yellow highlight if id is in highlightedContainerIds', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    table = shallow(<PagedStockView {...propsMassMode} />).dive().find('List').dive()
      .find('Table')
      .dive();
    const row = table.find('BodyCell').at(1).dive().find('td');
    expect(row.find('a').props().className).to.equal('highlight yellow');
  });

  it('should fetch provision specs for resource when page is refreshed', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    const props = {
      ...propsMassMode,
      refresh: false,
      onRefresh: () => wrapper.setProps({ ...propsMassMode, refresh: false }) };
    let wrapper = shallow(<PagedStockView {...props} />);
    expect(provisionSpecActionsStub.calledOnce).to.be.true;

    wrapper.setProps({ ...props, refresh: true });
    expect(provisionSpecActionsStub.calledTwice).to.be.true;
  });

  it('should not fetch provision specs for resource when page is not refreshed', () => {
    sandbox.stub(PagedStockView.prototype, 'getSearch').returns(search);
    const props = {
      ...propsMassMode,
      refresh: false,
      onRefresh: () => wrapper.setProps({ ...propsMassMode, refresh: false }) };
    let wrapper = shallow(<PagedStockView {...props} />);
    expect(provisionSpecActionsStub.calledOnce).to.be.true;

    wrapper.setProps({ ...props, refresh: false });
    expect(provisionSpecActionsStub.calledOnce).to.be.true;
  });

  it('should display row count as 12', () => {
    const list = shallow(<PagedStockView {...propsMassMode} />).dive().find('List');
    expect(list.prop('pageSize')).equals(12);
  });

  it('should always display pageSizeOptions dropdown irrespective of the row count', () => {
    const wrapper = shallow(<PagedStockView {...propsMassMode} />);
    const list = wrapper.dive().find('List');
    expect(list.props().showPagination).to.be.true;
    wrapper.instance().setState({
      perPage: 24
    });
    wrapper.update();
    expect(list.props().showPagination).to.be.true;
  });
});
