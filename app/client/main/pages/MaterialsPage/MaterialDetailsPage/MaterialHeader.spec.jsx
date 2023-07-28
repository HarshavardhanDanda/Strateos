import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore from 'main/stores/SessionStore';
import MaterialHeader from './MaterialHeader';

const categories = [{ id: 'cat1', path: ['Competent Cells'] }, { id: 'cat2', path: ['Enzymes,Polymerases'] }];
const vendors = [{ id: '1', name: 'eMolecules' }, { id: 'vend1egepnzw6bwgz', name: 'Lonza' }];

const groupMaterial = Immutable.fromJS({
  vendor: { id: 'vend1egepnzw6bwgz', name: 'Lonza' },
  name: 'Adapter Ligation (LibPrep Custom)',
  supplier: { id: 'sup1fwt32z3974gr', name: 'Supplier1' },
  is_private: true,
  url: 'https://www.sigmaaldrich.com/',
  total_ordered: 3,
  material_type: 'group',
  note: 'Library Prep Custom Kit. Client supplied.',
  cost: '0.0',
  margin: 0.1,
  sku: 'SKU12345',
  tier: 'Tier 2, Ships in 1-5 business weeks',
  components: [
    {
      id: 'omat1gyj3fh6qxz8k',
      omId: 'omat1gyj3fh6qxz8k',
      omcId: 'omatc1gyj3fh6t8dgp',
      dispensable: false,
      reservable: false,
      no_of_units: 1,
      measurement_unit: 'µL',
      indivisible: false,
      reorder_point: null,
      concentration: null,
      resource: {
        organization_id: 'org13',
        acl: [],
        compound: {
          model: null,
          context: null,
          reload_needed: false,
          changing: false,
          save_needed: false
        },
        name: 'TestRTemperatureR',
        properties: {},
        kind: 'Reagent',
        storage_condition: 'cold_20',
        deleted_at: null,
        type: 'resources',
        id: 'rs1fmmngupczcfv',
        description: null,
        sensitivities: [
          'Temperature'
        ],
        design: {}
      },
      provisionable: false,
      mass_per_container: 1000,
      maximum_stock: null,
      type: 'orderable_material_components',
      volume_per_container: 1000
    }
  ],
  id: 'mat1gyj3fh6npkyh',
  categories: [{ id: 'cat19e9mgvfuu3j', path: ['Enzymes,Polymerases'] }]
});

describe('MaterialHeader', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  describe('Edit Mode', () => {
    const props = {
      material: groupMaterial,
      categories: categories,
      vendors: vendors,
      onMaterialChange: sandbox.spy(),
      disabled: false,
      isValidMaterial: true,
      setFormValidState: sandbox.spy(),
      match: { params: { materialId: 'mat1f8arbsrp92f3', mode: 'edit' } }
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialHeader.Group {...props} />);
      wrapper = hocWrapper.find('MaterialHeaderForm').dive();
    });

    it('should display private flag toggle value', () => {
      const privateToggle = wrapper.find('Toggle').filterWhere((labeledInput) => labeledInput.prop('name') === 'private-flag-toggle');

      expect(privateToggle).to.have.length(1);
      expect(privateToggle.find('Toggle').prop('value')).to.equal('on');
    });

    it('should display resource name', () => {
      const resourceName = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');

      expect(resourceName).to.have.length(1);
      expect(resourceName.find('TextInput').prop('value')).to.equal('Adapter Ligation (LibPrep Custom)');
    });

    it('should display category value', () => {
      const category = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CATEGORY');
      expect(category).to.have.length(1);
      expect(category.find('Select').prop('value')).to.equal('cat19e9mgvfuu3j');
    });

    it('should display vendor name', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR');

      expect(vendor).to.have.length(1);
      expect(vendor.find('Select').prop('value')).to.equal('Lonza');
    });

    it('should display supplier name', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER');

      expect(supplier).to.have.length(1);
      expect(supplier.find('TypeAheadInput').prop('value')).to.equal('Supplier1');
    });

    it('should display SKU', () => {
      const sku = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SKU');

      expect(sku).to.have.length(1);
      expect(sku.find('TextInput').prop('value')).to.equal('SKU12345');
    });

    it('should display vendor URL', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL');

      expect(url).to.have.length(1);
      expect(url.find('TextInput').prop('value')).to.equal('https://www.sigmaaldrich.com/');
    });

    it('should display tier', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER');

      expect(tier).to.have.length(1);
      expect(tier.find('TextInput').prop('value')).to.equal('Tier 2, Ships in 1-5 business weeks');
    });

    it('should display cost', () => {
      const cost = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COST');

      expect(cost).to.have.length(1);
      expect(cost.find('InputWithUnits').prop('value')).to.equal('0.0');
    });

    it('should display margin', () => {
      const margin = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MARGIN');

      expect(margin).to.have.length(1);
      expect(margin.find('TextInput').prop('value')).to.equal(0.1);
    });
  });

  describe('View Mode', () => {
    const props = {
      material: groupMaterial,
      categories: categories,
      vendors: vendors,
      onMaterialChange: sandbox.spy(),
      disabled: true,
      isValidMaterial: true,
      setFormValidState: sandbox.spy(),
      match: { params: { materialId: 'mat1f8arbsrp92f3' } }
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialHeader.Group {...props} />);
      wrapper = hocWrapper.find('MaterialHeaderForm').dive();
    });

    it('should display resource name', () => {
      const resourceName = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME');

      expect(resourceName).to.have.length(1);
      expect(resourceName.find('TextInput')).to.have.length(0);
      expect(resourceName.find('Popover').prop('content')).to.equal('Adapter Ligation (LibPrep Custom)');
    });

    it('should display category value', () => {
      const category = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'CATEGORY');
      expect(category).to.have.length(1);
      expect(category.find('TextBody').prop('children')).to.equal('Enzymes,Polymerases');
    });

    it('should display vendor name', () => {
      const vendor = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'VENDOR');

      expect(vendor).to.have.length(1);
      expect(vendor.find('TextBody').prop('children')).to.equal('Lonza');
    });

    it('should display supplier name', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER');

      expect(supplier).to.have.length(1);
      expect(supplier.find('TextBody').prop('children')).to.equal('Supplier1');
    });

    it('should display SKU', () => {
      const sku = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SKU');

      expect(sku).to.have.length(1);
      expect(sku.find('TextInput')).to.have.length(0);
      expect(sku.find('Popover').prop('content')).to.equal('SKU12345');
    });

    it('should display vendor URL', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL');

      expect(url).to.have.length(1);
      expect(url.find('TextInput')).to.have.length(0);
      expect(url.find('Popover').prop('content')).to.equal('https://www.sigmaaldrich.com/');
    });

    it('should display Delivery Tier', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER');

      expect(tier).to.have.length(1);
      expect(tier.find('TextInput')).to.have.length(0);
      expect(tier.find('Popover').prop('content')).to.equal('Tier 2, Ships in 1-5 business weeks');
    });

    it('should display cost', () => {
      const cost = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COST');

      expect(cost).to.have.length(1);
      expect(cost.find('TextBody').prop('children')).to.equal('$0.0');
    });

    it('should display margin', () => {
      const margin = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MARGIN');

      expect(margin).to.have.length(1);
      expect(margin.find('TextInput')).to.have.length(0);
      expect(margin.find('Popover').prop('content')).to.equal(0.1);
    });

    it('should display note', () => {
      const note = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NOTE');

      expect(note).to.have.length(1);
      expect(note.find('TextBody').prop('children')).to.equal('Library Prep Custom Kit. Client supplied.');
    });
  });

  describe('onMaterialChange', () => {
    const props = {
      material: Immutable.fromJS(groupMaterial),
      categories: categories,
      vendors: vendors,
      onMaterialChange: sandbox.spy(),
      mode: 'edit',
      isValidMaterial: true,
      setFormValidState: sandbox.spy(),
      match: { params: { materialId: 'mat1f8arbsrp92f3' } }
    };

    beforeEach(() => {
      const hocWrapper = shallow(<MaterialHeader.Group {...props} />);
      wrapper = hocWrapper.find('MaterialHeaderForm').dive();
    });

    it('should update name in material state', () => {
      const name = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NAME').find('TextInput');
      name.simulate('change', { target: { value: 'Resource Name' } });

      expect(props.onMaterialChange.calledWith(props.material.set('name', 'Resource Name'))).to.be.true;
    });

    it('should update supplier in material state', () => {
      const supplier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SUPPLIER')
        .find('TypeAheadInput');
      expect(supplier).to.have.length(1);
      supplier.prop('onSuggestedSelect')('Supplier1');
      expect(props.onMaterialChange.calledOnce);

      supplier.prop('onClear')();
      expect(props.onMaterialChange.calledWith(props.material.merge({ supplier_id: null, supplier: null }))).to.be.true;
    });

    it('should update SKU in material state', () => {
      const sku = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'SKU').find('TextInput');
      sku.simulate('change', { target: { value: 'SKU1235' } });

      expect(props.onMaterialChange.calledWith(props.material.set('sku', 'SKU1235'))).to.be.true;
    });

    it('should update URL in material state', () => {
      const url = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'URL').find('TextInput');
      url.simulate('change', { target: { value: 'http://emolecules.com' } });

      expect(props.onMaterialChange.calledWith(props.material.set('url', 'http://emolecules.com'))).to.be.true;
    });

    it('should update Delivery Tier in material state', () => {
      const tier = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'TIER').find('TextInput');
      tier.simulate('change', { target: { value: '5 Days' } });

      expect(props.onMaterialChange.calledWith(props.material.set('tier', '5 Days'))).to.be.true;
    });

    it('should update cost in material state', () => {
      const cost = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'COST').find('InputWithUnits');
      cost.prop('onChange')({ target: { value: '2.50:USD' } });

      expect(props.onMaterialChange.calledWith(props.material.set('cost', '2.50'))).to.be.true;
    });

    it('should update margin in material state', () => {
      const margin = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'MARGIN').find('TextInput');
      margin.simulate('change', { target: { value: 0.2 } });

      expect(props.onMaterialChange.calledWith(props.material.set('margin', 0.2))).to.be.true;
    });

    it('should update note in material state', () => {
      const note = wrapper.find('LabeledInput').filterWhere((labeledInput) => labeledInput.prop('label') === 'NOTE').find('TextArea');
      note.simulate('change', { target: { value: 'Some important note.' } });

      expect(props.onMaterialChange.calledWith(props.material.set('note', 'Some important note.'))).to.be.true;
    });
  });
});
