import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { mount } from 'enzyme';
import SessionStore from 'main/stores/SessionStore';
import sinon from 'sinon';
import { TubeCreate } from './tube_views';
import { createInputValues } from './TubesCreateFromCSV';

describe('TubeView', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org123' }));
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('Tube view should show extra properties from csv', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '10',
        'Mass (mg)': '',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': '',
        InternalSuggestedBarcode: '07FA123',
        SomeOtherProperty: 'some value'
      }
    ];
    const inputs = createInputValues(data).toJS();
    const containerType = Immutable.fromJS({
      id: 'd2-vial',
      is_tube: true
    });
    wrapper = mount(<TubeCreate
      inputValues={Immutable.fromJS(inputs[0])}
      containerType={containerType}
      getLinkedCompoundArray={() => {}}
      containerArray={Immutable.Iterable([{ name: 'Tube 1', containerType: 'micro-1.5' }])}
      containerIndex={0}
    />);
    const internalSuggestedBarcode = wrapper.find('LabeledInput').at(5);
    expect(internalSuggestedBarcode.find('label').text()).to.equal('Suggested Barcode');
    expect(internalSuggestedBarcode.find('TextInput').prop('value')).to.equal('07FA123');
    const entries = wrapper.find('KeyValueList').prop('entries');
    expect(entries.length).to.equal(1);
    expect(entries[0].key).to.equal('SomeOtherProperty');
    expect(entries[0].value).to.equal('some value');
  });
});
