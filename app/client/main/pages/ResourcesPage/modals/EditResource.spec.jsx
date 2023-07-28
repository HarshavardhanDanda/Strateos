import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { LabeledInput, Tooltip, MoleculeViewer } from '@transcriptic/amino';
import EditResource from 'main/pages/ResourcesPage/modals/EditResource';
import { CopyToClipboard } from 'react-copy-to-clipboard';

describe('Edit Resource', () => {
  let wrapper;
  const updateStub = () => {};
  const getEditResourceStub = () => {};

  const resource = {
    purity: 12,
    organization_id: 'org13',
    name: 'Benzoic acid',
    properties: {},
    kind: 'ChemicalStructure',
    storage_condition: 'cold_4',
    id: 'rs1g4zwvvu7wd9v',
    sensitivities: [],
    compound: {
      cas_number: null,
      clogp: '3.0732',
      created_at: '2021-08-03T10:08:01.548-07:00',
      exact_molecular_weight: '206.13068',
      formula: 'C13H18O2',
      id: 'HEFNNWSXXWATRW-UHFFFAOYSA-N',
      mol: 'CC(C)Cc1ccc(C(C)C(=O)O)cc1',
      molecular_weight: '206.28',
      oxidizer: null,
      smiles: 'CC(C)Cc1ccc(C(C)C(=O)O)cc1',
      tpsa: '37.3',
      updated_at: '2021-08-03T10:08:01.548-07:00',
      water_reactive_electrophile: null,
      water_reactive_nucleophile: null,
      name: 'test-compound'
    }

  };

  const resource1 = {
    purity: 12,
    organization_id: 'org13',
    name: 'Benzoic acid',
    properties: {},
    kind: 'ChemicalStructure',
    storage_condition: 'cold_4',
    id: 'rs1g4zwvvu7wd9v',
    sensitivities: [],
    compound: {
      smiles: 'CC(C)Cc1ccc(C(C)C(=O)O)cc12',
      created_at: '2021-08-03T10:08:01.548-07:00',
      formula: 'C13H18O2',
      id: 'HEFNNWSXXWATRW-UHFFFAOYSA-N',
      name: null,
      public_compound_name: 'public test compound'
    }

  };

  const structurelessResource = {
    compound: {
      id: 'cmpl1eunkt55cz674',
      type: 'compounds',
      name: 'structureless compound',
      reference_id: 'sc',
      organization_id: 'org06',
      created_by: 'u19ahey7f2vyx',
      created_at: '2021-11-30T03:21:58.628-07:00',
      properties: {},
      search_score: null,
      clogp: null,
      formula: null,
      inchi: null,
      inchi_key: null,
      molecular_weight: null,
      exact_molecular_weight: null,
      smiles: null,
      cas_number: null,
      mfcd_number: null,
      pub_chem_id: null,
      tpsa: null,
    },
    purity: 12,
    organization_id: 'org13',
    name: 'Benzoic acid',
    properties: {},
    kind: 'ChemicalStructure',
    storage_condition: 'cold_4',
    id: 'rs1g4zwvvu7wd9v',
    sensitivities: [],
  };

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  const shallowRender = (resource) => (
    shallow(<EditResource
      getEditResource={getEditResourceStub}
      update={updateStub}
      resource={resource}
    />)
  );

  it('should display resource id field with copy to clipboard icon', () => {
    wrapper = shallowRender(resource);
    const resourceId = wrapper.find(LabeledInput)
      .filterWhere((labeledInput) => labeledInput.prop('label') === 'RESOURCE ID');
    expect(resourceId).to.have.length(1);
    expect(resourceId.find(LabeledInput).find('p').text()).to.equal('rs1g4zwvvu7wd9v');
    expect(resourceId.find(LabeledInput).find(Tooltip).find(CopyToClipboard)).to.have.length(1);
  });

  it('should send properties and name in Molecule Viewer', () => {
    wrapper = shallowRender(resource);
    const compound = resource.compound;
    const moleculeViewer = wrapper.find(MoleculeViewer);
    const expectedProperties = {
      formula: compound.formula,
      molecular_weight: compound.molecular_weight,
      clogp: compound.clogp,
      tpsa: compound.tpsa,
      exact_molecular_weight: compound.exact_molecular_weight,
      cas_number: compound.cas_number
    };
    expect(moleculeViewer.prop('properties')).to.deep.equal(expectedProperties);
    expect(moleculeViewer.prop('name')).to.equal(compound.name);
  });

  it('should show the public_compound_name if the name is not present', () => {
    wrapper = shallowRender(resource1);
    const compound = resource1.compound;
    const moleculeViewer = wrapper.find(MoleculeViewer);
    expect(moleculeViewer.prop('name')).to.equal(compound.public_compound_name);
  });

  it('should render MoleculeViewer without error for structureless compound', () => {
    wrapper = shallowRender(structurelessResource);
    expect(wrapper.find('MoleculeViewer').dive().prop('SMILES')).to.equal(null);
  });
});
