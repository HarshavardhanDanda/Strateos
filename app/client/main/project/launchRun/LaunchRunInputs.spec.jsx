import React               from 'react';
import { expect }          from 'chai';
import { shallow }         from 'enzyme';
import LaunchRunInputs, { Group } from './LaunchRunInputs';

describe('LaunchRunInputs should display component based on type', () => {

  let wrapper;

  const props = {
    showErrors: false,
    onChange: () => {},

    isRoot: true,
    test_mode: false,
    csvInputs: { reagent_details: { name: {} } }
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('type container should render ContainersSelectInput', () => {
    props.inputTypes = {
      container: { type: 'container', label: 'Container', description: 'Container' }
    };
    props.inputs = { container: undefined, volume: '10:milliliter', addition_order: 3 };

    wrapper = shallow(<LaunchRunInputs {...props} />);
    expect(wrapper.find('ContainerSelectInput')).to.have.length(1);
  });

  it('top level container should render ContainerComposition', () => {
    props.inputTypes = {
      container: {
        type: 'container',
        label: 'Container',
        description: 'Container',
        show_compounds: true
      }
    };
    props.inputs = { container: '', volume: '10:milliliter', addition_order: 3 };

    wrapper = shallow(<LaunchRunInputs {...props} />);
    expect(wrapper.find('ContainerComposition')).to.have.length(1);
  });

  it('type integer should render TextInput', () => {
    const inputTypes = {
      integer: { type: 'integer', label: 'Addition Order', description: 'Addition Order' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('TextInput')).to.have.length(1);
    expect(wrapper.find('TextInput').props().placeholder).to.equal('(integer)');
  });

  it('type decimal should render TextInput', () => {
    const inputTypes = {
      decimal: { type: 'decimal', label: 'Addition Order', description: 'Addition Order' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('TextInput')).to.have.length(1);
    expect(wrapper.find('TextInput').props().placeholder).to.equal('(decimal)');
  });

  it('type string should render TextInput', () => {
    const inputTypes = {
      string: { type: 'string', label: 'Description', description: 'Description' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('TextInput')).to.have.length(1);
  });

  it('type aliquot should render AliquotSelectInput', () => {
    const inputTypes = {
      aliquot: { type: 'aliquot', label: 'Aliquot', description: 'Aliquot' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('AliquotSelectInput')).to.have.length(1);
  });

  it('type aliquot+ should render AliquotsSelectInput', () => {
    const inputTypes = {
      aliquot_: { type: 'aliquot+', label: 'Aliquot+', description: 'Aliquot+' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('AliquotsSelectInput')).to.have.length(1);
  });

  it('type aliquot++ should render AliquotGroups', () => {
    const inputTypes = {
      aliquot__: { type: 'aliquot++', label: 'Aliquot++', description: 'Aliquot++' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('AliquotGroups')).to.have.length(1);
  });

  it('type csv or csv-table should render CSVFileUpload', () => {
    const inputTypes = {
      csv: { type: 'csv', template: { label: 'Csv', header: [], rows: [[]] }, description: 'Csv' },
      csv_table: { type: 'csv-table', template: { label: 'Csv-table', header: [], rows: [[]] }, description: 'Csv-table' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('CSVFileUpload')).to.have.length(2);
  });

  it('type bool should render input of type checkbox', () => {
    const inputTypes = {
      checkbox: { type: 'bool',  label: 'bool', description: 'bool' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('input')).to.have.length(1);
    expect(wrapper.find('input').props().type).to.equal('checkbox');
  });

  it('type group should render Group', () => {
    const inputTypes = {
      reagent_details: { type: 'group', label: 'Group', description: 'Group' }
    };
    const inputs = { reagent_details: { name: {} } };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes, inputs }} />);
    expect(wrapper.find('Group')).to.have.length(1);
  });

  it('type group with show_compounds should render ContainerComposition', () => {
    const inputTypes = {
      reagent_details: {
        type: 'group',
        label: 'Reagents',
        inputs: {
          container: { type: 'container', label: 'Container', description: 'Container', show_compounds: 'true' }
        }
      }
    };

    props.inputs = { reagent_details: { container: 'ct1ecdxa54kaq3w' } };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('Group').dive().find('ContainerComposition')).to.have.length(1);
  });

  it('type group  with show_compounds should not render ContainerComposition if data is not selected', () => {
    const inputTypes = {
      reagent_details: {
        type: 'group',
        label: 'Reagents',
        inputs: {
          container: { type: 'container', label: 'Container', description: 'Container', show_compounds: 'true' }
        }
      }
    };

    props.inputs = { reagent_details: { container: undefined } };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('Group').dive().find('ContainerComposition')).to.have.length(0);
  });

  it('type group+ should render MultiGroup', () => {
    const inputTypes = {
      group_: { type: 'group+', label: 'Group+', description: 'Group+', inputs: {} }
    };
    const inputs = { group_: [{}] };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes, inputs }} />);
    expect(wrapper.find('MultiGroup')).to.have.length(1);
  });

  it('type group+ with show_compounds should render ContainerComposition', () => {
    const inputTypes = {
      reagent_details: {
        type: 'group+',
        label: 'Reagents',
        inputs: {
          container: { type: 'container', label: 'Container', description: 'Container', show_compounds: 'true' }
        },
      }
    };

    props.inputs = { reagent_details: [{ container: 'ct1ecdxa54kaq3w' }, { container: 'ct1ecdxa54kaq3x' }] };
    const csvInputs = { reagent_details: [] };

    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes, csvInputs }} />).find('MultiGroup').dive();
    expect(wrapper.find('ContainerComposition')).to.have.length(2);
    expect(wrapper.find('ContainerComposition').at(0).props().id).to.equal('ct1ecdxa54kaq3w');
    expect(wrapper.find('ContainerComposition').at(1).props().id).to.equal('ct1ecdxa54kaq3x');

  });

  it('type group+  with show_compounds should not render ContainerComposition if data is not selected', () => {
    const inputTypes = {
      reagent_details: {
        type: 'group+',
        label: 'Reagents',
        inputs: {
          container: { type: 'container', label: 'Container', description: 'Container', show_compounds: 'true' }
        }
      }
    };

    props.inputs = { reagent_details: [{ container: undefined }, { container: 'ct1ecdxa54kaq3w' }] };
    const csvInputs = { reagent_details: [] };

    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes, csvInputs }} />).find('MultiGroup').dive();
    expect(wrapper.find('ContainerComposition')).to.have.length(1);
    expect(wrapper.find('ContainerComposition').at(0).props().id).to.equal('ct1ecdxa54kaq3w');
  });

  it('type choice should render Select', () => {
    const inputTypes = {
      choice: { type: 'choice', label: 'Choice', description: 'Choice' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('Select')).to.have.length(1);
  });

  it('type multi-select should render Select', () => {
    const inputTypes = {
      multi_select: { type: 'multi-select',
        label: 'Multi-Select',
        default: ['Technology Development'],
        options: ['Technology Development', 'Other'] }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('MultiSelect')).to.have.length(1);
  });

  it('type thermocycle should render ThermocycleParameters', () => {
    const inputTypes = {
      thermocycle: { type: 'thermocycle', label: 'thermocycle', description: 'thermocycle' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('ThermocycleParameters')).to.have.length(1);
  });

  it('type choice should render Select', () => {
    const inputTypes = {
      choice: { type: 'choice', label: 'Choice', description: 'Choice' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('Select')).to.have.length(1);
  });

  it('unit types should render InputWithUnits', () => {
    const inputTypes = {
      amount_concentration: {
        type: 'amount_concentration', label: 'concentration(molar)', description: 'concentration(molar)'
      },
      frequency: { type: 'frequency', label: 'frequency', description: 'frequency' },
      length: { type: 'length', label: 'length', description: 'length' },
      mass: { type: 'mass', label: 'mass', description: 'mass' },
      mass_concentration: {
        type: 'mass_concentration', label: 'concentration(mass)', description: 'concentration(mass)'
      },
      temperature: { type: 'temperature', label: 'temperature', description: 'temperature' },
      time: { type: 'time', label: 'time', description: 'time' },
      volume: { type: 'volume', label: 'Volume', description: 'Volume' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('InputWithUnits')).to.have.length(8);
  });

  it('type compound should render CompoundInput', () => {
    const inputTypes = {
      product: { type: 'compound', message: 'Select A compound' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.find('CompoundInput')).to.have.length(1);
  });

  it('type undefined should render empty', () => {
    const inputTypes = {
      undefined: {  }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);
    expect(wrapper.text()).to.equal('');
  });

  it('should disable sentence casing and render the LabeledInput correctly', () => {
    const inputTypes = {
      aliquot: { type: 'aliquot', label: 'DNA_sources', description: 'DNA Sources' }
    };
    wrapper = shallow(<LaunchRunInputs {...{ ...props, inputTypes }} />);

    const labeledInput = wrapper.find('LabeledInput');
    expect(labeledInput.dive().find('label').text()).equals('DNA_sources');
  });
});

describe('Group', () => {
  let wrapper;

  const props = {
    name: 'finalproduct',
    typeDesc:  {
      label: 'Final Product',
      type: 'group',
      inputs: {
        compound: {
          type: 'compound'
        }
      },
    },
    value: {},
    csvValue: {},
    updateValue: () => {},
    showErrors: false
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
    expect(wrapper.text()).to.equal('Final Product');
  });

  it('Group should render name if label not present', () => {
    props.typeDesc.label = undefined;
    wrapper = shallow(<Group {...props} />).find('InfoHeader').dive();
    expect(wrapper.text()).to.equal(props.name);
  });

  it(' Group should render inputs', () => {
    wrapper = shallow(<Group {...props} />);
    expect(wrapper.find('LaunchRunInputs')).to.have.length(1);
  });
});
