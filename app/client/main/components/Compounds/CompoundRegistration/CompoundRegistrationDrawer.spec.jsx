import React      from 'react';
import Immutable  from 'immutable';
import { expect } from 'chai';
import { mount }  from 'enzyme';

import CompoundRegistrationDrawer from './CompoundRegistrationDrawer';

describe('CsvTable pane test', () => {
  let wrapper;

  const attributeData = {
    id: 0,
    clogp: '1.88',
    tpsa: '2.99',
    molecular_weight: '12',
    smiles: 'CCC',
    name: 'sal',
    reference_id: '1234',
    formula: 'CH3',
    labels: [{
      name: 'label1',
      organization_id: 'org13'
    }],
    inchi_key: 'asd',
    organization_id: 'asd'
  };

  it('compound edit form should render', () => {
    wrapper = mount(
      <CompoundRegistrationDrawer
        compound={Immutable.Map(attributeData)}
        registeredLabels={Immutable.Map()}
        records={[attributeData]}
        setRecords={() => {}}
        duplicates={
          {
            get: () => [{
              name: attributeData.name,
              reference_id: attributeData.reference_id,
              labels: attributeData.labels
            }]
          }}
        setDuplicates={() => {}}
        compoundValidations={new Map([['CCC', ['Valid']]])}
        setCompoundValidations={() => {}}
        closeDrawer={() => {}}
      />);
    expect(wrapper.find('CompoundEditForm')).to.have.length(1);
  });

  it('it should render correct values in compound view', () => {
    wrapper = mount(
      <CompoundRegistrationDrawer
        compound={Immutable.Map(attributeData)}
        registeredLabels={Immutable.Map()}
        records={[attributeData]}
        setRecords={() => {}}
        duplicates={
          {
            get: () => [{
              name: attributeData.name,
              reference_id: attributeData.reference_id,
              labels: attributeData.labels
            }]
          }}
        setDuplicates={() => {}}
        compoundValidations={new Map([['CCC', ['Valid']]])}
        setCompoundValidations={() => {}}
        closeDrawer={() => {}}
      />);
    expect(wrapper.find('CompoundEditForm').props().compoundName).to.be.equal(attributeData.name);
    expect(wrapper.find('CompoundEditForm').props().compoundReferenceId).to.be.equal(attributeData.reference_id);
    expect(wrapper.find('CompoundEditForm').props().compound.get('labels')[0].name).to.be.equal('label1');
  });
});
