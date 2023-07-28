import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';
import Urls from 'main/util/urls';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import { LabeledInput, Button, InputWithUnits, Unit, TextBody } from '@transcriptic/amino';
import ResourceActions from 'main/actions/ResourceActions';
import ModalActions from 'main/actions/ModalActions';
import OrderableMaterialComponentActions from 'main/actions/OrderableMaterialComponentActions';
import MaterialItem from './MaterialItem';

const categories = [{ id: 'cat1', path: ['DNA'] }, { id: 'cat2', path: ['Enzymes,Polymerases'] }];
const vendors = [{ id: '1', name: 'eMolecules' }, { id: 'vend1egepnzw6bwgz', name: 'Lonza' }];

const groupComponent = {
  id: 'omatc1gyj3fgubguae',
  omId: 'omat1gyj3fgu98f2c',
  omcId: 'omatc1gyj3fgubguae',
  material_component_id: 'matc1gyj3fguacn6d',
  material_component_concentration: '4:molar',
  container_type_id: 'a1-vial',
  resource: {
    organization_id: 'org13',
    compound: {
      model: null,
    },
    name: '50 mM EPZ015666 (PRMT5 Suite)',
    properties: {},
    kind: 'Reagent',
    storage_condition: 'cold_80',
    deleted_at: null,
    type: 'resources',
    id: 'rs1fmmngupczcfv',
    description: null,
    sensitivities: ['Temperature', 'Light', 'Air', 'Humidity'],
    purity: null,
    design: {}
  },
  name: 'Component 1',
  dispensable: false,
  reservable: false,
  no_of_units: 1,
  vol_measurement_unit: 'µL',
  mass_measurement_unit: 'mg',
  indivisible: true,
  reorder_point: null,
  concentration: null,
  provisionable: false,
  mass_per_container: 101.5,
  maximum_stock: null,
  volume_per_container: 1000.6
};

const individualMaterial = {
  name: 'TestRTemperatureCS',
  supplier: {
    name: 'Oakwood',
    is_preferred: true,
    id: 'sup1g2938ahxfv8z',
    type: 'suppliers'
  },
  container_type_id: 'a1-vial',
  resource: {
    organization_id: 'org13',
    compound: {
      model: {
        organization_id: null,
        name: 'Covid-fragment-custom',
        smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
        compound_id: '46a58836-a083-550c-b6c6-d803f26b928e',
        id: 'cmpl1d8ynztkrtfc7'
      }
    },
    name: 'TestRTemperatureCS',
    properties: {},
    kind: 'ChemicalStructure',
    storage_condition: 'cold_4',
    deleted_at: null,
    type: 'resources',
    id: 'rs1fjaxu8pqvsge',
    description: null,
    sensitivities: ['Temperature', 'Light'],
    purity: '30.0',
    design: {}
  },
  note: 'Some important note.',
  components: [
    {
      id: 'omatc1gyj3fgubguae',
      omId: 'omat1gyj3fgu98f2c',
      omcId: 'omatc1gyj3fgubguae',
      name: null,
      amount: 10,
      cost: 80,
      margin: 0.1,
      sku: '1610',
      material_component_id: 'matc1gyj3fguacn6d',
      material_component_concentration: '4:M',
      dispensable: false,
      reservable: false,
      no_of_units: 1,
      unit: 'µL',
      indivisible: false,
      reorder_point: null,
      concentration: null,
      provisionable: false,
      mass_per_container: 108,
      maximum_stock: null,
      volume_per_container: 0
    }
  ],
  deleted_at: null,
  id: 'mat1gyj3fgtq7g3v',
  is_private: true,
  url: null,
  tier: null,
  categories: [
    {
      path: [
        'DNA'
      ],
      id: 'cat1',
      type: 'categories'
    }
  ]
};

describe('Group MaterialItem', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    if (wrapper) { wrapper.unmount(); }
  });

  describe('Edit Mode', () => {
    const props = {
      component: Immutable.fromJS(groupComponent),
      onDeleteComponent: sandbox.spy(),
      onComponentChange: sandbox.spy(),
      disabled: false,
      isValidMaterial: true,
      displayViewStock: true,
      index: 0
    };

    beforeEach(() => {
      wrapper = shallow(<MaterialItem.Group {...props} />);
    });

    afterEach(() => {
      if (wrapper) { wrapper.unmount(); }
      sandbox.restore();
    });

    it('should display Name value', () => {
      const name = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');

      expect(name).to.have.length(1);
      expect(name.find('TextInput').prop('value')).to.equal('Component 1');
    });

    it('should display Resource Name value', () => {
      const resourceName = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESOURCE');

      expect(resourceName).to.have.length(1);
      expect(resourceName.find('TextBody').prop('children')).to.equal('50 mM EPZ015666 (PRMT5 Suite)');
    });

    it('should display Provisionable flag', () => {
      const provisionable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PROVISIONABLE');

      expect(provisionable).to.have.length(1);
      expect(provisionable.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Reservable flag', () => {
      const reservable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESERVABLE');

      expect(reservable).to.have.length(1);
      expect(reservable.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Dispensable flag', () => {
      const dispensable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'DISPENSABLE');

      expect(dispensable).to.have.length(1);
      expect(dispensable.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Indivisible flag', () => {
      const indivisible = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'INDIVISIBLE');

      expect(indivisible).to.have.length(1);
      expect(indivisible.find('Toggle').prop('value')).to.equal('on');
    });

    it('should display Volume per Container value', () => {
      const volume = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VOLUME PER CONTAINER');

      expect(volume).to.have.length(1);
      expect(volume.find('LabeledInput').find('InputWithUnits').dive().find('TextInput')
        .prop('value')).to.equal('1000.6');
      expect(volume.find('LabeledInput').find('InputWithUnits').dive().find('span')
        .text()).to.equal('µL');
    });

    it('should display Mass per Container value', () => {
      const mass = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MASS PER CONTAINER');

      expect(mass).to.have.length(1);
      expect(mass.find('LabeledInput').find('InputWithUnits').dive().find('TextInput')
        .prop('value')).to.equal('101.5');
      expect(mass.find('LabeledInput').find('InputWithUnits').dive().find('span')
        .text()).to.equal('mg');
    });

    it('should display Quantity value', () => {
      const quantity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'QUANTITY');

      expect(quantity).to.have.length(1);
      expect(quantity.find('LabeledInput').find('TextInput').prop('value')).to.equal(1);
    });

    const renderWithProps = (otherProps = {}) => shallow(<MaterialItem.Group {...props} {...otherProps} />);

    it('should disable Concentration input if value already exists', () => {
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');

      expect(concentration).to.have.length(1);
      expect(concentration.find('InputWithUnits').prop('value')).to.equal(props.component.get('material_component_concentration'));
      expect(concentration.find('InputWithUnits').prop('disabled')).to.equal(true);
    });

    it('should have editable concentration input if value is undefined', () => {
      const groupMaterialWithoutConcentration = { ...groupComponent };
      delete groupMaterialWithoutConcentration.material_component_concentration;

      wrapper = renderWithProps({
        component: Immutable.fromJS(groupMaterialWithoutConcentration)
      });
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');
      expect(concentration).to.have.length(1);
      expect(concentration.find('LabeledInput').find('InputWithUnits').prop('disabled')).to.equal(false);
      expect(concentration.find('InputWithUnits').prop('value')).to.equal('');
    });

    it('should display Resource Kind value', () => {
      const kind = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'KIND');

      expect(kind).to.have.length(1);
      expect(kind.find('LabeledInput').find('TextBody').prop('children')).to.equal('Reagent');
    });

    it('should display Resource Sensitivities value', () => {
      const sensitivities = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SENSITIVITIES');

      expect(sensitivities).to.have.length(1);
      expect(sensitivities.find('LabeledInput').find('TextBody').prop('children')).to.equal('Temperature, Light, Air, Humidity');
    });

    it('should display Resource Storage value', () => {
      const storage = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'STORAGE');

      expect(storage).to.have.length(1);
      expect(storage.find('LabeledInput').find('TextBody').prop('children')).to.equal('cold_80');
    });

    it('should display Container type dropdown', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');

      expect(containerType).to.have.length(1);
      expect(containerType.find('LabeledInput').find('ContainerTypeSelector').prop('value')).to.equal('a1-vial');
    });

    it('should display Stock Amount value', () => {
      const stockAmount = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'STOCK AMOUNT');

      expect(stockAmount).to.have.length(1);
      expect(stockAmount.find('Unit').dive().find('span').text()).to.equal('0.00 µL');
    });

    it('should not display Compound and Purity if Kind is not ChemicalStructure', () => {
      const purity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PURITY');
      const compound = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COMPOUND');

      expect(purity).to.have.length(0);
      expect(compound).to.have.length(0);
    });

    it('should display Compound and Purity if Kind is ChemicalStructure', () => {
      const propsWithCompound = {
        component: Immutable.fromJS({
          ...groupComponent,
          resource: {
            ...groupComponent.resource,
            kind: 'ChemicalStructure',
            purity: '90.0',
            compound: {
              id: 'AAAQKTZKLRYKHR-UHFFFAOYSA-N',
              smiles: 'c1ccc(C(c2ccccc2)c2ccccc2)cc1'
            }
          }
        }),
        onDeleteComponent: sandbox.spy(),
        onComponentChange: sandbox.spy(),
        displayViewStock: true,
        index: 0,
        disabled: false
      };

      wrapper = shallow(<MaterialItem.Group {...propsWithCompound} />);
      const compound = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COMPOUND');
      const purity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PURITY');

      expect(compound.find('LabeledInput').dive().find('label').at(0)
        .text()).to.equal('COMPOUND');
      expect(compound.find('LabeledInput').find('MoleculeViewer').prop('SMILES')).to.equal('c1ccc(C(c2ccccc2)c2ccccc2)cc1');
      expect(purity).to.have.length(1);
      expect(purity.find('LabeledInput').dive().find('TextBody').prop('children')).to.equal('90.0%');
    });
  });

  describe('View Mode', () => {
    const props = {
      component: Immutable.fromJS(groupComponent),
      onDeleteComponent: sandbox.spy(),
      onComponentChange: sandbox.spy(),
      disabled: true,
      isValidMaterial: true,
      displayViewStock: true,
      index: 0
    };

    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
      wrapper = shallow(<MaterialItem.Group {...props} />);
    });

    it('should display Volume per Container value', () => {
      const volume = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VOLUME PER CONTAINER');

      expect(volume).to.have.length(1);
      expect(volume.find('LabeledInput').find('Unit').dive().text()).to.equal('1000.6 µL');
    });

    it('should display Mass per Container value', () => {
      const mass = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MASS PER CONTAINER');

      expect(mass).to.have.length(1);
      expect(mass.find('LabeledInput').find('Unit').dive().text()).to.equal('101.5 mg');
    });

    it('should display Quantity value', () => {
      const quantity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'QUANTITY');

      expect(quantity).to.have.length(1);
      expect(quantity.find('Popover').prop('content')).to.equal(1);
    });

    it('should display Concentration input with value', () => {
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');
      expect(concentration).to.have.length(1);
      expect(concentration.find('LabeledInput').find('Unit').dive().text()).to.equal('4 M');
    });

    it('should display View Stock button', () => {
      const viewStockButton = wrapper.find(Button).dive().find('span')
        .filterWhere((span) => span.text() === 'View Stock');

      expect(viewStockButton).to.have.length(1);
    });

    it('should display stock amount value when only stock volume is present', () => {
      sandbox.stub(OrderableMaterialComponentActions, 'loadOmcGlobalStats').withArgs('omatc1gyj3fgubguae').returns({
        done: (cb) => {
          return { data: cb([{ stock_volume: '10.0' }]), fail: () => ({}) };
        }
      });
      wrapper = shallow(<MaterialItem.Group {...props} />);
      const mass = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'STOCK AMOUNT');

      expect(mass).to.have.length(1);
      expect(mass.find('LabeledInput').find('Unit').dive().text()).to.equal('10.00 µL');
    });

    it('should display Container type dropdown', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');

      expect(containerType).to.have.length(1);
      expect(containerType.find('LabeledInput').find('Popover').prop('content')).to.equal('a1-vial');
    });

    it('should display stock amount value when only stock mass is present', () => {
      sandbox.stub(OrderableMaterialComponentActions, 'loadOmcGlobalStats').withArgs('omatc1gyj3fgubguae').returns({
        done: (cb) => {
          return { data: cb([{ stock_mass: '10.0' }]), fail: () => ({}) };
        }
      });
      props.component = props.component.set('volume_per_container', 0);
      wrapper = shallow(<MaterialItem.Group {...props} />);
      const mass = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'STOCK AMOUNT');

      expect(mass).to.have.length(1);
      expect(mass.find('LabeledInput').find('Unit').dive().text()).to.equal('10.00 mg');
    });

    it('should display helper tooltips', () => {
      const provisionable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PROVISIONABLE');
      const reservable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESERVABLE');
      const dispensable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'DISPENSABLE');
      const indivisible = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'INDIVISIBLE');

      expect(provisionable.prop('tip').length).to.be.above(0);
      expect(reservable.prop('tip').length).to.be.above(0);
      expect(dispensable.prop('tip').length).to.be.above(0);
      expect(indivisible.prop('tip').length).to.be.above(0);
    });
  });

  describe('onComponentChange', () => {
    const groupMaterialWithoutConcentration = { ...groupComponent };
    groupComponent.material_component_concentration = undefined;
    const props = {
      component: Immutable.fromJS(groupMaterialWithoutConcentration),
      onDeleteComponent: sandbox.spy(),
      onComponentChange: sandbox.spy(),
      disabled: false,
      displayViewStock: true,
      index: 0
    };

    beforeEach(() => {
      wrapper = shallow(<MaterialItem.Group {...props} />);
    });

    it('should update Name in component state', () => {
      const volume = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME').find('TextInput');
      volume.prop('onChange')({ target: { value: 'New component name' } });

      expect(props.onComponentChange.calledWith(props.component.set('name', 'New component name'))).to.be.true;
    });

    it('should update Volume per Container in component state', () => {
      const volume = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VOLUME PER CONTAINER').find('InputWithUnits');
      volume.prop('onChange')({ target: { numericValue: 20 } });

      expect(props.onComponentChange.calledWith(props.component.set('volume_per_container', 20))).to.be.true;
    });

    it('should update Mass Per Container in component state', () => {
      const mass = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MASS PER CONTAINER').find('InputWithUnits');
      mass.prop('onChange')({ target: { numericValue: 20 } });

      expect(props.onComponentChange.calledWith(props.component.set('mass_per_container', 20))).to.be.true;
    });

    it('should update Quantity in component state', () => {
      const quantity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'QUANTITY').find('TextInput');
      quantity.simulate('change', { target: { value: 20 } });

      expect(props.onComponentChange.calledWith(props.component.set('no_of_units', 20))).to.be.true;
    });

    it('should update Container Type in component state', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');
      containerType.find('ContainerTypeSelector').simulate('change', { target: { value: 'flask-250' } });

      expect(props.onComponentChange.calledWith(props.component.set('container_type_id', 'flask-250'))).to.be.true;
    });

    it('should update concentration in component state', () => {
      const concentrationInput = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION').find('InputWithUnits');
      concentrationInput.simulate('change', { target: { value: '4:molar' } });
      expect((props.onComponentChange.calledWith(props.component.set('isConcentrationSetNow', true).set('material_component_concentration', '4:molar')))).to.be.true;
    });
  });

  describe('Form Validation', () => {

    const defaultProps = {
      component: Immutable.fromJS(groupComponent),
      onDeleteComponent: sandbox.spy(),
      onComponentChange: sandbox.spy(),
      forceValidation: true,
      disabled: false,
      isValidMaterial: true,
      displayViewStock: true,
      index: 0
    };

    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    });

    const renderWithProps = (props = {}) => shallow(<MaterialItem.Group {...defaultProps} {...props} />);

    it('should not display error if forceValidation prop is false', () => {
      wrapper = renderWithProps({
        forceValidation: false,
        component: Immutable.fromJS({ ...groupComponent, volumer_per_container: -1 })
      });
      const errors = wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error')));
      expect(errors).to.have.length(0);
    });

    it('should display error if volume and mass both are not present', () => {
      wrapper = renderWithProps({
        component: Immutable.fromJS({ ...groupComponent, volume_per_container: 0, mass_per_container: '' })
      });
      expect(wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(2);
      expect(wrapper.find('Validated')
        .filterWhere(validated => validated.prop('error') === 'Volume or Mass is required'))
        .to.have.length(2);
    });

    it('should display error if volume or mass has negative value', () => {
      wrapper = renderWithProps({
        component: Immutable.fromJS({ ...groupComponent, volume_per_container: -1, mass_per_container: 2 })
      });
      expect(wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(1);
      expect(wrapper.find('Validated')
        .filterWhere(validated => validated.prop('error') === 'Must be greater than 0')
        .dive('InputWithUnits'))
        .to.have.length(1);
    });

    it('should not display error if volume is > 0 and mass is 0', () => {
      wrapper = renderWithProps({
        component: Immutable.fromJS({ ...groupComponent, volume_per_container: 10, mass_per_container: 0 })
      });
      expect(wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(0);
    });

    it('should display error if container type id is not set', () => {
      wrapper = renderWithProps({
        component: Immutable.fromJS({ ...groupComponent, container_type_id: '' })
      });

      expect(wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(1);
      expect(wrapper.find('Validated')
        .filterWhere(validated => validated.prop('error') === 'Required Field'))
        .to.have.length(1);
    });

    it('should display error if concentration is present but value is less than 0', () => {
      wrapper = renderWithProps({
        component: Immutable.fromJS({ ...groupComponent, material_component_concentration: '-1:M' })
      });

      expect(wrapper.find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(1);
      expect(wrapper.find('Validated')
        .filterWhere(validated => validated.prop('error') === 'Must be greater than 0'))
        .to.have.length(1);
    });
  });
});

describe('Individual MaterialItem', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    if (wrapper) { wrapper.unmount(); }
  });

  describe('Create Individual Material', () => {
    const props = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS(individualMaterial),
      onMaterialChange: sandbox.spy(),
      onDeleteMaterial: sandbox.spy(),
      setFormValidState: sandbox.spy(),
      isValidMaterial: true,
      displayViewStock: false
    };

    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
      const hocWrapper = shallow(<MaterialItem.Individual {...props} />);
      expect(hocWrapper.find('IndividualForm').dive().length).to.eql(1);
      wrapper = hocWrapper.find('IndividualForm').dive();
    });

    it('should display compound name at the top', () => {
      expect(wrapper.find('h3').text()).to.equal('Covid-fragment-custom');
    });

    it('should display compound structure', () => {
      expect(wrapper.find('Molecule').props().SMILES).to.equal('NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1');
    });

    it('should display private flag toggle value', () => {
      const privateToggle = wrapper.find('Toggle').filterWhere((labeledInput) => labeledInput.prop('name') === 'private-flag-toggle-0');
      expect(privateToggle).to.have.length(1);
      expect(privateToggle.find('Toggle').prop('value')).to.equal('on');
    });

    it('should display name field', () => {
      const resourceName = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');
      expect(resourceName).to.have.length(1);
      expect(resourceName.find('TextInput').prop('value')).to.equal('TestRTemperatureCS');
    });

    it('should display category field', () => {
      const category = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CATEGORY');
      expect(category).to.have.length(1);
      expect(category.find('Select').prop('value')).to.equal('cat1');
    });

    it('should display resource id field', () => {
      const resourceId = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESOURCE ID');
      expect(resourceId).to.have.length(1);
      expect(resourceId.find(LabeledInput).find('TextBody').prop('children')).to.equal('rs1fjaxu8pqvsge');
    });

    it('should display resource modal on click of the resource id', () => {
      const resource = individualMaterial.resource;
      const resourceActionCall = sandbox.stub(ResourceActions, 'load').returns({ then: (cb) => {
        cb({ resource });
      } });
      const resourceModalOpen = sandbox.stub(ModalActions, 'openWithData');
      const resourceId = wrapper.find(LabeledInput).filterWhere((labeledInput) => labeledInput.prop('label') === 'RESOURCE ID').find('TextBody');
      resourceId.simulate('click');
      expect(resourceActionCall.calledOnce).to.be.true;
      expect(resourceModalOpen.calledOnce).to.be.true;
      expect(resourceModalOpen.args[0][0]).to.equal('CREATE_RESOURCE_MODAL');
      expect(resourceModalOpen.args[0][1].resource).to.deep.equal({ resource: resource });
    });

    it('should display vendor field', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR');
      expect(vendor).to.have.length(1);
      expect(vendor.find('Select').prop('value')).to.equal(null);
    });

    it('should not display supplier field if vendor field is empty', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER');
      expect(supplier).to.have.length(0);
    });

    it('should display URL field', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL');
      expect(url).to.have.length(1);
      expect(url.find('TextInput').prop('value')).to.equal(null);
    });

    it('should display Delivery Tier field', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER');
      expect(tier).to.have.length(1);
      expect(tier.find('TextInput').prop('value')).to.equal(null);
    });

    it('should display Provisionable flag', () => {
      const provisionable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PROVISIONABLE');
      expect(provisionable).to.have.length(1);
      expect(provisionable.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Reservable flag', () => {
      const reservable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESERVABLE');
      expect(reservable).to.have.length(1);
      expect(reservable.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Indivisible flag', () => {
      const indivisible = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'INDIVISIBLE');
      expect(indivisible).to.have.length(1);
      expect(indivisible.find('Toggle').prop('value')).to.equal('off');
    });

    it('should display Resource Kind value', () => {
      const kind = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'KIND');
      expect(kind).to.have.length(1);
      expect(kind.find('LabeledInput').find('TextBody').prop('children')).to.equal('ChemicalStructure');
    });

    it('should display Resource Purity value', () => {
      const purity = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PURITY');
      expect(purity).to.have.length(1);
      expect(purity.find('LabeledInput').find('TextBody').prop('children')).to.equal('30.0%');
    });

    it('should display Resource Sensitivities value', () => {
      const sensitivities = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SENSITIVITIES');
      expect(sensitivities).to.have.length(1);
      expect(sensitivities.find('LabeledInput').find('TextBody').prop('children')).to.equal('Temperature, Light');
    });

    it('should display Resource Storage value', () => {
      const storage = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'STORAGE');
      expect(storage).to.have.length(1);
      expect(storage.find('LabeledInput').find('TextBody').prop('children')).to.equal('cold_4');
    });

    it('should display Concentration input', () => {
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');

      expect(concentration).to.have.length(1);
      expect(concentration.find(InputWithUnits)).to.have.length(1);
    });

    it('should display Container type dropdown', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');

      expect(containerType).to.have.length(1);
      expect(containerType.find('LabeledInput').find('ContainerTypeSelector').prop('value')).to.equal('a1-vial');
    });

    it('should contain cost table', () => {
      const costTable = wrapper.find('CostTable');
      expect(costTable).to.have.length(1);
    });

    it('should redirect to compound details page on clicking the compound', () => {
      if (wrapper) { wrapper.unmount(); }
      if (hocWrapper) { hocWrapper.unmount(); }
      Urls.use('org13');
      const callback = sandbox.spy();
      const propsWithRouter = _.assign(props, { router: { history:  { push: callback } } });
      const hocWrapper = shallow(<MaterialItem.Individual {...propsWithRouter} />);
      const wrapper = hocWrapper.find('IndividualForm').dive();
      wrapper.find('.material-details-page__compound-click').simulate('click');
      expect(callback.calledWith('/org13/compounds/cmpl1d8ynztkrtfc7')).to.be.true;
    });
  });

  describe('View Mode', () => {
    const props = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS(individualMaterial),
      onMaterialChange: sandbox.spy(),
      onDeleteMaterial: sandbox.spy(),
      setFormValidState: sandbox.spy(),
      disabled: true,
      displayViewStock: true
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialItem.Individual {...props} />);
      expect(hocWrapper.find('IndividualForm').dive().length).to.eql(1);
      wrapper = hocWrapper.find('IndividualForm').dive();
    });

    const renderWithProps = (otherProps = {}) => shallow(<MaterialItem.Individual {...props} {...otherProps} />).find('IndividualForm').dive();

    it('should display name field', () => {
      const name = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');
      expect(name).to.have.length(1);
      expect(name.find('TextInput')).to.have.length(0);
      expect(name.find('Popover').prop('content')).to.equal('TestRTemperatureCS');
    });

    it('should display category field', () => {
      const category = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CATEGORY');
      expect(category).to.have.length(1);
      expect(category.find('Select')).to.have.length(0);
    });

    it('should display vendor field', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR');
      expect(vendor).to.have.length(1);
      expect(vendor.find('Select')).to.have.length(0);
    });

    it('should display URL field', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL');
      expect(url).to.have.length(1);
      expect(url.find('Select')).to.have.length(0);
      expect(url.find('Popover')).to.have.length(1);
    });

    it('should display Delivery Tier field', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER');
      expect(tier).to.have.length(1);
      expect(tier.find('Select')).to.have.length(0);
      expect(tier.find('Popover')).to.have.length(1);
    });

    it('should display Provisionable flag', () => {
      const provisionable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PROVISIONABLE');
      expect(provisionable).to.have.length(1);
      expect(provisionable.find('Toggle').prop('value')).to.equal('off');
      expect(provisionable.find('Toggle').prop('readOnly')).to.equal(true);
    });

    it('should display Reservable flag', () => {
      const reservable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESERVABLE');
      expect(reservable).to.have.length(1);
      expect(reservable.find('Toggle').prop('value')).to.equal('off');
      expect(reservable.find('Toggle').prop('readOnly')).to.equal(true);
    });

    it('should display Indivisible flag', () => {
      const indivisible = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'INDIVISIBLE');
      expect(indivisible).to.have.length(1);
      expect(indivisible.find('Toggle').prop('value')).to.equal('off');
      expect(indivisible.find('Toggle').prop('readOnly')).to.equal(true);
    });

    it('should display note', () => {
      const note = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NOTE');
      expect(note.find('TextArea')).to.have.length(0);
      expect(note.find('TextBody').prop('children')).to.equal('Some important note.');
    });

    it('should display Container type dropdown', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');

      expect(containerType).to.have.length(1);
      expect(containerType.find('LabeledInput').find('Popover').prop('content')).to.equal('a1-vial');
    });

    it('should display helper tooltips', () => {
      const provisionable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'PROVISIONABLE');
      const reservable = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'RESERVABLE');
      const indivisible = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'INDIVISIBLE');

      expect(provisionable.prop('tip').length).to.be.above(0);
      expect(reservable.prop('tip').length).to.be.above(0);
      expect(indivisible.prop('tip').length).to.be.above(0);
    });

    it('should display Concentration TextLabel using Unit component', () => {
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');

      expect(concentration).to.have.length(1);
      expect(concentration.find(TextBody).find(Unit).prop('value')).to.equal('4:molar');
    });

    it('should display Concentration TextLabel with value as "-" if it is undefined', () => {
      const individualMaterialWithoutConcentration = { ...individualMaterial };
      individualMaterial.components[0].material_component_concentration = undefined;
      wrapper = renderWithProps({
        material: Immutable.fromJS(individualMaterialWithoutConcentration)
      });

      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');
      expect(concentration).to.have.length(1);
      expect(concentration.find('TextBody').prop('children')).to.equal('-');
    });
  });

  describe('Edit Mode', () => {
    const props = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS(individualMaterial),
      onMaterialChange: sandbox.spy(),
      onDeleteOrderableMaterialComponentMaterial: sandbox.spy(),
      setFormValidState: sandbox.spy(),
      editing: true,
      displayViewStock: true
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialItem.Individual {...props} />);
      expect(hocWrapper.find('IndividualForm').dive().length).to.eql(1);
      wrapper = hocWrapper.find('IndividualForm').dive();
    });

    const renderWithProps = (otherProps = {}) => shallow(<MaterialItem.Individual {...props} {...otherProps} />).find('IndividualForm').dive();

    it('should disable vendor field', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR');
      expect(vendor.find('Select').length).to.equal(0);
    });

    it('should disable supplier field', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER');
      expect(supplier.find('Select').length).to.equal(0);
    });

    it('should display chemical structure', () => {
      const material = props.material.updateIn(['resource', 'compound'], (compound) => compound.get('model'));
      const individualForm = shallow(<MaterialItem.Individual {...props} material={material} />);
      const molecule = individualForm.find('IndividualForm').dive().find('Molecule');
      expect(molecule.prop('SMILES')).to.equal('NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1');
      individualForm && individualForm.unmount();
    });

    it('should display concentration TextLabel using Unit component if value already exists', () => {
      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');

      expect(concentration).to.have.length(1);
      expect(concentration.find(TextBody).find(Unit).prop('value')).to.equal('4:molar');
    });

    it('should have editable concentration input if value is undefined', () => {
      const individualMaterialWithoutConcentration = { ...individualMaterial };
      individualMaterial.components[0].material_component_concentration = null;
      wrapper = renderWithProps({
        material: Immutable.fromJS(individualMaterialWithoutConcentration)
      });

      const concentration = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION');
      expect(concentration).to.have.length(1);
      expect(concentration.find(InputWithUnits).prop('value')).to.equal('');
      expect(concentration.find(InputWithUnits).prop('disabled')).to.equal(false);
    });

  });

  describe('onMaterialChange', () => {
    const individualMaterialWithoutConcentration = { ...individualMaterial };
    individualMaterial.components[0].material_component_concentration = undefined;
    const props = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS({ ...individualMaterialWithoutConcentration, vendor: vendors[1] }),
      onMaterialChange: sandbox.spy(),
      onDeleteMaterial: sandbox.spy(),
      setFormValidState: sandbox.spy(),
      displayViewStock: true
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialItem.Individual {...props} />);
      expect(hocWrapper.find('IndividualForm').dive().length).to.eql(1);
      wrapper = hocWrapper.find('IndividualForm').dive();
    });

    it('should update resource name in individual material state', () => {
      const name = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME').find('TextInput');
      name.simulate('change', { target: { value: 'Resource Name' } });
      expect(props.onMaterialChange.calledWith(props.material.set('name', 'Resource Name'))).to.be.true;
    });

    it('should update category in individual material state', () => {
      const category = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CATEGORY').find('Select');
      category.simulate('change', { target: { value: 'cat2' } });
      expect(props.onMaterialChange.calledWith(props.material.set('categories', Immutable.fromJS([{ id: 'cat2', path: ['Enzymes,Polymerases'] }])))).to.be.true;
    });

    it('should update vendor in individual material state', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR').find('Select');
      const newVendor = vendors[0];
      vendor.simulate('change', { target: { value: newVendor.name } });
      expect(props.onMaterialChange.calledWith(props.material.merge({ vendor: newVendor }))).to.be.true;
    });

    it('should update supplier in individual material state', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER').find('TypeAheadInput');
      expect(supplier).to.have.length(1);
      supplier.prop('onSuggestedSelect')('Supplier1');
      expect(props.onMaterialChange.calledOnce);

      supplier.prop('onClear')();
      expect(props.onMaterialChange.calledWith(props.material.merge({ supplier_id: null, supplier: null }))).to.be.true;
    });

    it('should update URL in individual material state', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL').find('TextInput');
      url.simulate('change', { target: { value: 'http://emolecules.com' } });
      expect(props.onMaterialChange.calledWith(props.material.set('url', 'http://emolecules.com'))).to.be.true;
    });

    it('should update delivery tier in individual material state', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER').find('TextInput');
      tier.simulate('change', { target: { value: '5 Days' } });
      expect(props.onMaterialChange.calledWith(props.material.set('tier', '5 Days'))).to.be.true;
    });

    it('should update note in individual material state', () => {
      const note = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NOTE').find('TextArea');
      note.simulate('change', { target: { value: 'Some even more important note.' } });
      expect(props.onMaterialChange.calledWith(props.material.set('note', 'Some even more important note.'))).to.be.true;
    });

    it('should update Container Type in individual material state', () => {
      const containerType = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONTAINER TYPE');
      containerType.find('ContainerTypeSelector').simulate('change', { target: { value: 'flask-250' } });

      expect(props.onMaterialChange.calledWith(props.material.set('container_type_id', 'flask-250'))).to.be.true;
    });

    it('should update concentration in individual material state', () => {
      const concentrationInput = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CONCENTRATION').find(InputWithUnits);
      concentrationInput.simulate('change', { target: { value: '4:M' } });
      expect(props.onMaterialChange.calledWith(props.material.set('material_component_concentration', '4:M').set('isConcentrationSetNow', true))).to.be.true;
    });
  });

  describe('Form Validation', () => {
    const individualMaterialWithoutConcentration = { ...individualMaterial };
    individualMaterial.components[0].material_component_concentration = undefined;
    const defaultProps = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS({ ...individualMaterialWithoutConcentration, vendor: vendors[0] }),
      onMaterialChange: sandbox.spy(),
      onDeleteMaterial: sandbox.spy(),
      setFormValidState: sandbox.spy(),
      isValidMaterial: true,
      forceValidation: true,
      displayViewStock: true
    };

    beforeEach(() => {
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    });

    const renderWithProps = (props = {}) => shallow(<MaterialItem.Individual {...defaultProps} {...props} />);

    it('should not display error if forceValidation prop is false', () => {
      wrapper = renderWithProps({ forceValidation: false });
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(0);
    });

    it('should display error if amount is present but not valid', () => {
      wrapper = renderWithProps({
        material: defaultProps.material.setIn(['components', '0', 'amount'], -1)
      });
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error')))
        .dive('CostTable'))
        .to.have.length(1);
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated =>
          validated.prop('error') === 'One or more cost item rows contains an Amount or Cost that is 0 or less')
        .dive('CostTable'))
        .to.have.length(1);
    });

    it('should display error message if the cost is invalid', () => {
      wrapper = renderWithProps({
        material: defaultProps.material.setIn(['components', '0', 'cost'], -10)
      });
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error')))
        .dive('CostTable'))
        .to.have.length(1);
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated =>
          validated.prop('error') === 'One or more cost item rows contains an Amount or Cost that is 0 or less')
        .dive('CostTable'))
        .to.have.length(1);
    });

    it('should display error if container type id is not set', () => {
      wrapper = renderWithProps({
        material: defaultProps.material.set('container_type_id', '')
      });

      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(1);
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => validated.prop('error') === 'Required Field'))
        .to.have.length(1);
    });

    it('should display error if concentration is present but value is less than 0', () => {
      wrapper = renderWithProps({
        material: defaultProps.material.set('material_component_concentration', '-1:M')
      });
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated => !_.isEmpty(validated.prop('error'))))
        .to.have.length(1);
      expect(wrapper.find('IndividualForm').dive()
        .find('Validated')
        .filterWhere(validated =>
          validated.prop('error') === 'Must be greater than 0'))
        .to.have.length(1);
    });
  });
});

describe('Structureless Compound', () => {
  it('should render MoleculeViewer without errors for structureless compound in Individual MaterialItem', () => {
    const individualMaterialWithoutSMILES = { ...individualMaterial };
    individualMaterialWithoutSMILES.resource.compound.model.smiles = null;
    const props = {
      categories: categories,
      vendors: vendors,
      index: 0,
      material: Immutable.fromJS(individualMaterialWithoutSMILES),
      onMaterialChange: () => {},
      onDeleteMaterial: () => {},
      setFormValidState: () => {},
      isValidMaterial: true,
      displayViewStock: true,
    };
    const wrapper = shallow(<MaterialItem.Individual {...props} />).dive();
    expect(wrapper.find('Molecule').dive().prop('className')).to.include('structureless');
  });

  it('should render MoleculeViewer without errors for structureless compound in Group MaterialItem', () => {
    const propsWithCompound = {
      component: Immutable.fromJS({
        ...groupComponent,
        resource: {
          ...groupComponent.resource,
          kind: 'ChemicalStructure',
          purity: '90.0',
          compound: {
            model: {
              id: 'AAAQKTZKLRYKHR-UHFFFAOYSA-N',
              smiles: null
            }
          }
        }
      }),
      onDeleteComponent: () => {},
      onComponentChange: () => {},
      displayViewStock: true,
      index: 0,
      disabled: true
    };

    const wrapper = shallow(<MaterialItem.Group {...propsWithCompound} />);

    const compound = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COMPOUND');
    expect(compound.find('LabeledInput').find('MoleculeViewer').dive().prop('SMILES')).to.equal(null);
  });
});
