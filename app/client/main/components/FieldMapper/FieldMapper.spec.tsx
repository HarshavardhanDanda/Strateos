import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import FieldMapper from './FieldMapper';

const fields = [
  { display: 'barcode' },
  { display: 'location_id' },
  { display: 'label' },
  { display: 'cas_number' },
  { display: 'lot' }
];
const data = [
  {
    id: '1',
    barcode_custom: 'ABC-123',
    nameCustom: 'Name 1'
  },
  {
    id: '2',
    barcode_custom: 'DEF-123',
    nameCustom: 'Name 2'
  }
];

const props = {
  data,
  fields,
  onChange: () => {}
};

describe('FieldMapper', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should require data to have minimum length 1', () => {
    const consoleSpy = sandbox.spy(console, 'error');
    wrapper = shallow(<FieldMapper {...props} data={[]} />);
    expect(consoleSpy.calledWith('Data must have minimum one row to map fields.')).to.be.true;
  });

  it('should display preview', () => {
    wrapper = shallow(<FieldMapper {...props} />);
    expect(wrapper.find('FieldMapperPreview').length).to.equal(1);
  });

  it('should display description', () => {
    wrapper = shallow(<FieldMapper {...props} />);
    expect(wrapper.find('TextDescription').length).to.equal(1);
  });

  it('should display field mapper form', () => {
    wrapper = shallow(<FieldMapper {...props} />);
    expect(wrapper.find('FieldMapperForm').length).to.equal(1);
  });
});
