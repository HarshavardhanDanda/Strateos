import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount } from 'enzyme';
import FieldMapperForm from './FieldMapperForm';

const fields = [
  { display: 'barcode', required: true },
  { display: 'location_id', required: true },
  { display: 'label' },
  { display: 'cas_no' },
  { display: 'lot', required: true }
];

const data = [
  {
    id: '1',
    barcode_custom: 'ABC-123',
    nameCustom: 'Name 1',
    customLocation: 'Location 1',
    cas: 'CAS 1',
    date: 'Date 1',
    'sku number': 'SKU123',
    lot: 'Lot #1',
    mass: '30',
    volume: null,
    storage: null,
    order: 'Order 1'
  },
  {
    id: '2',
    barcode_custom: 'DEF-123',
    nameCustom: 'Name 2',
    customLocation: 'Location 2',
    cas: 'CAS 2',
    date: 'Date 2',
    'sku number': 'SKU456',
    lot: 'Lot #2',
    mass: '29',
    volume: '123',
    storage: '80_freezer',
    order: 'Order 2'
  },
  {
    id: '3',
    barcode_custom: 'FGH-123',
    nameCustom: 'Name 3',
    customLocation: null,
    cas: 'CAS 3',
    date: 'Date 3',
    'sku number': 'SKU789',
    lot: 'Lot #3',
    mass: '29',
    volume: '123',
    storage: '80_freezer',
    order: 'Order 3'
  }
];

const props = {
  fields,
  data,
  onChange: () => {}
};

describe('FieldMapperForm', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display table form headers', () => {
    wrapper = mount(<FieldMapperForm {...props} />);
    const table = wrapper.find('Table');
    expect(table.find('HeaderCell').at(1).find('th').text()).to.equal('Mapped column names');
    expect(table.find('HeaderCell').at(2).find('th').text()).to.equal('Uploaded column names');
  });

  it('should order field names alphanumerically with required fields first', () => {
    wrapper = mount(<FieldMapperForm {...props} />);
    const table = wrapper.find('Table');
    expect(table.find('BodyCell').at(1).find('Text').props().children).to.equal('barcode');
    expect(table.find('BodyCell').at(4).find('Text').props().children).to.equal('location_id');
    expect(table.find('BodyCell').at(7).find('Text').props().children).to.equal('lot');
    expect(table.find('BodyCell').at(10).find('Text').props().children).to.equal('cas_no');
    expect(table.find('BodyCell').at(13).find('Text').props().children).to.equal('label');
  });

  it('should display table form data', () => {
    wrapper = mount(<FieldMapperForm {...props} />);
    const table = wrapper.find('Table');
    expect(table.find('BodyCell').at(0).find('Toggle').props().value).to.equal('on');
    expect(table.find('BodyCell').at(1).find('Text').props().children).to.equal('barcode');
    expect(table.find('BodyCell').at(2).find('Select').props().value).to.equal('barcode_custom');
    expect(table.find('BodyCell').at(3).find('Toggle').props().value).to.equal('on');
    expect(table.find('BodyCell').at(4).find('Text').props().children).to.equal('location_id');
    expect(table.find('BodyCell').at(5).find('Select').props().value).to.equal('customLocation');
    expect(table.find('BodyCell').at(6).find('Toggle').props().value).to.equal('on');
    expect(table.find('BodyCell').at(7).find('Text').props().children).to.equal('lot');
    expect(table.find('BodyCell').at(8).find('Select').props().value).to.equal('lot');
    expect(table.find('BodyCell').at(9).find('Toggle').props().value).to.equal('on');
    expect(table.find('BodyCell').at(10).find('Text').props().children).to.equal('cas_no');
    expect(table.find('BodyCell').at(11).find('Select').props().value).to.equal('cas');
    expect(table.find('BodyCell').at(12).find('Toggle').props().value).to.equal('off');
    expect(table.find('BodyCell').at(13).find('Text').props().children).to.equal('label');
    expect(table.find('BodyCell').at(14).find('Select').props().value).to.equal(null);
  });

  it('should display error for required/enabled fields without selected value', () => {
    wrapper = mount(<FieldMapperForm {...props} />);
    wrapper.find('Select').at(0).props().onChange({ target: { value: null } });
    wrapper.update();
    wrapper.find('Select').at(3).props().onChange({ target: { value: null } });
    wrapper.update();
    expect(wrapper.find('Validated').at(0).props().error).to.equal('Required column');
    expect(wrapper.find('Validated').at(3).props().error).to.equal('Must select value for enabled column');
  });

  it('should display error for custom invalid fields', () => {
    const customError = {
      barcode: 'Some error',
      location_id: 'Another error'
    };
    wrapper = mount(<FieldMapperForm {...props} getCustomError={() => customError} />);
    expect(wrapper.find('Validated').at(0).props().error).to.equal('Some error');
    expect(wrapper.find('Validated').at(1).props().error).to.equal('Another error');
  });

  it('should display warning for required fields with missing data', () => {
    wrapper = mount(<FieldMapperForm {...props} />);
    expect(wrapper.find('BodyCell').at(4).find('Tooltip').length).to.equal(1);
    expect(wrapper.find('BodyCell').at(4).find('Tooltip').props().title).includes('Missing column data');
  });

  it('should hide missing data warning if field is in error state', () => {
    const customError = {
      label: 'Some error',
      location_id: 'Another error'
    };
    wrapper = mount(<FieldMapperForm {...props} getCustomError={() => customError} />);
    expect(wrapper.find('Tooltip').length).to.equal(0);
  });

  it('should update and output change when toggling row', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = mount(<FieldMapperForm {...props} onChange={onChangeSpy} />);
    wrapper.find('Toggle').at(3).props().onChange({ target: { value: 'off' } });
    expect(onChangeSpy.lastCall.args[0].cas_no).to.equal(undefined);
  });

  it('should update and output change when editing mapped value', () => {
    const onChangeSpy = sandbox.spy();
    wrapper = mount(<FieldMapperForm {...props} onChange={onChangeSpy} />);
    wrapper.find('Select').at(0).props().onChange({ target: { value: 'mass' } });
    expect(onChangeSpy.lastCall.args[0].barcode).to.equal('mass');
    expect(onChangeSpy.lastCall.args[1][0]).to.deep.include({
      barcode_custom: 'ABC-123',
      barcode: '30'
    });
  });
});
