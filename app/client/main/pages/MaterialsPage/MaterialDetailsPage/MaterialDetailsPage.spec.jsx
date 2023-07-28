import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';
import { Button } from '@transcriptic/amino';
import VendorActions from 'main/actions/VendorActions';
import CategoryActions from 'main/actions/CategoryActions';
import MaterialActions from 'main/actions/MaterialActions';
import OrderableMaterialComponentActions from 'main/actions/OrderableMaterialComponentActions';
import ModalActions from 'main/actions/ModalActions';
import MaterialStore from 'main/stores/MaterialStore';
import ResourceStore from 'main/stores/ResourceStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';

import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import _ from 'lodash';
import MaterialDetailsPage from './MaterialDetailsPage.jsx';

const categories = [{ id: 'cat16pbj9433ruq', path: ['Competent Cells'] }, { id: 'cat19e9mgvfuu3j', path: ['Enzymes,Polymerases'] }];
const vendors = { results: [{ id: '1', name: 'eMolecules' }, { id: 'vend1egepnzw6bwgz', name: 'Lonza' }] };

const groupMaterial = Immutable.fromJS({
  vendor: { id: 'vend1egepnzw6bwgz', name: 'Lonza' },
  name: 'Adapter Ligation (LibPrep Custom)',
  supplier: { id: 'sup1fwt32z3974gr', name: 'Supplier1' },
  is_private: true,
  url: 'https://www.sigmaaldrich.com/',
  total_ordered: 3,
  material_type: 'group',
  note: 'Library Prep Custom Kit. Client supplied.',
  material_components: [
    { id: 'matc1gyj3fgsyghg8',
      concentration: '4:M',
      resource: {
        id: 'rs1',
        sensitivities: []
      },
      orderable_material_components: [
        {
          id: 'omatc1gyj3fh6mjdug',
          name: 'Component 1',
          volume_per_container: 40.00,
          mass_per_container: 0.00,
          vol_measurement_unit: 'µL',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
          no_of_units: 1,
          container_type: {
            id: 'a1-vial'
          }
        }
      ]
    },
    { id: 'matc1gyj3fgsyghg9',
      concentration: '4:M',
      resource: {
        id: 'rs1',
        sensitivities: []
      },
      orderable_material_components: [
        {
          id: 'omatc1gyj3fh6mjkgf',
          name: 'Component 2',
          volume_per_container: 0.00,
          mass_per_container: 80.00,
          mass_measurement_unit: 'mg',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
          no_of_units: 3,
          container_type: {
            id: 'a1-vial'
          }
        }
      ]
    }
  ],
  orderable_materials: [
    {
      price: '10.0',
      margin: 0.1,
      sku: 'SKU12345',
      tier: 'Tier 2, Ships in 1-5 business weeks',
      id: 'omat1gyj3fh6qxz8k',
      type: 'orderable_materials',
      orderable_material_components: [
        {
          id: 'omatc1gyj3fh6mjdug',
          name: 'Component 3',
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 40.00,
          mass_per_container: 0.00,
          vol_measurement_unit: 'µL',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
          no_of_units: 1,
          isConcentrationSetNow: true
        },
        {
          id: 'omatc1gyj3fh6mjkgf',
          name: 'Component 4',
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 0.00,
          mass_per_container: 80.00,
          mass_measurement_unit: 'mg',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
          no_of_units: 3,
          isConcentrationSetNow: true
        }
      ]
    }
  ],
  type: 'materials',
  id: 'mat1gyj3fh6npkyh',
  categories: [{ id: 'cat19e9mgvfuu3j', path: ['Enzymes,Polymerases'] }],
  organization: {
    id: 'org13'
  }
});

const individualMaterial = {
  vendor: { id: 'vend1egepnzw6bwgz', name: 'Lonza' },
  name: 'Adapter Ligation (LibPrep Custom)',
  supplier: { id: 'sup1fwt32z3974gr', name: 'Supplier1' },
  is_private: true,
  url: 'https://www.sigmaaldrich.com/',
  total_ordered: 3,
  material_type: 'individual',
  note: 'Library Prep Custom Kit. Client supplied.',
  isConcentrationSetNow: true,
  material_components: [
    { id: 'matc1gyj3fgsyghg8',
      concentration: '4:M',
      resource: {
        id: 'rs1',
        sensitivities: [],
      },
      orderable_material_components: [
        {
          id: 'omatc1gyj3fh6mjdug',
          name: null,
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 40.00,
          mass_per_container: 0.00,
          vol_measurement_unit: 'µL',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
        },
        {
          id: 'omatc2gyj3fh6mj878',
          name: null,
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 0.00,
          mass_per_container: 80.00,
          mass_measurement_unit: 'mg',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false
        }
      ]
    }
  ],
  orderable_materials: [
    {
      price: '10.0',
      margin: 0.1,
      sku: 'SKU12345',
      tier: 'Tier 2, Ships in 1-5 business weeks',
      id: 'omat1gyj3fh6qxz8k',
      type: 'orderable_materials',
      orderable_material_components: [
        {
          id: 'omatc1gyj3fh6mjdug',
          name: null,
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 40.00,
          mass_per_container: 0.00,
          vol_measurement_unit: 'µL',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false
        }
      ]
    },
    {
      price: '30.0',
      margin: 0.2,
      sku: 'SKU12345',
      tier: 'Tier 2, Ships in 1-5 business weeks',
      id: 'omat2gyj3fh6qxz78',
      type: 'orderable_materials',
      orderable_material_components: [
        {
          id: 'omatc2gyj3fh6mj878',
          name: null,
          container_type: {
            id: 'a1-vial'
          },
          volume_per_container: 0.00,
          mass_per_container: 80.00,
          mass_measurement_unit: 'mg',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false
        }
      ]
    }
  ],
  type: 'materials',
  id: 'mat1gyj3fh6npkyh',
  categories: [{ id: 'cat19e9mgvfuu3j', path: ['Enzymes,Polymerases'] }],
  organization: {
    id: 'org13'
  }
};

const EXPECTED_INCLUDES_FIELDS = [
  'vendor',
  'supplier',
  'organization',
  'categories',
  'orderable_materials.orderable_material_components',
  'material_components.resource',
  'material_components.orderable_material_components',
  'orderable_materials.orderable_material_components.container_type'
];

const labConsumers = [{ organization: { id: 'other_org' } }];

describe('MaterialDetailsPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let history;
  const mockPush = sandbox.stub();
  let sessionStoreGetOrg;

  beforeEach(() => {
    Urls.use('strateos');
    sandbox.stub(LabConsumerStore, 'getAll').returns(Immutable.fromJS(labConsumers));
    sandbox.stub(CategoryActions, 'loadCategories').returns({
      done: (cb) => {
        return { data: cb(categories), fail: () => ({}) };
      }
    });

    sandbox.stub(VendorActions, 'getVendorsList').returns({
      done: (cb) => {
        return { data: cb(vendors), fail: () => ({}) };
      }
    });

    sandbox.stub(OrderableMaterialComponentActions, 'loadOmcGlobalStats').returns({
      done: (cb) => {
        return { data: cb({}), fail: () => ({}) };
      },
      always: () => { }
    });

    history = {
      listen: () => {
        return (() => { });
      },
      push: mockPush,
    };

    sandbox.stub(ResourceStore, 'getById').returns(Immutable.fromJS({ id: 'rs1', sensitivities: [] }));

    sessionStoreGetOrg = sandbox.stub(SessionStore, 'getOrg');
    sessionStoreGetOrg.returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));

    sandbox.stub(MaterialDetailsPage.prototype, 'confirm').returns(true);
  });

  const materialDetailsPage = (match, history, context = { context: { router: {} } }) => {
    return shallow(<MaterialDetailsPage history={history} match={match} />, context);
  };

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('should render material detail page', () => {
    sandbox.stub(MaterialStore, 'getById').returns(undefined);
    const match = {
      params: {}
    };
    wrapper = materialDetailsPage(match, history);
  });

  describe('PageHeader', () => {
    beforeEach(() => {
      sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(groupMaterial));
    });

    it('should display first item of breadcrumbs as Materials with correct link', () => {
      const match = {
        params: {
          materialId: 'mat1gyj3fh6npkyh'
        }
      };

      wrapper = materialDetailsPage(match, history);
      const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
      const header = shallow(PageHeader.props.titleArea);
      const base = header.find('Link').first();

      expect(base.children().text()).to.equal('Materials');
      expect(base.prop('to')).to.equal('/strateos/vendor/materials');
    });

    it('should display second item of breadcrumbs as New if new material is to be created', () => {
      const match = {
        params: {}
      };
      wrapper = materialDetailsPage(match, history);
      const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
      const header = shallow(PageHeader.props.titleArea);
      const base = header.find('Link').at(1);

      expect(base.children().text()).to.equal('New');
      expect(base.prop('to')).to.equal('/strateos/vendor/materials/new');
    });

    it('should display second item of breadcrumbs as the materials id if a material is to be viewed or edited', () => {
      const match = {
        params: {
          materialId: 'mat1gyj3fh6npkyh'
        }
      };
      wrapper = materialDetailsPage(match, history);
      const PageHeader = wrapper.dive().find('PageLayout').prop('PageHeader');
      const header = shallow(PageHeader.props.titleArea);
      const base = header.find('Link').at(1);

      expect(base.children().text()).to.equal('mat1gyj3fh6npkyh');
      expect(base.prop('to')).to.equal('/strateos/vendor/materials/mat1gyj3fh6npkyh');
    });
  });

  describe('Details Section - New Mode', () => {
    let detailsWrapper;

    beforeEach(() => {
      const match = {
        params: {}
      };

      sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(groupMaterial));

      wrapper = materialDetailsPage(match, history);
      detailsWrapper = wrapper.find('Section').filterWhere((section) => section.prop('title') === 'Details');
    });

    it('should display Details as the header for the first section', () => {
      expect(detailsWrapper.find('Section').at(0).prop('title')).to.equal('Details');
    });

    it('should be able to set type for new material', () => {
      const materialType = wrapper.find('MaterialType');
      expect(materialType.prop('disabled')).to.be.false;
    });
  });

  describe('Edit Mode', () => {
    const match = { params: { materialId: 'mat1gyj3fh6npkyh', mode: 'edit' } };
    let detailsWrapper, materialsWrapper, instance;

    describe('Individual Materials', () => {
      beforeEach(() => {
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(individualMaterial));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        detailsWrapper = wrapper.find('Section').filterWhere((section) => section.prop('title') === 'Details');
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('should redirect to checkin page when Checkin button is clicked for individual material', () => {
        const checkInButton = wrapper.find('CommonMethods').dive().find('IndividualForm').dive()
          .find('CostTable')
          .dive()
          .find('Button')
          .at(0);
        checkInButton.simulate('click');
        expect(mockPush.getCall(0).args[0].pathname).to.equal(Urls.material_orders_checkin_page());
      });

      it('should initiate state correctly', () => {
        expect(instance.state.individualMaterials.toJS()[0]).to.deep.include({ id: 'mat1gyj3fh6npkyh' });
        expect(instance.state.individualMaterials.toJS()[0].components.length).to.equal(2);
        expect(instance.state).to.deep.include({
          materialId: 'mat1gyj3fh6npkyh',
          mode: 'edit'
        });
      });

      it('should normalize individual material', () => {
        expect(instance.state.individualMaterials.toJS()[0]).to.deep.include({
          id: 'mat1gyj3fh6npkyh',
          provisionable: true,
          reservable: false,
          indivisible: true,
          dispensable: false,
          resource: {
            id: 'rs1',
            sensitivities: []
          },
          tier: 'Tier 2, Ships in 1-5 business weeks'
        });
      });

      it('should normalize individual material components', () => {
        expect(instance.state.individualMaterials.toJS()[0].components[0]).to.deep.include({
          omId: 'omat1gyj3fh6qxz8k',
          omcId: 'omatc1gyj3fh6mjdug',
          material_component_id: 'matc1gyj3fgsyghg8',
          material_component_concentration: '4:M',
          cost: '10.00',
          unit: 'µL',
          sku: 'SKU12345',
          amount: 40
        });
        expect(instance.state.individualMaterials.toJS()[0].components[1]).to.deep.include({
          omId: 'omat2gyj3fh6qxz78',
          omcId: 'omatc2gyj3fh6mj878',
          material_component_id: 'matc1gyj3fgsyghg8',
          material_component_concentration: '4:M',
          cost: '30.00',
          unit: 'mg',
          sku: 'SKU12345',
          amount: 80
        });
      });

      it('should not be able to change type', () => {
        const materialType = wrapper.find('MaterialType');
        expect(materialType.prop('disabled')).to.be.true;
      });

      it('should not display group level fields in Details Section', () => {
        const name = detailsWrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');
        expect(name).to.have.length(0);
      });

      it('should hide add button when editing individual material', () => {
        expect(wrapper.find(Button)).to.have.length(2);
      });

      it('should display stock modal', () => {
        const stockModal = wrapper.find('OrderableMaterialComponentStockModal');

        expect(stockModal.props().orderableMaterialComponent.get('id')).to.equal('omatc1gyj3fh6mjdug');
        expect(stockModal.props().orderableMaterialComponent.getIn(['resource', 'id'])).to.equal('rs1');
      });

      it('should delete material on delete icon click', () => {
        const deleteSpy = sandbox.spy(MaterialDetailsPage.prototype, 'deleteMaterial');
        const deleteButton = wrapper.find('CommonMethods').dive().find('IndividualForm').dive()
          .find(Button)
          .at(0);

        deleteButton.simulate('click');

        expect(deleteSpy.calledOnce).to.be.true;
      });

      it('should call save action with right format', () => {
        const saveButton = wrapper.find(Button).at(1);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');

        expect(saveActionSpy.getCall(0).args[0]).to.deep.equal({
          id: 'mat1gyj3fh6npkyh',
          name: 'Adapter Ligation (LibPrep Custom)',
          material_type: 'individual',
          url: 'https://www.sigmaaldrich.com/',
          is_private: true,
          note: 'Library Prep Custom Kit. Client supplied.',
          vendor_id: 'vend1egepnzw6bwgz',
          supplier_id: 'sup1fwt32z3974gr',
          category_ids: [
            'cat19e9mgvfuu3j'
          ],
          orderable_materials: [
            {
              id: 'omat1gyj3fh6qxz8k',
              price: '10.00',
              sku: 'SKU12345',
              margin: 0.1,
              tier: 'Tier 2, Ships in 1-5 business weeks',
              orderable_material_components: [
                {
                  id: 'omatc1gyj3fh6mjdug',
                  container_type_id: 'a1-vial',
                  volume_per_container: 40,
                  mass_per_container: 0,
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  provisionable: true,
                  reservable: false,
                  indivisible: true,
                  dispensable: false,
                  no_of_units: 1,
                  material_component_id: 'matc1gyj3fgsyghg8',
                  material_component_concentration: '4:M'
                }
              ]
            },
            {
              id: 'omat2gyj3fh6qxz78',
              price: '30.00',
              sku: 'SKU12345',
              margin: 0.2,
              tier: 'Tier 2, Ships in 1-5 business weeks',
              orderable_material_components: [
                {
                  id: 'omatc2gyj3fh6mj878',
                  container_type_id: 'a1-vial',
                  mass_per_container: 80,
                  volume_per_container: 0,
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  provisionable: true,
                  reservable: false,
                  indivisible: true,
                  dispensable: false,
                  no_of_units: 1,
                  material_component_id: 'matc1gyj3fgsyghg8',
                  material_component_concentration: '4:M'
                }
              ]
            }
          ]
        });
        expect(saveActionSpy.getCall(0).args[1].includes).to.deep.equal(EXPECTED_INCLUDES_FIELDS);
      });

      it('should not include material_component_concentration if value not exists', () => {
        sandbox.restore();

        const materialWithoutConcentrationValue = { ...individualMaterial };
        materialWithoutConcentrationValue.material_components[0].concentration = ':M';

        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        sessionStoreGetOrg = sandbox.stub(SessionStore, 'getOrg');
        sessionStoreGetOrg.returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(materialWithoutConcentrationValue));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        const saveButton = wrapper.find(Button).at(1);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');

        const materialComponentKeys = Object.keys(saveActionSpy.getCall(0).args[0].orderable_materials[0].orderable_material_components[0]);
        expect(materialComponentKeys).to.not.include('material_component_concentration');
      });

      it('should include material_component_concentration if value exists', () => {
        sandbox.restore();

        const materialWithConcentrationValue = { ...individualMaterial };
        materialWithConcentrationValue.material_components[0].concentration = '8:M';

        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        sessionStoreGetOrg = sandbox.stub(SessionStore, 'getOrg');
        sessionStoreGetOrg.returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(materialWithConcentrationValue));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        const saveButton = wrapper.find(Button).at(1);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');

        const materialComponentKeys = Object.keys(saveActionSpy.getCall(0).args[0].orderable_materials[0].orderable_material_components[0]);
        expect(materialComponentKeys).to.include('material_component_concentration');
      });

      it('should change from edit mode to view mode after saving the material', () => {
        const saveButton = wrapper.find(Button).at(1);
        saveButton.simulate('click');
        wrapper.update();
        expect(instance.state).to.deep.include({
          mode: 'view'
        });
      });

      it('should save created/updated/deleted orderable materials according to cost details data', () => {
        const saveButton = wrapper.find(Button).at(1);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        const newCost = Immutable.fromJS({ cost: 99, unit: 'mg', amount: 4, sku: 'ABC123' });
        const newCosts = instance.state.individualMaterials.get(0).get('components')
          .push(newCost) // Add new cost row
          .delete(1); // Delete existing cost row
        wrapper.find('CommonMethods').dive().find('IndividualForm').dive()
          .find('CostTable')
          .prop('onChange')(newCosts);
        instance.setState({ isFormValid: true });

        saveButton.simulate('click');

        const request = saveActionSpy.getCall(0).args;

        const orderableMaterials = request[0].orderable_materials;
        const [updated, created] = orderableMaterials;

        expect(orderableMaterials.length).to.equal(2);
        expect(updated.id).to.equal('omat1gyj3fh6qxz8k');
        expect(created.id).to.be.undefined;
        expect(created).to.deep.include({
          price: 99,
          sku: 'ABC123'
        });
        expect(created.orderable_material_components[0]).to.deep.include({
          material_component: {
            resource_id: 'rs1'
          },
          mass_per_container: 4
        });
      });

      it('should fetch updated material data from store after API update', () => {
        sandbox.stub(MaterialActions, 'update').returns({
          done: (cb) => {
            cb();
            return { fail: () => ({}) };
          }
        });

        const updateStateSpy = sandbox.spy(instance, 'setMaterialState');
        const saveButton = wrapper.find(Button).at(1);

        saveButton.simulate('click');

        expect(updateStateSpy.calledOnce).to.be.true;
      });
    });

    describe('Group Materials', () => {
      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(groupMaterial));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        materialsWrapper = wrapper.find('Section').filterWhere((section) => section.prop('title') === 'Group Items');
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('should initiate state correctly', () => {
        expect(instance.state.groupMaterial.toJS()).to.deep.include({ id: 'mat1gyj3fh6npkyh' });
        expect(instance.state.groupMaterial.get('components').size).to.equal(2);
        expect(instance.state).to.deep.include({
          materialId: 'mat1gyj3fh6npkyh',
          mode: 'edit'
        });
      });

      it('should redirect to checkin page when Checkin button is clicked for group material', () => {
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        wrapper = materialDetailsPage(match, history).dive();
        const materialType = wrapper.find('MaterialType');
        const checkInButton = materialType.dive().find(Button);
        checkInButton.simulate('click');
        expect(mockPush.getCall(0).args[0].pathname).to.equal(Urls.material_orders_checkin_page());
      });

      it('should normalize group material', () => {
        expect(instance.state.groupMaterial.toJS()).to.deep.include({
          id: 'mat1gyj3fh6npkyh',
          margin: 0.1,
          sku: 'SKU12345',
          tier: 'Tier 2, Ships in 1-5 business weeks',
          cost: '10.00'
        });
      });

      it('should normalize group material components', () => {
        expect(instance.state.groupMaterial.getIn(['components', 0]).toJS()).to.deep.include({
          omId: 'omat1gyj3fh6qxz8k',
          omcId: 'omatc1gyj3fh6mjdug',
          name: 'Component 3',
          volume_per_container: 40,
          mass_per_container: 0,
          vol_measurement_unit: 'µL',
          dispensable: false,
          provisionable: true,
          reservable: false,
          indivisible: true,
          resource: {
            id: 'rs1',
            sensitivities: []
          },
          no_of_units: 1,
          material_component_id: 'matc1gyj3fgsyghg8'
        });
        expect(instance.state.groupMaterial.getIn(['components', 1]).toJS()).to.deep.include({
          omId: 'omat1gyj3fh6qxz8k',
          omcId: 'omatc1gyj3fh6mjkgf',
          name: 'Component 4',
          volume_per_container: 0,
          mass_per_container: 80,
          mass_measurement_unit: 'mg',
          dispensable: false,
          provisionable: true,
          reservable: false,
          indivisible: true,
          resource: {
            id: 'rs1',
            sensitivities: []
          },
          no_of_units: 3,
          material_component_id: 'matc1gyj3fgsyghg9'
        });
      });

      it('should not be able to change type', () => {
        const materialType = wrapper.find('MaterialType');
        expect(materialType.prop('disabled')).to.be.true;
      });

      it('should display "Group Items" as the header for the second section', () => {
        expect(materialsWrapper.find('Section').at(0).prop('title')).to.equal('Group Items');
      });

      it('should display correct number of group items', () => {
        expect(materialsWrapper.find('Group')).to.have.length(2);
      });

      it('should show disabled checkin button in Edit mode', () => {
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        wrapper = materialDetailsPage(match, history).dive();
        const materialType = wrapper.find('MaterialType');
        const checkinButton = materialType.dive().find(Button);
        expect(materialType.props().showCheckIn).to.be.true;
        expect(checkinButton.props().disabled).to.be.true;
      });

      it('should be able to add group item by selecting resource', () => {
        const resourceModalSpy = sandbox.stub(ModalActions, 'open');
        const resourceModal = wrapper.find('ResourceSelectorModal');
        const addButton = wrapper.find(Button).at(0);

        addButton.simulate('click');
        resourceModal.prop('onResourceSelected')(
          ['r1'], [Immutable.fromJS({ id: 'r1', name: 'H2O' })]
        );

        expect(resourceModalSpy.calledOnce).to.be.true;
        expect(instance.state.groupMaterial.get('components').get(-1).toJS()).to.deep.include(
          {
            resource: {
              id: 'r1',
              name: 'H2O'
            }
          }
        );
      });

      it('should display stock modal', () => {
        const stockModal = wrapper.find('OrderableMaterialComponentStockModal');

        expect(stockModal.at(0).props().orderableMaterialComponent.get('id')).to.equal('omatc1gyj3fh6mjdug');
        expect(stockModal.at(0).props().orderableMaterialComponent.getIn(['resource', 'id'])).to.equal('rs1');

        expect(stockModal.at(1).props().orderableMaterialComponent.get('id')).to.equal('omatc1gyj3fh6mjkgf');
        expect(stockModal.at(1).props().orderableMaterialComponent.getIn(['resource', 'id'])).to.equal('rs1');
      });

      it('should call save on save', () => {
        const saveButton = wrapper.find(Button).at(2);
        const saveSpy = sandbox.stub(MaterialDetailsPage.prototype, 'save');

        saveButton.simulate('click');

        expect(saveSpy.calledOnce).to.be.true;
      });

      it('should call save action with right format', () => {
        const saveButton = wrapper.find(Button).at(2);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');

        expect(saveActionSpy.getCall(0).args[0]).to.deep.equal({
          id: 'mat1gyj3fh6npkyh',
          name: 'Adapter Ligation (LibPrep Custom)',
          material_type: 'group',
          url: 'https://www.sigmaaldrich.com/',
          is_private: true,
          note: 'Library Prep Custom Kit. Client supplied.',
          vendor_id: 'vend1egepnzw6bwgz',
          supplier_id: 'sup1fwt32z3974gr',
          category_ids: [
            'cat19e9mgvfuu3j'
          ],
          orderable_materials: [
            {
              id: 'omat1gyj3fh6qxz8k',
              price: '10.00',
              sku: 'SKU12345',
              margin: 0.1,
              tier: 'Tier 2, Ships in 1-5 business weeks',
              orderable_material_components: [
                {
                  id: 'omatc1gyj3fh6mjdug',
                  name: 'Component 3',
                  volume_per_container: 40,
                  mass_per_container: 0,
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  provisionable: true,
                  reservable: false,
                  indivisible: true,
                  dispensable: false,
                  no_of_units: 1,
                  material_component_concentration: '4:M',
                  material_component_id: 'matc1gyj3fgsyghg8',
                  container_type_id: 'a1-vial'
                },
                {
                  id: 'omatc1gyj3fh6mjkgf',
                  name: 'Component 4',
                  mass_per_container: 80,
                  volume_per_container: 0,
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  provisionable: true,
                  reservable: false,
                  indivisible: true,
                  dispensable: false,
                  no_of_units: 3,
                  material_component_concentration: '4:M',
                  material_component_id: 'matc1gyj3fgsyghg9',
                  container_type_id: 'a1-vial'
                }
              ]
            }
          ]
        });
        expect(saveActionSpy.getCall(0).args[1].includes).to.deep.equal(EXPECTED_INCLUDES_FIELDS);
      });

      it('should not include material_component_concentration if value not exists', () => {
        sandbox.restore();
        const materialWithoutConcentrationValue = { ...groupMaterial.toJS() };
        materialWithoutConcentrationValue.material_components[0].concentration = undefined;
        materialWithoutConcentrationValue.material_components[1].concentration = undefined;
        materialWithoutConcentrationValue.orderable_materials[0].orderable_material_components[0].isConcentrationSetNow = false;
        materialWithoutConcentrationValue.orderable_materials[0].orderable_material_components[1].isConcentrationSetNow = false;
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        sessionStoreGetOrg = sandbox.stub(SessionStore, 'getOrg');
        sessionStoreGetOrg.returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(materialWithoutConcentrationValue));
        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        const saveButton = wrapper.find(Button).at(2);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');
        const materialComponentKeys = Object.keys(saveActionSpy.getCall(0).args[0].orderable_materials[0].orderable_material_components[0]);
        expect(materialComponentKeys).to.not.include('material_component_concentration');
      });

      it('should include material_component_concentration if value exists', () => {
        sandbox.restore();

        const materialWithConcentrationValue = { ...groupMaterial.toJS() };
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        sessionStoreGetOrg = sandbox.stub(SessionStore, 'getOrg');
        sessionStoreGetOrg.returns(Immutable.fromJS({ id: 'org13', feature_groups: [] }));
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(materialWithConcentrationValue));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        const saveButton = wrapper.find(Button).at(2);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        saveButton.simulate('click');
        const materialComponentKeys = Object.keys(saveActionSpy.getCall(0).args[0].orderable_materials[0].orderable_material_components[0]);
        expect(materialComponentKeys).to.include('material_component_concentration');
      });

      it('should change from edit mode to view mode after saving the material', () => {
        const saveButton = wrapper.find(Button).at(2);
        saveButton.simulate('click');
        wrapper.update();
        expect(instance.state).to.deep.include({
          mode: 'view'
        });
      });

      it('should save created/updated/deleted orderable material components', () => {
        sandbox.stub(MaterialDetailsPage.prototype, 'isFormValid').returns(true);
        const saveButton = wrapper.find(Button).at(2);
        const saveActionSpy = sandbox.spy(MaterialActions, 'update');

        // Add group component
        instance.addComponentToGroupMaterial(Immutable.fromJS({ id: 'r1', name: 'H2O' }));
        // Delete group component
        materialsWrapper.find('Group').at(0).dive().find(Button)
          .at(0)
          .simulate('click');

        saveButton.simulate('click');

        const request = saveActionSpy.getCall(0).args;
        const orderableMaterial = request[0].orderable_materials[0];
        const orderableMaterialComponents = orderableMaterial.orderable_material_components;
        const [updated, created] = orderableMaterialComponents;

        expect(orderableMaterialComponents.length).to.equal(2);
        expect(updated.id).to.equal('omatc1gyj3fh6mjkgf');
        expect(created.id).to.be.undefined;
        expect(created.material_component.resource_id).to.equal('r1');
        expect(orderableMaterial.id).to.equal('omat1gyj3fh6qxz8k');
      });

      it('should fetch updated material data from store after API update', () => {
        sandbox.stub(MaterialActions, 'update').returns({
          done: (cb) => {
            cb();
            return { fail: () => ({}) };
          }
        });

        const updateStateSpy = sandbox.spy(instance, 'setMaterialState');
        const saveButton = wrapper.find(Button).at(2);

        saveButton.simulate('click');

        expect(updateStateSpy.calledOnce).to.be.true;
      });
    });
  });

  describe('New Mode', () => {
    const match = { params: {} };
    let instance;

    describe('Group Materials', () => {
      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById').returns(undefined);
        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
        wrapper.find('MaterialType').prop('onChange')('group');
      });

      it('should initiate state correctly', () => {
        expect(instance.state).to.deep.include({
          groupMaterial: Immutable.Map({
            name: '',
            material_type: 'group',
            components: Immutable.List(),
            categories: Immutable.List(),
            is_private: true
          }),
          individualMaterials: Immutable.List(),
          materialId: undefined,
          mode: 'new'
        });
      });

      it('should initiate group item name with the resource name', () => {
        wrapper.find('ResourceSelectorModal').prop('onResourceSelected')(
          ['r1'], [Immutable.fromJS({ id: 'r1', name: 'Resource name' })]
        );
        expect(instance.state.groupMaterial.getIn(['components', 0, 'name'])).to.equal('Resource name');
      });

      it('should not display stock modal', () => {
        expect(wrapper.find('OrderableMaterialComponentStockModal').length).to.equal(0);
      });

      it('Should not display checkin button', () => {
        expect(wrapper.find('KitCheckinModal').length).to.equal(0);
      });

      it('should call create on save', () => {
        sandbox.stub(MaterialDetailsPage.prototype, 'isFormValid').returns(true);
        const saveButton = wrapper.find(Button).at(1);
        const createSpy = sandbox.stub(MaterialDetailsPage.prototype, 'create');

        instance.setState({ isFormValid: true });
        saveButton.simulate('click');

        expect(createSpy.calledOnce).to.be.true;
      });

      it('should call create action with right format', () => {
        sandbox.stub(MaterialDetailsPage.prototype, 'isFormValid').returns(true);
        const saveButton = wrapper.find(Button).at(1);
        const createActionSpy = sandbox.spy(MaterialActions, 'bulkCreate');

        const updatedGroupMaterial = instance.state.groupMaterial
          .set('name', 'name')
          .set('cost', '32.00')
          .set('margin', 0.05)
          .set('sku', 'foo')
          .set('vendor', Immutable.fromJS({ id: 'vend1egepnzw6bwgz' }))
          .set('categories', Immutable.fromJS([{ id: 'cat16pbj9433ruq' }]));

        instance.setState({
          groupMaterial: updatedGroupMaterial,
          materialType: 'group',
          isFormValid: true
        });

        instance.addComponentToGroupMaterial(Immutable.fromJS({ id: 'rs2' }));

        saveButton.simulate('click');

        expect(createActionSpy.getCall(0).args[0]).to.deep.equal([{
          name: 'name',
          material_type: 'group',
          is_private: true,
          vendor_id: 'vend1egepnzw6bwgz',
          category_ids: ['cat16pbj9433ruq'],
          orderable_materials: [
            {
              price: '32.00',
              sku: 'foo',
              margin: 0.05,
              orderable_material_components: [
                {
                  material_component: {
                    resource_id: 'rs2'
                  },
                  volume_per_container: 0,
                  mass_per_container: 0,
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  no_of_units: 1,
                  provisionable: false,
                  reservable: false,
                  indivisible: false,
                  dispensable: false
                }
              ]
            }
          ]
        }]);
        expect(createActionSpy.getCall(0).args[1].includes).to.deep.equal(EXPECTED_INCLUDES_FIELDS);
      });
    });

    describe('Individual Materials', () => {
      const match = { params: { mode: 'new' } };

      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById').returns(undefined);
        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
      });

      it('should initiate state correctly', () => {
        expect(instance.state.individualMaterials.toJS().length).to.equal(0);
        expect(instance.state).to.deep.include({
          mode: 'new'
        });
      });

      it('should not display stock modal', () => {
        expect(wrapper.find('OrderableMaterialComponentStockModal').length).to.equal(0);
      });

      it('Should not display checkin button', () => {
        expect(wrapper.find('KitCheckinModal').length).to.equal(0);
      });

      it('should open a compound selector modal when clicked on Add button', () => {
        wrapper = materialDetailsPage(match, history).dive();
        const addButton = wrapper.find('ZeroState').dive().find(Button);
        const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
        addButton.simulate('click');
        expect(wrapper.find('CompoundResourceSelectorModal').length).to.equal(1);
        expect(modalActionsSpy.called).to.be.true;
      });

      it('should be able to add individual material by selecting compound resource', () => {
        const resourceModalSpy = sandbox.stub(ModalActions, 'open');
        const compoundResourceModal = wrapper.find('CompoundResourceSelectorModal');
        const addButton = wrapper.find('ZeroState').dive().find(Button);
        addButton.simulate('click');
        compoundResourceModal.prop('onSelectedResource')(
          Immutable.fromJS({ id: 'r1', name: 'H2O' })
        );

        expect(resourceModalSpy.calledOnce).to.be.true;
        expect(instance.state.individualMaterials.get(-1).toJS()).to.deep.include(
          {
            components: [],
            resource: {
              id: 'r1',
              name: 'H2O'
            },
            material_type: 'individual',
            name: 'H2O'
          }
        );
      });

      it('should call create action with required format', () => {
        const saveButton = wrapper.find(Button).at(1);
        const createActionSpy = sandbox.spy(MaterialActions, 'bulkCreate');

        instance.addIndividualMaterial(Immutable.fromJS({ id: 'rs2', name: 'H20' }));

        const updatedIndividualMaterials = instance.state.individualMaterials
          .setIn([0, 'vendor'], Immutable.fromJS({ id: 'vend1egepnzw6bwgz' }))
          .setIn([0, 'categories'], Immutable.fromJS([{ id: 'cat16pbj9433ruq' }]))
          .setIn([0, 'components', 0, 'cost'], '32')
          .setIn([0, 'components', 0, 'amount'], '24')
          .setIn([0, 'container_type_id'], 'a1-vial');

        instance.setState({
          individualMaterials: updatedIndividualMaterials,
          materialType: 'individual',
          isFormValid: true
        });

        saveButton.simulate('click');

        expect(createActionSpy.getCall(0).args[0]).to.deep.equal([{
          name: 'H20',
          material_type: 'individual',
          is_private: true,
          vendor_id: 'vend1egepnzw6bwgz',
          category_ids: ['cat16pbj9433ruq'],
          orderable_materials: [
            {
              price: '32',
              orderable_material_components: [
                {
                  material_component: {
                    resource_id: 'rs2'
                  },
                  container_type_id: 'a1-vial',
                  volume_per_container: 0,
                  mass_per_container: '24',
                  vol_measurement_unit: 'µL',
                  mass_measurement_unit: 'mg',
                  no_of_units: 1,
                  provisionable: false,
                  reservable: false,
                  indivisible: false,
                  dispensable: false
                }
              ]
            }
          ]
        }]);
        expect(createActionSpy.getCall(0).args[1].includes).to.deep.equal(EXPECTED_INCLUDES_FIELDS);
      });
    });
  });

  describe('View Mode', () => {
    const match = { params: { materialId: 'mat1gyj3fh6npkyh' } };
    let instance;

    describe('Group Material', () => {
      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById')
          .returns(Immutable.fromJS(groupMaterial));

        const component = materialDetailsPage(match, history);
        wrapper = component.dive();
        instance = component.instance();
      });

      it('should initiate state correctly', () => {
        expect(instance.state.groupMaterial.toJS()).to.deep.include({ id: 'mat1gyj3fh6npkyh' });
        expect(instance.state.groupMaterial.get('components').size).to.equal(2);
        expect(instance.state).to.deep.include({
          materialId: 'mat1gyj3fh6npkyh',
          mode: 'view'
        });
      });

      it('should hide save button', () => {
        expect(wrapper.find(Button)).to.have.length(1);
      });

      it('should hide add button on zero state', () => {
        expect(wrapper.find('button')).to.have.length(0);
      });

      it('should show enabled checkin button in View mode', () => {
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        wrapper = materialDetailsPage(match, history).dive();
        const materialType = wrapper.find('MaterialType');
        const checkinButton = materialType.dive().find(Button);
        checkinButton.simulate('click');
        expect(checkinButton.props().disabled).to.be.false;
        expect(materialType.props().showCheckIn).to.be.true;
      });

      it('should show enabled checkin button for lab consuming orgs', () => {
        sessionStoreGetOrg.returns(Immutable.Map({ id: 'other_org', feature_groups: [] }));
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        wrapper = materialDetailsPage(match, history).dive();
        const materialType = wrapper.find('MaterialType');
        const checkinButton = materialType.dive().find(Button);
        expect(checkinButton.props().disabled).to.be.false;
        expect(materialType.props().showCheckIn).to.be.true;
      });

      it('should not show checkin button in View mode if user has no permission', () => {
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(false);
        wrapper = materialDetailsPage(match, history).dive();
        const materialType = wrapper.find('MaterialType');
        const checkinButton = materialType.dive().find(Button);
        expect(materialType.props().showCheckIn).to.be.false;
        expect(checkinButton.length).to.equal(0);
      });
    });
  });

  describe('View Mode for individual material', () => {
    const match = { params: { materialId: 'mat1gyj3fh6npkyh' } };
    let component;
    let instance;

    beforeEach(() => {
      sandbox.stub(MaterialStore, 'getById')
        .returns(Immutable.fromJS(individualMaterial));

      component = materialDetailsPage(match, history);
      wrapper = component.dive();
      instance = component.instance();
    });

    it('should initiate state correctly', () => {
      expect(instance.state.individualMaterials.toJS()[0]).to.deep.include({ id: 'mat1gyj3fh6npkyh' });
      expect(instance.state).to.deep.include({
        materialId: 'mat1gyj3fh6npkyh',
        mode: 'view'
      });
    });

    it('should hide save button', () => {
      expect(wrapper.find(Button)).to.have.length(1);
    });

    it('should have the individual material item with editing disabled', () => {
      const form = wrapper.find('CommonMethods').dive().find('IndividualForm');
      expect(form).to.have.length(1);
      expect(form.props().disabled).to.be.true;
    });

    it('should hide add button on zero state', () => {
      expect(wrapper.find('button')).to.have.length(0);
    });

    it('should not show checkin button if user has no permission', () => {
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(false);
      const materialType = wrapper.find('MaterialType');
      const checkinButton = materialType.dive().find(Button);
      expect(materialType.props().showCheckIn).to.be.false;
      expect(checkinButton.length).to.equal(0);
      const individualForm = component.find('CommonMethods').dive().find('IndividualForm');
      expect(individualForm.props().displayCheckIn).to.be.false;
    });
  });

  describe('Validate required fields', () => {
    const match = {
      params: {}
    };
    const history = {
      listen: () => {
        return (() => { });
      }
    };
    let instance;
    let component;

    describe('Group Materials', () => {
      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(groupMaterial));
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        component = materialDetailsPage(match, history);
        instance = component.instance();
        instance.setState({
          materialType: 'group',
          forceValidation: true,
          groupMaterial: groupMaterial
            .merge({
              name: null,
              vendor: null,
              cost: '',
              components: Immutable.List()
            })
        });
        wrapper = component.dive();
      });

      it('should display error messages if required fields Name, Vendor, Container Type, Cost or Group item name are empty', () => {
        instance.setState({
          materialType: 'group',
          forceValidation: true,
          groupMaterial: groupMaterial
            .merge({
              name: null,
              vendor: null,
              cost: '',
              components: Immutable.List([Immutable.Map({
                omcId: 'omatc1hcx2qbpd99az',
                name: '',
                dispensable: false,
                container_type_id: '',
                reservable: false,
                no_of_units: 1,
                indivisible: false,
                reorder_point: null,
                concentration: null,
                resource: {
                  name: ' Cas9 Nuclease Reaction Buffer 10X',
                  id: 'rs17tabch49thq'
                },
                provisionable: false,
                mass_measurement_unit: 'mg',
                vol_measurement_unit: 'µL',
                mass_per_container: 150,
                material_component_id: 'matc1hcx2qbnys3vn',
                maximum_stock: null,
                omId: 'omat1hcx2qbnqtpye',
                volume_per_container: 0,
                id: 'omatc1hcx2qbpd99az'
              })])
            })
        });

        wrapper = component.dive();
        const createButton = wrapper.find(Button).at(1);

        createButton.simulate('click');
        const name = wrapper.find('CommonMethods').dive()
          .find('MaterialHeaderForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'NAME');
        const vendorId = wrapper.find('CommonMethods').dive()
          .find('MaterialHeaderForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'VENDOR');
        const cost = wrapper.find('CommonMethods').dive()
          .find('MaterialHeaderForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'COST');
        const containerType = wrapper.find('Section').filterWhere((section) => section.prop('title') === 'Group Items')
          .find('Group').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'CONTAINER TYPE');
        const groupItemName = wrapper.find('Section').filterWhere((section) => section.prop('title') === 'Group Items')
          .find('Group').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'NAME');

        expect(name.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(vendorId.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(cost.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(containerType.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(groupItemName.dive().find('Validated').prop('error')).to.equal('Required Field');
      });

      it('should display error message if the cost is invalid', () => {
        const component = materialDetailsPage(match, history);
        instance = component.instance();
        instance.setState({
          materialType: 'group',
          forceValidation: true,
          groupMaterial: groupMaterial
            .merge({
              cost: '-50',
              components: Immutable.List()
            })
        });
        wrapper = component.dive();
        const createButton = wrapper.find(Button).at(1);

        createButton.simulate('click');
        const costComponent = wrapper.find('CommonMethods').dive()
          .find('MaterialHeaderForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'COST');

        expect(costComponent.dive().find('Validated').prop('error')).to.equal('Material cost should be greater than 0');
      });

      it('should display error message if no item is added', () => {
        const createButton = wrapper.find(Button).at(1);
        createButton.simulate('click');
        expect(wrapper.find('ZeroState').dive().find('Validated').props().error).to.equal('Please add a group material item');
      });

      it('should not call create on Create button click', () => {
        instance.setState({
          isFormValid: true,
          forceValidation: false,
        });
        const saveButton = wrapper.find(Button).at(1);
        const saveSpy = sandbox.stub(MaterialDetailsPage.prototype, 'save');

        saveButton.simulate('click');
        expect(saveSpy.calledOnce).to.be.false;
        expect(instance.state.forceValidation).to.be.true;
        expect(instance.state.isFormValid).to.be.false;
      });
    });

    describe('Individual Materials', () => {
      beforeEach(() => {
        sandbox.stub(MaterialStore, 'getById').returns(Immutable.fromJS(individualMaterial));
        const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
        getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
        const component = materialDetailsPage(match, history);
        instance = component.instance();
        instance.setState({
          materialType: 'individual',
          forceValidation: true,
          individualMaterials: Immutable.fromJS([{
            components: [],
            container_type_id: '',
            vendor: null,
            resource: { id: 'rs1', sensitivities: [] },
            material_type: 'individual',
            name: ''
          }])
        });
        wrapper = component.dive();
      });

      it('should display error messages if required fields Name, Vendor, ContainerType or Cost are empty', () => {
        const createButton = wrapper.find(Button).at(2);
        createButton.simulate('click');
        const name = wrapper.find('CommonMethods').dive()
          .find('IndividualForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'NAME');
        const vendorId = wrapper.find('CommonMethods').dive()
          .find('IndividualForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'VENDOR');
        const containerType = wrapper.find('CommonMethods').dive()
          .find('IndividualForm').dive()
          .find('LabeledInput')
          .filterWhere(labeledInput => labeledInput.prop('label') === 'CONTAINER TYPE');
        const costTable = wrapper.find('CommonMethods').dive()
          .find('IndividualForm').dive()
          .find('Validated')
          .filterWhere(validated => validated.prop('error') === 'Please add cost item')
          .dive('CostTable');

        expect(name.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(vendorId.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(containerType.dive().find('Validated').prop('error')).to.equal('Required Field');
        expect(costTable).to.have.length(1);
      });

      it('should not call create on Create button click', () => {
        const saveButton = wrapper.find(Button).at(1);
        const saveSpy = sandbox.stub(MaterialDetailsPage.prototype, 'save');

        saveButton.simulate('click');
        expect(saveSpy.calledOnce).to.be.false;
      });
    });
  });
});
