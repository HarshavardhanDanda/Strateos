import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import SearchFilterProperties from './SearchFilterProperties';

describe('SearchFilterProperties', () => {
  let searchProps;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (searchProps) searchProps.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render without errors', () => {
    searchProps = mount(<SearchFilterProperties title="Properties" />);
  });

  it('should render the number of properties provided', () => {
    searchProps = shallow(
      <SearchFilterProperties
        title="Properties"
        currentProperties={{
          foo: 'bar',
          fizz: 'buzz'
        }}
      />
    );

    const customPropsSet = searchProps.find('CustomPropertySet').dive();
    const editableProps = customPropsSet.find('EditableProperty');
    expect(editableProps).to.have.lengthOf(3); // 2 properties + 1 AddInplace
  });

  it('should call onChangeProperty method', () => {
    const spy = sandbox.spy(SearchFilterProperties.prototype, 'onChangeProperty');
    searchProps = shallow(
      <SearchFilterProperties
        title="Properties"
        currentProperties={{
          foo: 'bar',
          fizz: 'buzz'
        }}
        onSelectProperties={() => { }}
      />
    );
    searchProps.find('CustomPropertySet').props().onChangeProperty({ key: 'k', value: 'v' });
    expect(spy.calledOnce).to.be.true;
  });

  it('should have one CustomPropertySet when showOrgProperties is false', () => {
    searchProps = shallow(
      <SearchFilterProperties
        title="Properties"
        showOrgProperties={false}
      />
    );
    expect(searchProps.find('CustomPropertySet').length).to.equal(1);
  });

  it('should have two CustomPropertySet properties when showOrgProperties is true', () => {
    searchProps = shallow(
      <SearchFilterProperties
        title="Properties"
        showOrgProperties
        currentProperties={{
          foo: 'bar',
          fizz: 'buzz'
        }}
        orgSpecProperties={{
          foo: 'bar',
          fizz: 'buzz' }}
      />
    );
    const customPropSet = searchProps.find('CustomPropertySet');
    expect(customPropSet.length).to.equal(2);
    expect(customPropSet.at(1).props().hasCustomProperties).to.true;
    expect(searchProps.find('span').at(1).text()).to.eql('Org specific properties');
  });
});
