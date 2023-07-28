import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount } from 'enzyme';
import FieldMapperPreview from './FieldMapperPreview';

const data = [
  {
    id: '1',
    barcode_custom: 'ABC-123',
    nameCustom: 'Name 1',
    customLocation: 'Location 1',
    cas: 'CAS 1',
    label: null
  },
  {
    id: '2',
    barcode_custom: 'DEF-123',
    nameCustom: 'Name 2',
    customLocation: 'Location 2',
    cas: 'CAS 2',
    label: 'Label 2'
  }
];

const props = {
  data
};

describe('FieldMapperPreview', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should display header and first row only', () => {
    wrapper = mount(<FieldMapperPreview {...props} />);
    expect(wrapper.find('Row').length).to.equal(2);
  });

  it('should display table headers', () => {
    wrapper = mount(<FieldMapperPreview {...props} />);
    const table = wrapper.find('Table');
    expect(table.find('HeaderCell').at(0).childAt(0).text()).to.equal('id');
    expect(table.find('HeaderCell').at(1).childAt(0).text()).to.equal('barcode_custom');
    expect(table.find('HeaderCell').at(2).childAt(0).text()).to.equal('nameCustom');
    expect(table.find('HeaderCell').at(3).childAt(0).text()).to.equal('customLocation');
    expect(table.find('HeaderCell').at(4).childAt(0).text()).to.equal('cas');
    expect(table.find('HeaderCell').at(5).childAt(0).text()).to.equal('label');
  });

  it('should display table data', () => {
    wrapper = mount(<FieldMapperPreview {...props} />);
    const table = wrapper.find('Table');
    expect(table.find('BodyCell').at(0).childAt(0).text()).to.equal('1');
    expect(table.find('BodyCell').at(1).childAt(0).text()).to.equal('ABC-123');
    expect(table.find('BodyCell').at(2).childAt(0).text()).to.equal('Name 1');
    expect(table.find('BodyCell').at(3).childAt(0).text()).to.equal('Location 1');
    expect(table.find('BodyCell').at(4).childAt(0).text()).to.equal('CAS 1');
    expect(table.find('BodyCell').at(5).childAt(0).text()).to.equal('N/A');
  });
});
