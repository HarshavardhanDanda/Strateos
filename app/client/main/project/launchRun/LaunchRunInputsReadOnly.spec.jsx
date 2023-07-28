import React               from 'react';
import { expect }          from 'chai';
import { shallow }         from 'enzyme';
import LaunchRunInputsReadOnly, { Group } from './LaunchRunInputsReadOnly';

describe('Group', () => {
  let wrapper;

  const props = {
    name: 'Endproduct',
    typeDesc:  {
      label: 'End Product',
      type: 'group',
      inputs: {
        compound: {
          type: 'compound'
        }
      }
    },
    value: {}
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('Group should render InfoHeader', () => {
    wrapper = shallow(<Group {...props} />);
    expect(wrapper.find('InfoHeader')).to.have.length(1);
  });

  it('Group should render label if present', () => {
    wrapper = shallow(<Group {...props} />).find('InfoHeader').dive();
    expect(wrapper.text()).to.equal('End Product');
  });

  it('Group should render name if label not present', () => {
    props.typeDesc.label = undefined;
    wrapper = shallow(<Group {...props} />).find('InfoHeader').dive();
    expect(wrapper.text()).to.equal(props.name);
  });

  it('Group should render inputs', () => {
    wrapper = shallow(<Group {...props} />);
    expect(wrapper.find('LaunchRunInputsReadOnly')).to.have.length(1);
  });
});

describe('LaunchRunInputsReadOnly should display component based on type', () => {

  let wrapper;

  const props = {
    showErrors: false,
    onChange: () => {},

    isRoot: true,
    test_mode: false
  };

  afterEach(() => {
    wrapper.unmount();
  });

  const compoundInput = {
    format: 'Daylight Canonical SMILES',
    value: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O'
  };

  it('type container should render container segment', () => {
    props.inputTypes = {
      container: { type: 'container', label: 'Container', description: 'Container' }
    };
    props.inputs = { container: 'a1', volume: '10:milliliter', addition_order: 3 };

    wrapper = shallow(<LaunchRunInputsReadOnly {...props} />);
    expect(wrapper.find('LabeledInput').dive().text()).include('a1');
  });

  it('type compound should render CompoundInput', () => {
    const inputTypes = {
      product: { type: 'compound', message: 'Select A compound' }
    };
    props.inputs = { product: compoundInput };
    wrapper = shallow(<LaunchRunInputsReadOnly {...{ ...props, inputTypes }} />);
    expect(wrapper.find('CompoundInput')).to.have.length(1);
  });

  it('type undefined should render empty', () => {
    const inputTypes = {
      undefined: {  }
    };
    wrapper = shallow(<LaunchRunInputsReadOnly {...{ ...props, inputTypes }} />);
    expect(wrapper.text()).to.equal('');
  });
});
