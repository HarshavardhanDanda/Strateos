import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import Immutable from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import SessionStore from 'main/stores/SessionStore';
import { TubeCreate, TubeCreateLogic } from './tube_views';
import { createInputValues } from './TubesCreateFromCSV';

describe('TubeCreate', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const props = {
    inputValues: Immutable.Map({
      name: 'Tube 1',
      containerType: 'micro-1.5'
    }),
    containerType: Immutable.Map(),
    onInputValuesChange: (inputValues) => { wrapper.setProps({ inputValues }); },
    getLinkedCompoundArray: () => {},
    containerArray: Immutable.Iterable([{ name: 'Tube 1', containerType: 'micro-1.5' }]),
    containerIndex: 0
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org123' }));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  it('renders a tube with correct number of input with units', () => {
    wrapper = mount(<TubeCreate {...props} />);
    const inputWithUnits = wrapper.find('InputWithUnits');
    expect(inputWithUnits.length).to.equal(2);
    const inputWithUnits1 = inputWithUnits.at(0);
    const inputWithUnits2 = inputWithUnits.at(1);
    expect(inputWithUnits1.prop('dimension')).to.equal('volume');
    expect(inputWithUnits2.prop('dimension')).to.equal('mass');
  });

  it('throws an error if a retired container type is used', () => {
    const retiredContainerTypeSpy = sandbox.spy(TubeCreateLogic, 'retiredContainerTypeError');
    wrapper = mount(
      <TubeCreate
        {...props}
        inputValues={Immutable.Map({
          name: 'Tube 1',
          containerType: 'pcr-0.5'
        })}
        containerType={Immutable.Map({ id: 'pcr-0.5',  name: 'Pcr 0.5', well_count: 1, retired_at: '2021-02-27T11:34:55.483-08:00' })}
        containerArray={Immutable.Iterable([{ name: 'Tube 1', containerType: 'pcr-0.5' }])}
      />
    );

    expect(retiredContainerTypeSpy.called).to.be.true;
    expect(wrapper.find('Validated').at(1).prop('error')).to.equal('is not usable');
  });

  it('renders a tube with InternalSuggestedBarcode if present in properties', () => {
    wrapper = mount(
      <TubeCreate
        {...props}
        inputValues={Immutable.Map({
          name: 'Tube 1',
          containerType: 'micro-1.5',
          properties: Immutable.Map({ InternalSuggestedBarcode: '12345' })
        })}
      />
    );
    const internalSuggestedBarcode = wrapper.find('LabeledInput').at(5);
    expect(internalSuggestedBarcode.find('label').text()).to.equal('Suggested Barcode');
    expect(internalSuggestedBarcode.find('TextInput').prop('value')).to.equal('12345');
  });
});

describe('TubesCreateFromCSV test', () => {
  it('calls createInputValues with volume and empty mass', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '10',
        'Mass (mg)': '',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': ''
      }
    ];
    const tubesMap = createInputValues(data).toJS();
    expect(tubesMap).to.eql([
      {
        name: 'Tube 1',
        volume: '10:microliter',
        mass: undefined,
        storage: 'cold_4',
        containerType: 'micro-1.5',
        compoundIds: undefined,
        emptyMassMg: undefined,
        properties: {}
      }
    ]);
  });

  it('calls createInputValues with mass and empty volume', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '',
        'Mass (mg)': '10',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': ''
      }
    ];
    const tubesMap = createInputValues(data).toJS();
    expect(tubesMap).to.eql([
      {
        name: 'Tube 1',
        volume: undefined,
        mass: '10:milligram',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        compoundIds: undefined,
        emptyMassMg: undefined,
        properties: {}
      }
    ]);
  });

  it('calls createInputValues with mass and volume', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '10',
        'Mass (mg)': '10',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': ''
      }
    ];
    const tubesMap = createInputValues(data).toJS();
    expect(tubesMap).to.eql([
      {
        name: 'Tube 1',
        volume: '10:microliter',
        mass: '10:milligram',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        compoundIds: undefined,
        emptyMassMg: undefined,
        properties: {}
      }
    ]);
  });

  it('calls createInputValues with Empty Mass (mg)', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '10',
        'Mass (mg)': '10',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': '',
        'Empty Mass (mg)': '10'
      }
    ];
    const tubesMap = createInputValues(data).toJS();
    expect(tubesMap).to.eql([
      {
        name: 'Tube 1',
        volume: '10:microliter',
        mass: '10:milligram',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        compoundIds: undefined,
        emptyMassMg: '10:milligram',
        properties: {}
      }
    ]);
  });

  it('calls createInputValues with InternalSuggestedBarcode', () => {
    const data = [
      {
        'Well name': 'Tube 1',
        'Vol (uL)': '10',
        'Mass (mg)': '10',
        'Storage (C)': 'cold_4',
        'Container Type': 'micro-1.5',
        'Compound Ids': '',
        'Empty Mass (mg)': '10',
        InternalSuggestedBarcode: '12345'
      }
    ];
    const tubesMap = createInputValues(data).toJS();
    expect(tubesMap).to.eql([
      {
        name: 'Tube 1',
        volume: '10:microliter',
        mass: '10:milligram',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        compoundIds: undefined,
        emptyMassMg: '10:milligram',
        properties: { InternalSuggestedBarcode: '12345' }
      }
    ]);
  });
});
