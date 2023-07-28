import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import SearchFilterCustomProperties from './SearchFilterCustomProperties';

describe('SearchFilterProperties', () => {
  let searchProps;
  const sandbox = sinon.createSandbox();

  const properties =
      {
        data: [
          {
            attributes: {
              config_definition: {
                type: 'choice',
                label: 'OTL Project',
                default: 'Technology Development ',
                options: [
                  {
                    value: 'Technology Development',
                    name: 'Technology Development'
                  },
                  {
                    value: 'General Discovery',
                    name: 'General Discovery'
                  },
                  {
                    value: 'Mouse Phenotyping',
                    name: 'Mouse Phenotyping'
                  },
                  {
                    value: 'General Screening',
                    name: 'General Screening'
                  },
                  {
                    value: 'Other',
                    name: 'Other'
                  }
                ],
              },
              key: 'choice'
            },
          },
          {
            attributes: {
              config_definition: {
                label: 'String Label ',
                type: 'string',
                default: '',
                validation_regexp: '',
                editable: true,
                unique: false,
              },
              key: 'string_name'
            },
          },
          {
            attributes: {
              config_definition: {
                label: 'Integer Label',
                type: 'integer',
                default: '',
                validation_regexp: '',
                editable: true,
                unique: false,
              },
              key: 'integer_name'
            },
          },
          {
            attributes: {
              config_definition: {
                label: 'Decimal Label ',
                type: 'decimal',
                default: '',
                validation_regexp: '',
                editable: true,
                unique: false,
              },
              key: 'decimal_name'
            },
          },
          {
            attributes: {
              config_definition: {
                type: 'multi-choice',
                label: 'OTL Project',
                default: 'Technology Development ',
                options: [
                  {
                    value: 'Technology Development',
                    name: 'Technology Development'
                  },
                  {
                    value: 'General Discovery',
                    name: 'General Discovery'
                  },
                  {
                    value: 'Mouse Phenotyping',
                    name: 'Mouse Phenotyping'
                  },
                  {
                    value: 'General Screening',
                    name: 'General Screening'
                  },
                  {
                    value: 'Other',
                    name: 'Other'
                  }
                ],
              },
              key: 'multi-choice'
            }
          }],
        searchProperties: { 'OTL Project': 'Internal' }
      };

  afterEach(() => {
    if (searchProps) searchProps.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render without errors', () => {
    searchProps = mount(<SearchFilterCustomProperties properties={properties} />);
  });

  it('should render the number of properties provided', () => {
    searchProps = shallow(
      <SearchFilterCustomProperties
        title="Properties"
        properties={properties}
      />
    );

    const customPropsSet = searchProps.find('CustomPropertySet').dive();
    const editableProps = customPropsSet.find('EditableProperty');
    expect(editableProps).to.have.lengthOf(5);
  });

  it('should call onChangeProperty method', () => {
    const spy = sandbox.spy(SearchFilterCustomProperties.prototype, 'onChangeProperty');
    searchProps = shallow(
      <SearchFilterCustomProperties
        title="Properties"
        onSelectProperties={() => { }}
        properties={properties}
      />
    );
    searchProps.find('CustomPropertySet').props().onChangeProperty('k', 'v');
    expect(spy.calledOnce).to.be.true;
  });
});
