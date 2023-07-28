import Immutable from 'immutable';

const groupMaterial = Immutable.fromJS({
  id: 'mat1gzyevs8uqh7x',
  is_private: false,
  material_type: 'group',
  name: 'BetaPharma',
  material_components: [
    {
      id: 'matc1gzyevs8z9ar3',
      material_id: 'mat1gzyevs8uqh7x',
      resource: {
        id: 'res123',
        compound: {
          id: 'cmpl1g5x7tsydpeda',
          attributes: {
            organization_id: null,
            smiles: 'CC(C)Cc1ccc([C@@H](C)C(=O)O)cc1'
          }
        }
      }
    }
  ],
  orderable_materials: [
    {
      id: 'omat1gzyevs8wywfz',
      margin: 0.1,
      orderable_material_components: [
        {
          measurement_unit: 'mg',
          mass_per_container: 500,
          volume_per_container: 0,
          id: 'omatc1gzyevs8z9ar4'
        }
      ]
    }
  ],
  supplier: {
    name: 'BetaPharma',
  },
  vendor: {
    name: 'eMolecules',
  }

});

const kitOrderActions = Immutable.fromJS({
  user: {
    name: 'test_name',
  },
  name: 'BetaPharma',
  lab: {
    name: 'Menlo Park',
  },
  count: 1,
  state: 'PENDING',
  note: 'Test',
  tracking_code: '123Test',
  checked_in_at: null,
  id: '123',
  orderable_material: {
    price: 554,
    margin: 0.1,
    sku: 'pHSG298-PC',
    tier: 'Tier 3, Ships within 4 weeks',
    id: 'omat1gzyevs8wywfz',
    material: {
      name: 'BetaPharma',
      is_private: false,
      material_type: 'individual',
      id: 'mat1gzyevs8uqh7x'
    },
    orderable_material_components: [
      {
        no_of_units: 1,
        measurement_unit: 'mg',
        mass_per_container: 500,
        volume_per_container: 0,
        id: 'omatc1gzyevs8z9ar4'
      }
    ],
    count: 1
  }
});

const individualMaterials = Immutable.fromJS([{
  vendor: { name: 'eMolecules' },
  name: 'BetaPharma',
  supplier: { name: 'BetaPharma' },
  material_components: [{
    resource: {
      compound: {
        model: {
          organization_id: null,
          smiles: 'CCCCC'
        }
      }
    },
    orderable_material_components: [{
      no_of_units: 1,
      measurement_unit: 'mg',
      mass_per_container: 500,
      volume_per_container: 0,
      id: 'omatc1gzyevs8z9ar4'
    }]
  }],
  is_private: false,
  material_type: 'individual',
  id: 'omat1gzyevs8uqh7x',
  type: 'orderable_materials',
  material_id: 'mat1gzyevs8uqh7x',
  orderable_materials: [{
    id: 'omat1gzyevs8uqh7x',
    type: 'orderable_materials',
    tier: 'Tier 3, Ships within 4 weeks',
    material: {
      name: 'BetaPharma',
      is_private: false,
      material_type: 'individual',
      id: 'mat1gzyevs8uqh7x'
    },
    price: 554,
    count: 1,
    orderable_material_components: [{
      measurement_unit: 'mg',
      mass_per_container: 500,
      volume_per_container: 0,
      id: 'omatc1gzyevs8z9ar4'
    }],
    sku: '436500315'
  }]
}]);

const groupMaterials = Immutable.fromJS([{
  vendor: {
    name: 'eMolecules'
  },
  name: 'BetaPharma',
  supplier: {
    name: 'BetaPharma'
  },
  material_components: [{
    resource: {
      compound: {
        model: {
          organization_id: null,
          smiles: 'CCCCC'
        }
      }
    },
    orderable_material_components: [{
      no_of_units: 1,
      measurement_unit: 'mg',
      mass_per_container: 500,
      volume_per_container: 0,
      id: 'omatc1gzyevs8z9ar4'
    }]
  }],
  is_private: false,
  material_type: 'group',
  id: 'omat1gzyevs8uqh7x',
  type: 'orderable_materials',
  material_id: 'mat1gzyevs8uqh7x',
  orderable_materials: [{
    id: 'omat1gzyevs8uqh7x',
    type: 'orderable_materials',
    tier: 'Tier 3, Ships within 4 weeks',
    material: {
      name: 'BetaPharma',
      is_private: false,
      material_type: 'group',
      id: 'mat1gzyevs8uqh7x'
    },
    price: 554,
    count: 1,
    orderable_material_components: [{
      measurement_unit: 'mg',
      mass_per_container: 500,
      volume_per_container: 0,
      id: 'omat1gzyevs8uqh7x'
    }],
    sku: '436500315'
  }]
}]);

const eMoleculesMaterials = Immutable.fromJS([{
  molecularProperties: {
    weight: 107.156,
    formula: 'C7H9N'
  },
  smiles: 'NCc1ccccc1',
  supplier: {
    tier: 2,
    price: 77,
    estimatedCost: '$15.40/g',
    quantity: 5,
    name: 'Toronto Research Chemicals',
    units: 'g',
    currency: 'USD',
    catalog: {
      number: 'B224860',
      type: 'Tier 2, Shipped within 2-10 business days'
    },
    additionalDetails: {
      mfcdNumber: '',
      status: 'preferred'
    },
    id: '2035',
    sku: '483383085'
  },
  compound_id: 'cff440d3-79df-4e33-920d-a9571ec924ea',
  count: '2',
  chemicalNames: ['Phenyl-Methanamine'],
  id: 'NCc1ccccc1_2035_483383085_77_USD',
  structureUrl: 'https://strateos-bb.emolecules.com/cgi-bin/more?vid=480615',
  casNumber: '100-46-9'
}, {
  molecularProperties: {
    weight: 107.156,
    formula: 'C7H9N'
  },
  smiles: 'NCc1ccccc1',
  supplier: {
    tier: 4,
    price: 33,
    estimatedCost: '$15.40/g',
    quantity: 15,
    name: 'Toronto Research Chemicals',
    units: 'ml',
    currency: 'USD',
    catalog: {
      number: 'B224860',
      type: 'Tier 2, Shipped within 2-10 business days'
    },
    additionalDetails: {
      mfcdNumber: '',
      status: 'preferred'
    },
    id: '2035',
    sku: '483383085'
  },
  compound_id: 'cff440d3-79df-4e33-920d-a9571ec924ea',
  count: '5',
  chemicalNames: ['Phenyl-Methanamine'],
  id: 'NCc1ccccc1_2035_483383085_77_USD',
  structureUrl: 'https://strateos-bb.emolecules.com/cgi-bin/more?vid=480615',
  casNumber: '100-46-9'
}]);

export { groupMaterial, kitOrderActions, individualMaterials, groupMaterials, eMoleculesMaterials };
