import React                       from 'react';
import { expect }                  from 'chai';
import sinon                       from 'sinon';
import { fromJS }                  from 'immutable';

import { LabeledInput, TagInput, TextInput } from '@transcriptic/amino';
import CompoundEditForm            from './CompoundEditForm';

const testCompound = fromJS({
  formula: 'C33H35FN2O5',
  molecular_weight: 558.65,
  exact_molecular_weight: 558.612345,
  organization_id: 'org13',
  created_at: '2019-06-21T16:02:44.543-07:00',
  tpsa: 111.79,
  smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
  name: 'faketest',
  created_by: 'u17e2q4752a4r',
  clogp: 6.31360000000001,
  properties: {},
  labels: [{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }],
  type: 'compounds',
  id: 'cmpl1d9e6adftu9fy',
  inchi_key: 'XUKUURHRXDUEBC-UHFFFAOYSA-N',
  reference_id: 'myrefid',
  external_system_id: 'ext4',
  flammable: true
});

describe('CompoundEditForm', () => {

  let wrapper;
  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  function mount() {
    const changeSpy = sinon.spy();
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        compoundExternalId={testCompound.get('external_system_id')}
        onChange={changeSpy}
        hazardFlags={['Flammable']}
      />
    );
    return { changeSpy };
  }

  it('CompoundEditForm should mount', () => {
    mount();
  });

  it('CompoundEditForm should add label', () => {
    const { changeSpy } = mount();
    wrapper.instance().addLabel('foo');
    expect(changeSpy.lastCall.args[0].compoundLabels.map(label => label.name)).to.contain('foo');
  });

  it('CompoundEditForm should remove label', () => {
    const { changeSpy } = mount();
    const label_to_remove = testCompound.get('labels').toJS()[0];
    wrapper.instance().removeLabel(label_to_remove);
    expect(changeSpy.lastCall.args[0].compoundLabels.map(label => label.name)).not.to.contain(label_to_remove.name);
  });

  it('CompoundEditForm should add hazard Flag', () => {
    const { changeSpy } = mount();
    wrapper.instance().addHazard('Unknown');
    expect(changeSpy.lastCall.args[0].hazardFlags).to.contain('Unknown');
  });

  it('CompoundEditForm should not add unrecognized hazard flag', () => {
    const { changeSpy } = mount();
    wrapper.instance().addHazard('xxx');
    expect(changeSpy.lastCall).to.be.null;
  });

  it('CompoundEditForm should remove hazard flag', () => {
    const { changeSpy } = mount();
    const flagToRemove = 'Flammable';
    wrapper.instance().removeHazard(flagToRemove);
    expect(changeSpy.lastCall.args[0].hazardFlags).not.to.contain(flagToRemove);
  });

  it('should render hazard flags input if admin', () => {
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        onChange={() => {}}
        hazardFlags={['Flammable']}
        canEditHazards
      />
    );

    expect(wrapper.find('TagInput').length).to.equal(2);
  });

  it('should not render hazard flags input if not admin', () => {
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        onChange={() => {}}
        hazardFlags={['Flammable']}
      />
    );

    expect(wrapper.find('TagInput').length).to.equal(1);
  });

  it('CompoundEditForm should contain dropdown and corresponding values when dropdown prop is passed', () => {

    const edit = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        onChange={() => {}}
        dropDown={{ compoundNames: ['fakename1', 'fakename2'], compoundReferenceIds: ['123', '12345'] }}
        canEditCompound
      />
    );
    expect(edit.find('Select').length).to.eq(2);

    const compoundNameOptions = edit.find('Select').first();
    const compoundReferenceIdOptions = edit.find('Select').last();

    expect(compoundNameOptions.prop('options')[0].value).to.be.eq('fakename1');
    expect(compoundNameOptions.prop('options')[1].value).to.be.eq('fakename2');
    expect(compoundReferenceIdOptions.prop('options')[0].value).to.be.eq('123');
    expect(compoundReferenceIdOptions.prop('options')[1].value).to.be.eq('12345');

  });

  it('Users with canEditCompound permission can edit compound', () => {
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        compoundExternalId={testCompound.get('external_system_id')}
        onChange={() => {}}
        hazardFlags={['Flammable']}
        canEditCompound
        canEditExternalSystemId
        canEditHazards
      />
    );

    const labeledInputs = wrapper.find(LabeledInput);

    expect(labeledInputs.length).to.equal(5);
    expect(labeledInputs.at(1).find(TextInput).length).to.equal(1);
    expect(labeledInputs.at(1).find(TextInput).props().value).to.equal(testCompound.get('name'));
    expect(labeledInputs.at(2).find(TextInput).props().value).to.equal(testCompound.get('reference_id'));

    expect(labeledInputs.at(3).find(TagInput).length).to.equal(1);
    expect(labeledInputs.at(3).find(TagInput).props().onCreate).not.to.be.undefined;
    expect(labeledInputs.at(4).find(TextInput).props().value).to.equal(testCompound.get('external_system_id'));
  });

  it('Users without canEditCompound permission cannot edit compound', () => {
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        compoundExternalId={testCompound.get('external_system_id')}
        onChange={() => {}}
        hazardFlags={['Flammable']}
        canEditHazards
      />
    );

    const labeledInputs = wrapper.find(LabeledInput);

    expect(labeledInputs.length).to.equal(4);
    expect(labeledInputs.at(1).find(TextInput).length).to.equal(0);
    expect(labeledInputs.at(2).find(TextInput).length).to.equal(0);

    expect(labeledInputs.at(3).find(TagInput).length).to.equal(1);
    expect(labeledInputs.at(3).find(TagInput).props().onCreate).to.be.undefined;
    expect(labeledInputs.at(4).find(TextInput).length).to.equal(0);
  });

  it('should return correct CompoundTagIcon for given tags', () => {
    const labels = [{
      id: 'lbl1',
      name: 'label-1',
      organization_id: 'org13'
    },
    {
      id: 'lbl2',
      name: 'label-2',
      organization_id: 'org13'
    }];
    wrapper = enzyme.shallow(
      <CompoundEditForm
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        compoundExternalId={testCompound.get('external_system_id')}
        onChange={() => {}}
        hazardFlags={['Flammable']}
        canEditCompound
      />
    );

    const tags = wrapper.instance().renderCompoundLabel(labels);
    expect(tags.length).to.equal(2);
    expect(tags[0].type).to.equal('div');
    expect(tags[1].type).to.equal('div');
    expect(tags[0].key).to.equal('lbl1');
    expect(tags[1].key).to.equal('lbl2');
  });
});
