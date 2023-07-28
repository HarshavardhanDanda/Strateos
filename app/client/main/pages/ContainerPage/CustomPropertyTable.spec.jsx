import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import { TableLayout } from '@transcriptic/amino';
import properties from 'main/test/container/customProperties.json';
import mockConfigs from 'main/test/container/customPropertiesConfigs.json';
import EditableProperty from 'main/components/EditableProperty';
import CustomPropertyTable from './CustomPropertyTable';

const customProperties = Immutable.fromJS(properties).pop(); // last one belongs to another container
const customPropertiesConfigs = Immutable.fromJS(mockConfigs);

const props = {
  customProperties,
  customPropertiesConfigs,
  onSaveCustomProperty: () => {}
};

describe('CustomPropertyTable', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  const { Block, Header, HeaderCell, Body, BodyCell, Row } = TableLayout;

  afterEach(() => {
    if (sandbox) {
      sandbox.restore();
    }

    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('renders without error', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);
    const tableBlock = wrapper.find(Block);
    expect(tableBlock.length).to.equal(1);
  });

  it('should render table header when data is passed', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);
    const header = wrapper.find(Header);
    expect(header.length).to.equal(1);
    expect(header.dive().find(HeaderCell).length).to.equal(2);
    expect(header.dive().find(HeaderCell).at(0).dive()
      .text()).to.equal('Property');
    expect(header.dive().find(HeaderCell).at(1).dive()
      .text()).to.equal('Value');
  });

  it('should render table row when data is passed', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);

    const tableBody = wrapper.find(Body);
    expect(tableBody.length).to.equal(1);
    const tableRows = tableBody.find(Row);
    expect(tableRows.length).to.equal(5);

    const firstRowCells = tableRows.at(0).find(BodyCell);
    expect(firstRowCells.at(0).dive().text()).to.equal('Project id');
    expect(firstRowCells.at(1).find(EditableProperty).props().value).to.equal('Project beta');

    const secondRowCells = tableRows.at(1).find(BodyCell);
    expect(secondRowCells.at(0).dive().text()).to.equal('Mosaic Request Id');
    expect(secondRowCells.at(1).find(EditableProperty).props().value).to.equal('210');

    const thirdRowCells = tableRows.at(2).find(BodyCell);
    expect(thirdRowCells.at(0).dive().text()).to.equal('Operation category');
    expect(thirdRowCells.at(1).find(EditableProperty).props().value.toString()).to.equal('Mouse Phenotyping,General Screening');

    const forthRowCells = tableRows.at(3).find(BodyCell);
    expect(forthRowCells.at(0).dive().text()).to.equal('Budget Code');
    expect(forthRowCells.at(1).find(EditableProperty).props().value).to.equal('1001');

    const fithRowCells = tableRows.at(4).find(BodyCell);
    expect(fithRowCells.at(0).dive().text()).to.equal('Made Of Plastic');
    expect(fithRowCells.at(1).find(EditableProperty).props().value).to.equal('true');
  });

  it('should not show edit button when editable prop is not passed', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);
    const tableRows = wrapper.find(Body).find(Row);
    const firstRowCells = tableRows.at(0).find(BodyCell);
    expect(firstRowCells.at(1).find(EditableProperty).props().editable).to.equal(false);
  });

  it('should show edit button when editable prop is passed', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);
    const tableRows = wrapper.find(Body).find(Row);
    const secondRowCells = tableRows.at(1).find(BodyCell);
    expect(secondRowCells.at(1).find(EditableProperty).props().editable).to.equal(true);
  });

  it('should add an empty value option in the select when custom property config type is choice', () => {
    wrapper = shallow(<CustomPropertyTable {...props} />);
    const tableRows = wrapper.find(Body).find(Row);
    const secondRowCells = tableRows.at(3).find(BodyCell);
    expect(secondRowCells.at(1).find(EditableProperty).props().multiSelect).to.be.undefined;
    expect(secondRowCells.at(1).find(EditableProperty).props().options.length).to.equal(3);
  });

  it('should call saveCustomProperty with new value when save button is clicked', () => {
    const onSaveCustomPropertySpy = sandbox.spy(_ => {});
    wrapper = mount(<CustomPropertyTable
      customProperties={customProperties}
      customPropertiesConfigs={customPropertiesConfigs}
      onSaveCustomProperty={onSaveCustomPropertySpy}
    />);

    const row = wrapper.find('tr.amino-table__row').at(2);
    row.find('.inplace-input').simulate('mouseenter');
    const edit = row.find('.inplace-input__action--edit');
    expect(edit.length).to.equal(2);

    edit.at(1).simulate('click');
    const updatedRow = wrapper.find('tr.amino-table__row').at(2);
    expect(updatedRow.find('input').length).to.equal(1);

    updatedRow.find('input').at(0).simulate('change', { target: { name: 'updatedValueForm', value: 'test' } });
    expect(updatedRow.find('.inplace-input__actions').find('i').length).to.equal(2);
    const accept = updatedRow.find('.inplace-input__actions').find('i').at(1);
    accept.simulate('click');

    expect(onSaveCustomPropertySpy.calledOnce).to.be.true;
    expect(onSaveCustomPropertySpy.calledWith('ct_prop_2', 'test')).to.be.true;
  });
});
