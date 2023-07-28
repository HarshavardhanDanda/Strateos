import React from 'react';
import Immutable from 'immutable';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import { List, Button, Molecule, Column, Tooltip } from '@transcriptic/amino';
import Papa from 'papaparse';

import Urls from 'main/util/urls';
import NotificationActions from 'main/actions/NotificationActions';
import KitOrderActions from 'main/actions/KitOrderActions';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import SessionStore from 'main/stores/SessionStore';
import MaterialOrdersSearchResults from './MaterialOrdersSearchResults';

describe('MaterialOrdersSearchResults', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13', subdomain: 'transcriptic' }));
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });
  const mockPush = sandbox.stub();
  const mockRowClick = sandbox.stub();

  const data = Immutable.fromJS([{
    id: 'id',
    vendor_order_id: null,
    orderable_material: Immutable.Map({
      sku: 'SKU123',
      material: Immutable.Map({
        name: 'PCR kit',
        material_type: 'group',
        vendor: Immutable.Map({
          name: 'Bobs chemicals',
          id: 'vendor1'
        }),
        supplier: Immutable.Map({
          id: 'sup123',
          name: 'Mock Supplier'
        }),
        material_components: Immutable.fromJS([
          {
            resource: {
              id: 'rs1gy8tng539pa3',
              name: 'Ethanol',
              kind: 'Solvent'
            }
          }
        ])
      })
    }),
    tracking_code: '1234',
    lab: Immutable.Map({
      name: 'location'
    }),
    user: Immutable.Map({
      first_name: 'Francesca',
      id: 'u17pfuad5pywf',
      last_name: 'Ceroni',
      name: 'Francesca Ceroni',
      profile_img_url: null
    }),
    state: 'ARRIVED',
    created_at: '2020-10-09T03:21:58.628-07:00'
  }, {
    id: 'id2',
    vendor_order_id: 'external_order_id',
    orderable_material: Immutable.Map({
      sku: 'SKU456',
      material: Immutable.Map({
        name: 'Some other kit',
        material_type: 'group',
        vendor: Immutable.Map({
          name: 'Johns chemicals',
          id: 'vendor2'
        }),
        material_components: Immutable.fromJS([
          {
            resource: {
              id: 'rs1gy8tng539pa3',
              name: 'Ethanol',
              kind: 'Solvent'
            }
          }
        ])
      })
    }),
    lab: Immutable.Map({
      name: 'location2'
    }),
    user: Immutable.Map({
      first_name: 'Francesca',
      id: 'u17pfuad5pywf',
      last_name: 'Ceroni',
      name: 'Francesca Ceroni',
      profile_img_url: null
    }),
    count: 5,
    state: 'PENDING',
    created_at: '2020-10-09T03:21:58.628-05:00'
  }, {
    id: 'id3',
    vendor_order_id: 'external_order_id',
    orderable_material: Immutable.Map({
      sku: 'SKU123',
      material: Immutable.Map({
        name: 'Benzyl amine',
        material_type: 'individual',
        vendor: Immutable.Map({
          name: 'Bobs chemicals',
          id: 'vendor1'
        }),
        supplier: Immutable.Map({
          id: 'sup123',
          name: 'Mock Supplier'
        }),
        material_components: Immutable.fromJS([
          {
            resource: {
              id: 'rs1fztntgqw4j7h',
              name: 'benzylamine',
              kind: 'ChemicalStructure',
              compound: {
                id: 'WGQKYBSKWIADBV-UHFFFAOYSA-N',
                molecular_weight: '107.16',
                smiles: 'NCc1ccccc1'
              }
            }
          }
        ])
      })
    }),
    tracking_code: '1234',
    lab: Immutable.Map({
      name: 'location'
    }),
    user: Immutable.Map({
      first_name: 'Francesca',
      id: 'u17pfuad5pywf',
      last_name: 'Ceroni',
      name: 'Francesca Ceroni',
      profile_img_url: null
    }),
    state: 'ARRIVED',
    created_at: '2020-10-09T03:21:58.628-07:00'
  }, {
    id: 'id49994',
    vendor_order_id: 'external_order_id_2',
    orderable_material: Immutable.Map({
      material: Immutable.Map({
        material_type: 'individual',
        vendor: Immutable.Map({
          name: 'Oasis chemicals',
          id: 'vendor56'
        })
      })
    }),
    tracking_code: '45678',
    lab: Immutable.Map({
      name: 'location'
    }),
    user: Immutable.Map({
      first_name: 'Isbella',
      id: 'u58pfuad5kikd',
      last_name: 'Clementi',
      name: 'Isbella Clementi',
      profile_img_url: null
    }),
    state: 'CHECKEDIN',
    created_at: '2020-10-09T03:21:58.628-07:00'
  }
  ]);

  const props = {
    data,
    searchOptions: Immutable.Map({}),
    pageSize: 12,
    page: 1,
    numPages: 5,
    isSearching: false,
    selected: [],
    onSearchPageChange: () => { },
    onSelectRow: () => { },
    onSortChange: () => { },
    onSearchFilterChange: () => { },
    load: () => { },
    onRowClick: mockRowClick,
    onAssignOrderIdClick: () => {},
    history: { push: mockPush }
  };

  it('should have 10 visible columns out of total 11 columns when type is not individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} searchOptions={Immutable.Map({ searchType: 'all' })} />);
    const list = wrapper.find(List);
    const header = list.find('thead').find('tr').find('th');

    expect(wrapper.find(List).length).to.equal(1);
    expect(wrapper.find(List).instance().props.children.length).to.equal(11);
    expect(header.at(1).text()).to.equal('name');
    expect(header.at(2).text()).to.equal('type');
    expect(header.at(3).text()).to.equal('Order ID');
    expect(header.at(4).text()).to.equal('tracking code');
    expect(header.at(5).text()).to.equal('vendor');
    expect(header.at(6).text()).to.equal('supplier');
    expect(header.at(7).text()).to.equal('lab');
    expect(header.at(8).text()).to.equal('date ordered');
    expect(header.at(9).text()).to.equal('status');
    expect(header.at(10).text()).to.equal('ordered by');
  });

  it('should have all 11 visible columns when type is not individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} searchOptions={Immutable.Map({ searchType: 'all' })} />);
    const list = wrapper.find(List);
    list.setState({
      visibleColumns: [...list.instance().state.visibleColumns, 'sku']
    });
    list.update();
    const header = wrapper.find(List).find('thead').find('tr').find('th');

    expect(wrapper.find(List).instance().props.children.length).to.equal(11);
    expect(header.at(1).text()).to.equal('name');
    expect(header.at(2).text()).to.equal('type');
    expect(header.at(3).text()).to.equal('sku');
    expect(header.at(4).text()).to.equal('Order ID');
    expect(header.at(5).text()).to.equal('tracking code');
    expect(header.at(6).text()).to.equal('vendor');
    expect(header.at(7).text()).to.equal('supplier');
    expect(header.at(8).text()).to.equal('lab');
    expect(header.at(9).text()).to.equal('date ordered');
    expect(header.at(10).text()).to.equal('status');
    expect(header.at(11).text()).to.equal('ordered by');
  });

  it('should have 11 visible columns out of total 12 columns when type is individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} searchOptions={Immutable.Map({ searchType: 'individual' })} />);
    const list = wrapper.find(List);
    const header = list.find('thead').find('tr').find('th');

    expect(wrapper.find(List).length).to.equal(1);
    expect(wrapper.find(List).instance().props.children.length).to.equal(12);
    expect(wrapper.instance().state.visibleColumns.length).to.equal(11);
    expect(header.at(1).text()).to.equal('structure');
    expect(header.at(2).text()).to.equal('name');
    expect(header.at(3).text()).to.equal('type');
    expect(header.at(4).text()).to.equal('Order ID');
    expect(header.at(5).text()).to.equal('tracking code');
    expect(header.at(6).text()).to.equal('vendor');
    expect(header.at(7).text()).to.equal('supplier');
    expect(header.at(8).text()).to.equal('lab');
    expect(header.at(9).text()).to.equal('date ordered');
    expect(header.at(10).text()).to.equal('status');
    expect(header.at(11).text()).to.equal('ordered by');
  });

  it('should have all 12 visible columns when type is individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} searchOptions={Immutable.Map({ searchType: 'individual' })} />);
    const list = wrapper.find(List);
    list.setState({
      visibleColumns: [...list.instance().state.visibleColumns, 'sku']
    });
    list.update();
    const header = wrapper.find(List).find('thead').find('tr').find('th');

    expect(wrapper.find(List).instance().props.children.length).to.equal(12);
    expect(header.at(1).text()).to.equal('structure');
    expect(header.at(2).text()).to.equal('name');
    expect(header.at(3).text()).to.equal('type');
    expect(header.at(4).text()).to.equal('sku');
    expect(header.at(5).text()).to.equal('Order ID');
    expect(header.at(6).text()).to.equal('tracking code');
    expect(header.at(7).text()).to.equal('vendor');
    expect(header.at(8).text()).to.equal('supplier');
    expect(header.at(9).text()).to.equal('lab');
    expect(header.at(10).text()).to.equal('date ordered');
    expect(header.at(11).text()).to.equal('status');
    expect(header.at(12).text()).to.equal('ordered by');
  });

  it('should display search results when type is not individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} />);

    const list = wrapper.find(List);
    const firstRow = list.find('tbody').find('tr').at(0).find('td');

    expect(list.length).to.equal(1);
    expect(firstRow.find('p').at(0).text()).to.equal('PCR kit');
    expect(firstRow.find('p').at(1).text()).to.equal('Group');
    expect(firstRow.find('p').at(2).text()).to.equal('-');
    expect(firstRow.find('p').at(3).text()).to.equal('1234');
    expect(firstRow.find('p').at(4).text()).to.equal('Bobs chemicals');
    expect(firstRow.find('p').at(5).text()).to.equal('Mock Supplier');
    expect(firstRow.find('p').at(6).text()).to.equal('location');
    expect(firstRow.find('p').at(7).text()).to.equal('Oct 9, 2020');
    expect(firstRow.find('p').at(8).text()).to.equal('Arrived');
    expect(firstRow.find('span').at(1).text()).to.equal('FC');

    const secondRow = list.find('tbody').find('tr').at(1).find('td');
    expect(secondRow.find('p').at(0).text()).to.equal('Some other kit');
    expect(secondRow.find('p').at(1).text()).to.equal('Group');
    expect(secondRow.find('p').at(2).text()).to.equal('external_order_id');
    expect(secondRow.find('p').at(3).text()).to.equal('-');
    expect(secondRow.find('p').at(4).text()).to.equal('Johns chemicals');
    expect(secondRow.find('p').at(5).text()).to.equal('-');
    expect(secondRow.find('p').at(6).text()).to.equal('location2');
    expect(secondRow.find('p').at(7).text()).to.equal('Oct 9, 2020');
    expect(secondRow.find('p').at(8).text()).to.equal('Pending');
    expect(secondRow.find('div').at(9).text()).to.equal('-');
  });

  it('should display search results when search type is individual', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} searchOptions={Immutable.Map({ searchType: 'individual' })} data={data.filter((materials) => materials.getIn(['orderable_material', 'material', 'material_type']) === 'individual')} />);

    const list = wrapper.find(List);
    const firstRow = list.find('tbody').find('tr').at(0).find('td');

    expect(list.length).to.equal(1);
    expect(firstRow.find(Molecule).props().SMILES).to.equal('NCc1ccccc1');
    expect(firstRow.find('p').at(0).text()).to.equal('Benzyl amine');
    expect(firstRow.find('p').at(1).text()).to.equal('Individual');
    expect(firstRow.find('p').at(2).text()).to.equal('external_order_id');
    expect(firstRow.find('p').at(3).text()).to.equal('1234');
    expect(firstRow.find('p').at(4).text()).to.equal('Bobs chemicals');
    expect(firstRow.find('p').at(5).text()).to.equal('Mock Supplier');
    expect(firstRow.find('p').at(6).text()).to.equal('location');
    expect(firstRow.find('p').at(7).text()).to.equal('Oct 9, 2020');
    expect(firstRow.find('p').at(8).text()).to.equal('Arrived');
    expect(firstRow.find('span').at(1).text()).to.equal('FC');
  });

  it('should change columns by selected columns', () => {
    wrapper = shallow(<MaterialOrdersSearchResults {...props} />);
    const list = wrapper.find(List).dive();
    expect(list.find('Table').find('Column').length).to.equal(10);
    list.setState({ visibleColumns: ['Order ID', 'type', 'name', 'vendor'] });
    expect(list.find('Table').find('Column').length).to.equal(4);
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = mount(<MaterialOrdersSearchResults {...props} />);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIAL_ORDERS_TABLE
    });
  });

  it('should format status text to "Checked-in" when its value is "checkedin"', () => {
    const data = Immutable.fromJS([{
      id: 'id49994',
      vendor_order_id: 'external_order_id_2',
      orderable_material: Immutable.Map({
        material: Immutable.Map({
          material_type: 'individual',
          vendor: Immutable.Map({
            name: 'Oasis chemicals',
            id: 'vendor56'
          })
        })
      }),
      tracking_code: '45678',
      lab: Immutable.Map({
        name: 'location'
      }),
      user: Immutable.Map({
        first_name: 'Isbella',
        id: 'u58pfuad5kikd',
        last_name: 'Clementi',
        name: 'Isbella Clementi',
        profile_img_url: null
      }),
      state: 'CHECKEDIN',
      created_at: '2020-10-09T03:21:58.628-07:00'
    }]);

    const propsWithOneRow = _.assign({}, props, { data });
    wrapper = mount(<MaterialOrdersSearchResults {...propsWithOneRow} />);
    const list = wrapper.find(List);
    const firstRow = list.find('tbody').find('tr').at(0).find('td');
    expect(firstRow.find('p').at(4).text()).to.equal('Oasis chemicals');
    expect(firstRow.find('p').at(5).text()).to.equal('-');
    expect(firstRow.find('p').at(6).text()).to.equal('location');
    expect(firstRow.find('p').at(7).text()).to.equal('Oct 9, 2020');
    expect(firstRow.find('p').at(8).text()).to.equal('Checked-in');
  });

  it('OrdersSearchResults columns are sortable', () => {
    wrapper = shallow(<MaterialOrdersSearchResults {...props} />);
    const table = wrapper.find(List);
    expect(table.find(Column).at(0).props().sortable).to.be.true;
    expect(table.find(Column).at(1).props().sortable).to.be.true;
    expect(table.find(Column).at(2).props().sortable).to.be.true;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.true;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
    expect(table.find(Column).at(6).props().sortable).to.be.true;
    expect(table.find(Column).at(7).props().sortable).to.be.true;
    expect(table.find(Column).at(8).props().sortable).to.be.true;
    expect(table.find(Column).at(9).props().sortable).to.be.true;
  });

  it('should show selected rows', () => {
    wrapper = shallow(
      <MaterialOrdersSearchResults
        {...props}
        selected={['id', 'id2']}
      />
    );

    expect(wrapper.find(List).props().selected).to.deep.equal({ id: true, id2: true });
  });

  it('should call onRowClick when clicking on table row', () => {
    wrapper = mount(<MaterialOrdersSearchResults {...props} />);
    const row = wrapper.find(List).find('tr').at(1);
    row.simulate('click');
    expect(mockRowClick.calledOnce).to.be.true;
  });

  it('should render sku when column is enabled', () => {
    wrapper = shallow(<MaterialOrdersSearchResults {...props} />).setState({ visibleColumns: ['sku'] });
    const column = wrapper.find('List').dive().find('Table').find('Column');
    expect(column.props().renderCellContent(data.get(0)).props.children).to.equal('SKU123');
  });

  describe('Export', () => {
    it('should enable Export link if 1 order row is selected', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        })
      }]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const exportButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(exportButton.disabled).to.be.false;
    });

    it('should enable Export button if multiple order rows are selected of Individual type with same Vendor', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        orderable_material: Immutable.Map({
          material: Immutable.Map({
            material_type: 'individual',
            vendor: Immutable.Map({
              name: 'Bobs chemicals',
              id: 'vendor1'
            })
          })
        })
      }, {
        id: 'id2',
        orderable_material: Immutable.Map({
          material: Immutable.Map({
            material_type: 'individual',
            vendor: Immutable.Map({
              name: 'Bobs chemicals',
              id: 'vendor1'
            })
          })
        })
      }]);

      const propsWithSelectedRows = _.assign(props, { data, selected: ['id', 'id2'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const exportButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(exportButton.disabled).to.be.false;
    });

    it('should enable Export button if multiple order rows are selected of Group type with same Vendor', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        orderable_material: Immutable.Map({
          material: Immutable.Map({
            material_type: 'group',
            vendor: Immutable.Map({
              name: 'Bobs chemicals',
              id: 'vendor1'
            })
          })
        })
      }, {
        id: 'id2',
        orderable_material: Immutable.Map({
          material: Immutable.Map({
            material_type: 'group',
            vendor: Immutable.Map({
              name: 'Bobs chemicals',
              id: 'vendor1'
            })
          })
        })
      }]);

      const propsWithSelectedRows = _.assign(props, { data, selected: ['id', 'id2'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const exportButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(exportButton.disabled).to.be.false;
    });

    it('should disable Export button if no Order rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { data, selected: [] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const exportButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(exportButton.disabled).to.be.true;
    });

    it('should disable Export button if multiple order rows are selected which contain both Individual and Group types', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id3'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const exportButton = wrapper.find('ActionMenu').at(1).props().options[0];
      expect(exportButton.disabled).to.be.true;
      expect(exportButton.label).to.equal('Individual and Group Orders must be exported separately');
    });

    it('should disable Export button if multiple order rows are selected belonging to the different Vendors', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id2'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const exportButton = wrapper.find('ActionMenu').at(1).props().options[0];
      expect(exportButton.disabled).to.be.true;
      expect(exportButton.label).to.equal('Vendor must be unique');
    });

    it('should reflect all columns in csv download', () => {
      const data = Immutable.fromJS([{
        vendor_order_id: 'vorid',
        created_at: '2021-12-06T01:04:54.421-08:00',
        user: {
          id: 'user0605202103',
          name: 'user'
        },
        lab: {
          name: 'Menlo Park'
        },
        count: 5,
        state: 'PENDING',
        tracking_code: 'tracking',
        id: 'ko1',
        orderable_material: {
          sku: '678',
          material: {
            vendor: {
              name: 'vendor'
            },
            name: 'N-ethylNIsoPropylPropane2',
            supplier: {
              name: 'supplier'
            },
            material_components: [
              {
                resource: {
                  compound: {
                    smiles: 'CCN(C(C)C)C(C)C'
                  }
                }
              }
            ],
            material_type: 'individual'
          }
        }
      }
      ]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['ko1'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const exportButton = wrapper.find('ActionMenu').at(1).props().options[0];
      const exportData = decodeURIComponent(exportButton.onClick());
      const csv = Papa.parse(exportData.substring(exportData.indexOf(',') + 1));
      const headers = csv.data[0];
      const row = csv.data[1];
      expect(row[headers.indexOf('Smiles')]).equal('CCN(C(C)C)C(C)C');
      expect(row[headers.indexOf('Quantity')]).equal('5');
      expect(row[headers.indexOf('OrderId')]).equal('vorid');
      expect(row[headers.indexOf('Type')]).equal('individual');
      expect(row[headers.indexOf('Name')]).equal('N-ethylNIsoPropylPropane2');
      expect(row[headers.indexOf('TrackingCode')]).equal('tracking');
      expect(row[headers.indexOf('Vendor')]).equal('vendor');
      expect(row[headers.indexOf('Supplier')]).equal('supplier');
      expect(row[headers.indexOf('Lab')]).equal('Menlo Park');
      expect(row[headers.indexOf('DateOrdered')]).equal('2021-12-06T01:04:54.421-08:00');
      expect(row[headers.indexOf('Status')]).equal('PENDING');
      expect(row[headers.indexOf('OrderedBy')]).equal('user');
      expect(row[headers.indexOf('Sku')]).equal('678');
    });

    it('should reflect all columns in csv download when only few columns are selected', () => {
      const data = Immutable.fromJS([{
        vendor_order_id: 'vorid',
        created_at: '2021-12-06T01:04:54.421-08:00',
        user: {
          id: 'user0605202103',
          name: 'user'
        },
        lab: {
          name: 'Menlo Park'
        },
        count: 5,
        state: 'PENDING',
        tracking_code: 'tracking',
        id: 'ko1',
        orderable_material: {
          sku: '678',
          material: {
            vendor: {
              name: 'vendor'
            },
            name: 'N-ethylNIsoPropylPropane2',
            supplier: {
              name: 'supplier'
            },
            material_components: [
              {
                resource: {
                  compound: {
                    smiles: 'CCN(C(C)C)C(C)C'
                  }
                }
              }
            ],
            material_type: 'individual'
          }
        }
      }
      ]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['ko1'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      wrapper.setState({ visibleColumns: ['structure', 'Order ID', 'type', 'name'] });
      const exportButton = wrapper.find('ActionMenu').at(1).props().options[0];
      const exportData = decodeURIComponent(exportButton.onClick());
      const csv = Papa.parse(exportData.substring(exportData.indexOf(',') + 1));
      const headers = csv.data[0];
      const row = csv.data[1];
      expect(row[headers.indexOf('Smiles')]).equal('CCN(C(C)C)C(C)C');
      expect(row[headers.indexOf('Quantity')]).equal('5');
      expect(row[headers.indexOf('OrderId')]).equal('vorid');
      expect(row[headers.indexOf('Type')]).equal('individual');
      expect(row[headers.indexOf('Name')]).equal('N-ethylNIsoPropylPropane2');
      expect(row[headers.indexOf('TrackingCode')]).equal('tracking');
      expect(row[headers.indexOf('Vendor')]).equal('vendor');
      expect(row[headers.indexOf('Supplier')]).equal('supplier');
      expect(row[headers.indexOf('Lab')]).equal('Menlo Park');
      expect(row[headers.indexOf('DateOrdered')]).equal('2021-12-06T01:04:54.421-08:00');
      expect(row[headers.indexOf('Status')]).equal('PENDING');
      expect(row[headers.indexOf('OrderedBy')]).equal('user');
      expect(row[headers.indexOf('Sku')]).equal('678');
    });
  });

  describe('Delete', () => {
    it('should disable Delete button if no Order rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { data, selected: [] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.true;
      expect(deleteButton.find(Tooltip).length).to.equal(0);
    });

    it('should enable Delete button if 1 order row is selected and is in Pending state', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        state: 'PENDING'
      }]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.false;
    });

    it('should enable Delete button if multiple order rows are selected and are in Pending state', () => {
      const data = Immutable.fromJS([
        {
          id: 'ko1g',
          kit: Immutable.Map({
            name: 'PCR kit',
            kit_type: 'group',
            vendor: Immutable.Map({
              name: 'Bobs chemicals',
              id: 'vendor1'
            })
          }),
          state: 'PENDING'
        },
        {
          id: 'ko2g',
          kit: Immutable.Map({
            name: 'PLE PCR kit',
            kit_type: 'group',
            vendor: Immutable.Map({
              name: 'Clifford chemicals',
              id: 'vendor2'
            })
          }),
          state: 'PENDING'
        },
        {
          id: 'ko3g',
          kit: Immutable.Map({
            name: 'OLE PCR kit',
            kit_type: 'group',
            vendor: Immutable.Map({
              name: 'Donald chemicals',
              id: 'vendor3'
            })
          }),
          state: 'SHIPPED'
        },
        {
          id: 'ko4g',
          kit: Immutable.Map({
            name: 'Lam PCR kit',
            kit_type: 'group',
            vendor: Immutable.Map({
              name: 'Robert chemicals',
              id: 'vendor4'
            })
          }),
          state: 'PENDING'
        }
      ]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['ko1g', 'ko2g', 'ko4g'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.false;
    });

    it('should disable Delete button if state is not Pending', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        state: 'ARRIVED'
      }]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');

      expect(deleteButton.find(Tooltip).length).to.equal(1);
      expect(deleteButton.prop('disabled')).to.be.true;
    });

    it('should disable Delete button if some selected order rows are not PENDING ', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        state: 'ARRIVED'
      },
      {
        id: 'id2',
        kit: Immutable.Map({
          name: 'Luis PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Arron chemicals',
            id: 'vendor1'
          })
        }),
        state: 'SHIPPED'
      },
      {
        id: 'id3',
        kit: Immutable.Map({
          name: 'Micro PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Ellie chemicals',
            id: 'vendor3'
          })
        }),
        state: 'PENDING'
      }]);
      const propsWithSelectedRows = _.assign(props, { data, selected: ['id', 'id3'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.true;
    });

    it('should remove order rows from list if the user wants to delete the order rows', () => {
      const debounceFetchSpy = sandbox.spy(MaterialOrdersSearchResults.prototype, 'debounceFetch');
      const creatNotificationSpy = sandbox.stub(NotificationActions, 'createNotification');
      const destroyMany = sandbox.stub(KitOrderActions, 'destroyMany').returns({
        done: (cb) => {
          cb();
        }
      });
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        state: 'PENDING'
      },
      {
        id: 'id2',
        kit: Immutable.Map({
          name: 'Luis PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Arron chemicals',
            id: 'vendor1'
          })
        }),
        state: 'PENDING'
      }]);

      sandbox.stub(MaterialOrdersSearchResults.prototype, 'isConfirm').returns(true);
      const propsWithSelectedRow = _.assign(props, { data, selected: ['id', 'id2'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.false;
      deleteButton.simulate('click');

      expect(destroyMany.calledOnce).to.be.true;
      expect(debounceFetchSpy.calledOnce).to.be.true;
      expect(creatNotificationSpy.calledOnce).to.be.true;
      expect(debounceFetchSpy.calledWith(800)).to.be.true;
    });

    it('should not remove order row from list if the user does not want to delete the order row ', () => {
      const destroyMany = sandbox.stub(KitOrderActions, 'destroy').returns({
        done: () => {
        }
      });

      sandbox.stub(MaterialOrdersSearchResults.prototype, 'isConfirm').returns(false);
      const propsWithSelectedRow = _.assign(props, { selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      expect(deleteButton.prop('disabled')).to.be.false;
      deleteButton.simulate('click');
      expect(destroyMany.calledOnce).to.be.false;
    });

  });

  describe('Checkin', () => {
    it('should disable Checkin button if no Order rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { data, selected: [] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const checkinButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(checkinButton.disabled).to.be.true;
    });

    it('should enable Checkin link if 1 order row is selected', () => {
      const propsWithSelectedRow = _.assign(props, { selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const checkinButton = wrapper.find('ActionMenu').at(0).props().options[0];
      expect(checkinButton.disabled).to.be.false;
    });

    it('should redirect to checkin page when Checkin button is clicked', () => {
      const propsWithSelectedRow = _.assign(props, { selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const checkInButton = wrapper.find(Button).filterWhere(button => button.text() === 'Checkin');
      checkInButton.simulate('click');
      const suggestions = wrapper.find('Suggestions').at(0);
      suggestions.find('span').at(0).simulate('click');
      expect(mockPush.getCall(0).args[0].pathname).to.equal(Urls.material_orders_checkin_page());
      expect(mockPush.getCall(0).args[0].data.length).to.equal(1);
    });

    it('should disable checkin button when mixed material types', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id3'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const checkInButton = wrapper.find(Button).filterWhere(button => button.text() === 'Checkin');
      checkInButton.simulate('click');
      const suggestions = wrapper.find('Suggestions').at(0);
      expect(suggestions.find('P').at(0).prop('suggestion').disabled).to.be.true;
      expect(suggestions.find('P').at(0).prop('suggestion').label).to.equal('Individual and Group Orders must be checked in separately');
    });

    it('should disable Checkin button when some selected order rows are CHECKEDIN', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id49994'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const checkInButton = wrapper.find(Button).filterWhere(button => button.text() === 'Checkin');
      checkInButton.simulate('click');
      const suggestions = wrapper.find('Suggestions').at(0);
      expect(suggestions.find('P').at(0).prop('suggestion').disabled).to.be.true;
      expect(suggestions.find('P').at(0).prop('suggestion').label).to.equal('One or more selected orders has already been checked in');
    });
  });

  describe('Checkin CSV', () => {
    it('should render the Checkin via CSV button', () => {
      wrapper = mount(<MaterialOrdersSearchResults {...props} />);
      const checkinCSVButton = wrapper.find('ActionMenu').at(0).props().options[1];
      expect(checkinCSVButton.text).to.equal('Check in via CSV import');
      expect(checkinCSVButton.onClick).to.exist;
    });

    it('should always enable the Checkin via CSV button', () => {
      wrapper = mount(<MaterialOrdersSearchResults {...props} />);
      const checkinCSVButton = wrapper.find('ActionMenu').at(0).props().options[1];
      expect(checkinCSVButton.disabled).to.equal(false);
    });

    it('should navigate to the Checkin CSV page when Checkin CSV button is clicked', () => {
      wrapper = mount(<MaterialOrdersSearchResults {...props} />);
      const checkinCSVButton = wrapper.find('ActionMenu').at(0).props().options[1];
      checkinCSVButton.onClick();
      expect(mockPush.getCall(1).args[0].pathname).to.equal(Urls.material_orders_checkin_csv_page());
      expect(mockPush.getCall(1).args[0].data.length).to.equal(1);
    });
  });

  describe('Edit', () => {
    it('should disable Edit button if no Order rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { data, selected: [] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      expect(editButton.prop('disabled')).to.be.true;
    });

    it('should enable Edit link if 1 order row is selected and is in any order state', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        state: 'SHIPPED'
      }]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      expect(editButton.prop('disabled')).to.be.false;
    });

    it('should disable Edit link if checked in order', () => {
      const data = Immutable.fromJS([{
        id: 'id',
        kit: Immutable.Map({
          name: 'PCR kit',
          kit_type: 'group',
          vendor: Immutable.Map({
            name: 'Bobs chemicals',
            id: 'vendor1'
          })
        }),
        checked_in_at: '2015-04-01 05:08:24.006168',
        state: 'ARRIVED'
      }]);

      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      expect(editButton.prop('disabled')).to.be.true;
      expect(editButton.prop('label')).to.equal('Cannot edit an order that has been checked in');
    });

    it('should disable edit link if multiple order rows are selected ', () => {
      const propsWithSelectedRows = _.assign(props, { data, selected: ['id', 'id2'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRows} />);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      expect(editButton.prop('disabled')).to.be.true;
      expect(editButton.prop('label')).to.equal('Only one order can be edited at a time');
    });

    it('should navigate to correct path when click on edit link', () => {
      const propsWithSelectedRow = _.assign(props, { data, selected: ['id'] });
      wrapper = mount(<MaterialOrdersSearchResults {...propsWithSelectedRow} />);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      editButton.simulate('click');
      expect(mockPush.calledWith(Urls.edit_material_order('id'))).to.be.true;
    });

    it('should have lab column header name as lab', () => {
      wrapper = mount(<MaterialOrdersSearchResults {...props}  />);
      const list = wrapper.find(List);
      const header = list.find('thead').find('tr').find('th');
      expect(header.at(7).text()).to.equal('lab');
    });
  });
});
