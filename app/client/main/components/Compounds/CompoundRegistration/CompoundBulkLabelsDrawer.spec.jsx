import React       from 'react';
import { expect }  from 'chai';
import sinon       from 'sinon';
import { shallow } from 'enzyme';
import { Button } from '@transcriptic/amino';
import CompoundBulkLabelDrawer from './CompoundsBulkLabelsDrawer';

const record = {
  id: 0,
  clogp: '1.88',
  tpsa: '2.99',
  molecular_weight: '12',
  smiles: 'CCC',
  name: 'sal',
  reference_id: '1234',
  formula: 'CH3',
  labels: [{ name: 'label1', organization_id: 'org13' }],
  inchi_key: 'asd',
  organization_id: 'asd'
};

describe('CompoundBulkLabelDrawer', () => {
  let wrapper;
  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('CompoundBulkLabelDrawer should mount', () => {
    wrapper = shallow(
      <CompoundBulkLabelDrawer
        compounds={[record]}
        selectedRows={{ 0: true }}
      />);
  });

  it('CompoundBulkLabelDrawer should contain compoundtag input', () => {
    wrapper = shallow(
      <CompoundBulkLabelDrawer
        compounds={[record]}
        selectedRows={{ 0: true }}
      />);
    expect(wrapper.find('CompoundsTagInput')).to.have.lengthOf(1);
  });

  it('CompoundBulkLabelDrawer should contain Add Labels buttons', () => {
    wrapper = shallow(
      <CompoundBulkLabelDrawer
        compounds={[record]}
        selectedRows={{ 0: true }}
      />);
    expect((wrapper.find(Button).props().children)).to.eq('Add Labels');
  });

  it('CompoundBulkLabelDrawer should set the records and close drawer', () => {
    const onBulkAddition = sinon.spy();
    wrapper = shallow(
      <CompoundBulkLabelDrawer
        compounds={[record]}
        selectedRows={{ 0: true }}
        onBulkAddition={onBulkAddition}
      />);
    wrapper.find(Button).simulate('click');
    expect(onBulkAddition.called).to.be.true;
  });

  it('CompoundBulkLabelDrawer should contain input', () => {
    wrapper = shallow(
      <CompoundBulkLabelDrawer
        compounds={[record]}
        selectedRows={{ 0: true }}
      />);

    const tagInput = wrapper.find('CompoundsTagInput').dive().find('TagInput').dive();
    expect(wrapper.find('CompoundsTagInput')).to.have.lengthOf(1);
    expect(wrapper.find('CompoundsTagInput').props().dropDown).to.be.undefined;
    expect(tagInput.find('input')).to.have.lengthOf(1);
  });
});
