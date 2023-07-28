import React from 'react';
import Immutable from 'immutable';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import { List, Button, Molecule, Tooltip } from '@transcriptic/amino';
import { BrowserRouter } from 'react-router-dom';
import FeatureConstants from '@strateos/features';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import MaterialActions from 'main/actions/MaterialActions';
import MaterialStore from 'main/stores/MaterialStore';
import AcsControls from 'main/util/AcsControls';
import SessionStore from 'main/stores/SessionStore';
import Urls from 'main/util/urls';
import MaterialsSearchResults from './MaterialsSearchResults';

describe('MaterialsSearchResults', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    Urls.use('strateos');
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_KIT_ORDERS).returns(true);
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const data = Immutable.fromJS([
    {
      id: 'id',
      name: 'PCR kit',
      material_type: 'group',
      vendor: { id: 'vendor_id124', name: 'eMolecules' },
      supplier: { id: 'sup1fwt32z3974gr', name: 'Bobs chemicals' },
      total_ordered: 3,
      created_at: '2020-10-09T03:21:58.628-07:00',
      orderable_materials: [{ tier: '5 days' }]

    }, {
      id: 'id2',
      name: 'Some other kit',
      material_type: 'group',
      vendor_id: 'vendor_id124',
      vendor: { name: 'eMolecules' },
      supplier: { id: 'sup1fut2333ss98r', name: 'Johns chemicals' },
      total_ordered: 5,
      created_at: '2020-10-09T03:21:58.628-07:00',
      orderable_materials: [{ tier: '6 days' }]
    }, {
      id: 'id3',
      name: 'kit1',
      material_type: 'individual',
      vendor_id: 'vendor_id125',
      vendor: { name: 'eMolecules' },
      supplier: { id: 'sup1fut2333ss98r', name: 'Johns chemicals' },
      total_ordered: 5,
      created_at: '2020-10-09T03:21:58.628-07:00',
      orderable_materials: [{ tier: '6 days' }],
      material_components: [{
        id: 'matc1h2wemqumbp2s',
        orderable_material_components: [],
        resource: {
          compound: {
            model: {
              id: 'cmpl1fvag7j797e6y',
              smiles: 'NCc1ccccc1',
            }
          },
          id: 'rs1fvag7jdq283n',
          type: 'resources',
        },
        type: 'material_components'
      }]
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
    onRowClick: () => { },
    history: { push: () => {} }
  };

  const groupMaterial1 = {
    id: 'mat12345',
    material_type: 'group',
    orderable_materials: [{
      id: 'omat1',
      type: 'orderable_materials',
      price: 10,
      tier: '10 days',
      orderable_material_components: [{
        vol_measurement_unit: 'µL',
        volume_per_container: 10
      }]
    }],
    vendor: {
      id: 'vend1egepnzw6bwgz',
      name: 'Lonza'
    },
    vendor_id: 'vend1egepnzw6bwgz',
    material_components: [{
      id: 'matc1h2wemqumbp2s',
      resource:
      {
        compound: {},
        id: 'rs1fvag7jdq283n',
        sensitivities: [],
        type: 'resources',
      },
      type: 'material_components'
    }]
  };
  const groupMaterial2 = {
    id: 'mat45678',
    material_type: 'group',
    orderable_materials: [{
      id: 'omat2',
      type: 'orderable_materials',
      price: 5,
      tier: '5 days',
      orderable_material_components: [{
        vol_measurement_unit: 'mg',
        volume_per_container: 5
      }]
    }],
    vendor: {
      id: 'vend2egepnzw6bwgz',
      name: 'Lonza2'
    },
    vendor_id: 'vend1egepnzw6bwgz',
    material_components: [{
      id: 'matc1h2wemqumbp2s',
      resource:
        {
          compound: {},
          id: 'rs1fvag7jdq283n',
          sensitivities: [],
          type: 'resources',
        },
      type: 'material_components'
    }]
  };

  const createWrapper = (props) => {
    return mount(
      <BrowserRouter>
        <MaterialsSearchResults {...props} />
      </BrowserRouter>
    );
  };

  it('should have correct 8 visible columns name when type individual', () => {
    wrapper = createWrapper({
      ...props,
      searchOptions: Immutable.Map({ searchType: 'individual' })
    });
    const list = wrapper.find(List);
    expect(wrapper.find(List).length).to.equal(1);
    const columnHeaders = list.find('thead').find('tr').find('th');
    expect(columnHeaders.at(1).text()).to.equal('structure');
    expect(columnHeaders.at(2).find('div').at(1).text()).to.equal('name');
    expect(columnHeaders.at(3).text()).to.equal('ID');
    expect(columnHeaders.at(4).find('div').at(1).text()).to.equal('vendor');
    expect(columnHeaders.at(5).find('div').at(1).text()).to.equal('supplier');
    expect(columnHeaders.at(6).text()).to.equal('times ever ordered');
    expect(columnHeaders.at(7).find('div').at(1).text()).to.equal('created');
    expect(columnHeaders.at(8).text()).to.equal('tier');
  });

  it('should have correct 8 visible columns name when type not individual', () => {
    wrapper = createWrapper({
      ...props,
      searchOptions: Immutable.Map({ searchType: 'all' })
    });
    const list = wrapper.find(List);
    expect(wrapper.find(List).length).to.equal(1);
    const columnHeaders = list.find('thead').find('tr').find('th');
    expect(columnHeaders.at(1).find('div').at(1).text()).to.equal('name');
    expect(columnHeaders.at(2).text()).to.equal('ID');
    expect(columnHeaders.at(3).find('div').at(1).text()).to.equal('type');
    expect(columnHeaders.at(4).find('div').at(1).text()).to.equal('vendor');
    expect(columnHeaders.at(5).find('div').at(1).text()).to.equal('supplier');
    expect(columnHeaders.at(6).text()).to.equal('times ever ordered');
    expect(columnHeaders.at(7).find('div').at(1).text()).to.equal('created');
    expect(columnHeaders.at(8).text()).to.equal('tier');
  });

  it('should change columns by selected columns', () => {
    wrapper = shallow(<MaterialsSearchResults {...props} />);
    const list = wrapper.find(List).dive();
    expect(list.find('Table').find('Column').length).to.equal(8);
    list.setState({ visibleColumns: ['ID', 'type', 'vendor', 'supplier'] });
    expect(list.find('Table').find('Column').length).to.equal(4);
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = createWrapper(props);
    const list = wrapper.find(List);
    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIALS_TABLE
    });
  });

  it('should display search results', () => {
    wrapper = createWrapper(props);

    const list = wrapper.find(List);
    const firstRow = list.find('tbody').find('tr').at(0).find('td');

    expect(list.length).to.equal(1);
    expect(firstRow.find('p').at(0).text()).to.equal('PCR kit');
    expect(firstRow.find('p').at(1).text()).to.equal('id');
    expect(firstRow.find('p').at(2).text()).to.equal('Group');
    expect(firstRow.find('p').at(3).text()).to.equal('eMolecules');
    expect(firstRow.find('p').at(4).text()).to.equal('Bobs chemicals');
    expect(firstRow.find('p').at(5).text()).to.equal('3');
    expect(firstRow.find('p').at(6).text()).to.equal('Oct 9, 2020');
    expect(firstRow.find('p').at(7).text()).to.equal('5 days');
  });

  it('should display correct search results when search type is individual', () => {
    wrapper = createWrapper({
      ...props,
      searchOptions: Immutable.Map({ searchType: 'individual' }),
      data: data.filter((materials) => materials.get('material_type') === 'individual')
    });
    const list = wrapper.find(List);
    const firstRow = list.find('tbody').find('tr').at(0).find('td');
    expect(list.length).to.equal(1);
    expect(firstRow.find(Molecule).props().SMILES).to.equal('NCc1ccccc1');
    expect(firstRow.find('p').at(0).text()).to.equal('kit1');
    expect(firstRow.find('p').at(1).text()).to.equal('id3');
    expect(firstRow.find('p').at(2).text()).to.equal('eMolecules');
    expect(firstRow.find('p').at(3).text()).to.equal('Johns chemicals');
    expect(firstRow.find('p').at(4).text()).to.equal('5');
    expect(firstRow.find('p').at(5).text()).to.equal('Oct 9, 2020');
    expect(firstRow.find('p').at(6).text()).to.equal('6 days');
  });

  it('should show selected rows', () => {
    wrapper = createWrapper({
      ...props,
      selected: ['foo', 'bar']
    });

    expect(wrapper.find(List).props().selected).to.deep.equal({ foo: true, bar: true });
  });

  describe('List Actions', () => {
    it('should disable Edit and Delete buttons if no rows are selected', () => {
      wrapper = createWrapper(props);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      const orderButton = wrapper.find(Button).filterWhere(button => button.text() === 'Order');

      expect(editButton.prop('disabled')).to.equal(true);
      expect(deleteButton.prop('disabled')).to.equal(true);
      expect(orderButton.prop('disabled')).to.equal(true);
    });

    it('should enable Edit and Delete buttons if exactly 1 row is selected', () => {
      const propsWithSelectedRow = _.assign(props, { selected: ['id'] });
      wrapper = createWrapper(propsWithSelectedRow);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');

      expect(editButton.prop('disabled')).to.equal(false);
      expect(deleteButton.prop('disabled')).to.equal(false);
    });

    it('should disable Edit and Delete buttons if multiple rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id2'] });
      wrapper = createWrapper(propsWithSelectedRows);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      const deleteButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');

      expect(editButton.prop('disabled')).to.equal(true);
      expect(deleteButton.prop('disabled')).to.equal(true);
    });

    it('should take user to Materials form URL in Edit mode if row selected and Edit button clicked', () => {
      const mockPush = sandbox.stub();
      const propsWithSelectedRow = _.assign(props, { selected: ['id'], history: { push: mockPush } });
      wrapper = createWrapper(propsWithSelectedRow);
      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Edit');
      editButton.simulate('click');

      expect(mockPush.args[0][0]).to.contain('vendor/materials/id/edit');
    });

    it('should remove row from list if user wants to go ahead with deleting the row', () => {
      const onDeleteRowSpy = sandbox.spy();
      const MaterialActionsDestroySpy = sandbox.spy(MaterialActions, 'destroyDependent');
      const MaterialActionsMaterialStatsStub = sandbox.stub(MaterialActions, 'materialStats').returns({
        done: (cb) => {
          cb({
            kit_orders_count: 0,
            containers_count: 0
          });
        }
      });

      const propsWithSelectedRow = _.assign(props, { selected: ['id'], onDeleteRowSpy });
      wrapper = createWrapper(propsWithSelectedRow);
      sandbox.stub(MaterialsSearchResults.prototype, 'isConfirm').returns(true);

      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      editButton.simulate('click');
      wrapper.update();

      expect(MaterialActionsMaterialStatsStub.calledOnce).to.be.true;
      expect(MaterialActionsDestroySpy.called).to.be.true;
    });

    it('should not remove row from list if user wants to go ahead with deleting the row', () => {
      const onDeleteRowSpy = sandbox.spy();
      const MaterialActionsDestroySpy = sandbox.spy(MaterialActions, 'destroyDependent');
      const MaterialActionsMaterialStatsStub = sandbox.stub(MaterialActions, 'materialStats').returns({
        done: (cb) => {
          cb({
            kit_orders_count: 0,
            containers_count: 1
          });
        }
      });

      const propsWithSelectedRow = _.assign(props, { selected: ['id'], onDeleteRowSpy });
      wrapper = createWrapper(propsWithSelectedRow);
      sandbox.stub(MaterialsSearchResults.prototype, 'isConfirm').returns(true);

      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      editButton.simulate('click');
      wrapper.update();

      expect(MaterialActionsMaterialStatsStub.calledOnce).to.be.true;
      expect(MaterialActionsDestroySpy.called).to.be.false;
    });

    it('should not remove row from list if user clicks Delete button but does not want to go ahead with deletion', () => {
      const onDeleteRowSpy = sandbox.spy();
      const MaterialActionsDestroySpy = sandbox.spy(MaterialActions, 'destroyDependent');

      const propsWithSelectedRow = _.assign(props, { selected: ['id'], onDeleteRowSpy });
      wrapper = createWrapper(propsWithSelectedRow);
      sandbox.stub(MaterialsSearchResults.prototype, 'isConfirm').returns(false);

      const editButton = wrapper.find(Button).filterWhere(button => button.text() === 'Delete');
      editButton.simulate('click');

      expect(MaterialActionsDestroySpy.calledOnce).to.be.false;
    });

    it('should disable Order button if no rows are selected', () => {
      const propsWithSelected = _.assign(props, { selected: [] });
      wrapper = createWrapper(propsWithSelected);
      const orderButton = wrapper.find(Button).filterWhere(button => button.text() === 'Order');
      expect(orderButton.prop('disabled')).to.equal(true);
    });

    it('should disable Order button if different types of materials are selected', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id2', 'id3'] });
      wrapper = createWrapper(propsWithSelectedRows);
      const orderButton = wrapper.find(Button).filterWhere(button => button.text() === 'Order');
      expect(orderButton.prop('disabled')).to.equal(true);
    });

    it('should enable Order button if same Kit type when rows are selected', () => {
      const propsWithSelectedRows = _.assign(props, { selected: ['id', 'id2'] });
      wrapper = createWrapper(propsWithSelectedRows);
      const orderButton = wrapper.find(Button).filterWhere(button => button.text() === 'Order');
      expect(orderButton.prop('disabled')).to.equal(false);
    });

    it('should take user to Order form URL in Order mode if rows selected and Order button clicked', () => {
      const mockPush = sandbox.stub();
      sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(groupMaterial1));
      sandbox.stub(MaterialStore, 'getByIds')
        .withArgs(['id', 'id2'])
        .returns(Immutable.fromJS([groupMaterial1, groupMaterial2]));
      const propsWithSelectedRow = _.assign(props, { selected: ['id', 'id2'], history: { push: mockPush } });
      wrapper = createWrapper(propsWithSelectedRow);
      const orderButton = wrapper.find(Button).filterWhere(button => button.text() === 'Order');
      orderButton.simulate('click');
      expect(mockPush.args[0][0].pathname).to.contain('vendor/orders/new');
      expect(mockPush.args[0][0].state.materialType).to.deep.equal('group');
      expect(mockPush.args[0][0].state.materials.toJS()).to.deep.equal([{
        id: 'omat1',
        material_id: 'mat12345',
        material_type: 'group',
        orderable_materials: [{
          count: 1,
          id: 'omat1',
          orderable_material_components: [{
            vol_measurement_unit: 'µL',
            volume_per_container: 10
          }],
          price: 10,
          tier: '10 days',
          type: 'orderable_materials'
        }],
        type: 'orderable_materials',
        vendor: {
          id: 'vend1egepnzw6bwgz',
          name: 'Lonza'
        },
        vendor_id: 'vend1egepnzw6bwgz',
        material_components: [{
          id: 'matc1h2wemqumbp2s',
          resource: {
            compound: {},
            id: 'rs1fvag7jdq283n',
            sensitivities: [],
            type: 'resources'
          },
          type: 'material_components'
        }]
      }, {
        id: 'omat2',
        material_id: 'mat45678',
        material_type: 'group',
        orderable_materials: [{
          count: 1,
          id: 'omat2',
          orderable_material_components: [{
            vol_measurement_unit: 'mg',
            volume_per_container: 5
          }],
          price: 5,
          tier: '5 days',
          type: 'orderable_materials',
        }],
        type: 'orderable_materials',
        vendor: {
          id: 'vend2egepnzw6bwgz',
          name: 'Lonza2'
        },
        vendor_id: 'vend1egepnzw6bwgz',
        material_components: [{
          id: 'matc1h2wemqumbp2s',
          resource: {
            compound: {},
            id: 'rs1fvag7jdq283n',
            sensitivities: [],
            type: 'resources'
          },
          type: 'material_components'
        }]
      }]);
    });

    it('should have pop over on table header', () => {
      wrapper = createWrapper(props);
      const tableList = wrapper.find(List);
      expect(tableList.prop('popoverOnHeader')).to.be.true;
    });

    it('should display value on hover over cell', () => {
      wrapper = createWrapper(props);
      const table = wrapper.find(List);
      const firstRow = table.find('tbody').find('tr').at(0).find('td');
      expect(firstRow).to.have.lengthOf(9);
      expect(firstRow.at(1).find(Tooltip).text()).to.equal('PCR kit');
      expect(firstRow.at(2).find(Tooltip).text()).to.equal('id');
      expect(firstRow.at(3).find(Tooltip).text()).to.equal('Group');
      expect(firstRow.at(4).find(Tooltip).text()).to.equal('eMolecules');
      expect(firstRow.at(5).find(Tooltip).text()).to.equal('Bobs chemicals');
      expect(firstRow.at(6).find(Tooltip).text()).to.equal('3');
      expect(firstRow.at(7).find(Tooltip).text()).to.equal('Oct 9, 2020');
      expect(firstRow.at(8).find(Tooltip).text()).to.equal('5 days');
    });

    it('should have new button', () => {
      wrapper = createWrapper(props);

      const newButton = wrapper.find(Button).at(0);

      expect(newButton).to.have.lengthOf(1);
      expect(newButton.find('span').text()).to.equal('New');
      expect(newButton.props().to).to.equal('/strateos/vendor/materials/new');
    });
  });
});
