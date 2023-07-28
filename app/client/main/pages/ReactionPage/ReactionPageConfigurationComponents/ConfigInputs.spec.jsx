import React from 'react';
import enzyme from 'enzyme';
import { expect } from 'chai';
import {
  TextInput,
  InputWithUnits,
} from '@transcriptic/amino';
import {
  TextField,
  Concentration,
} from './ConfigInputs';

describe('ConfigInputs', () => {

  const reaction = {
    serialNumber: '0218djw7j438fi2js97yv23m',
    libraryNumber: '004823',
    selectedProjectName: 'Test Project Name 1',
    productType: 'end',
    productDestination: 'Store product at Strateos',
    amount: '4:millimole/liter',
    temperature: '4˚c',
    containerType: ['A1 Vial'],
    solvent: 'DMSO',
    receiveExcess: false,
    form: 'DMSO',
    concentration: 10,
    addresses: [
      { value: 'Luoyang', name: 'Luoyang' },
      { value: 'Changan', name: 'Changan' },
    ]
  };

  it('TextField and Concentration are not editable', () => {
    const solvent = enzyme.mount(<TextField placeholder={reaction.solvent} />);
    const concentration = enzyme.mount(<Concentration reaction={reaction} />);
    expect(solvent.find(TextInput).prop('disabled')).to.equal(true);
    expect(concentration.find(InputWithUnits).prop('disabled')).to.equal(true);
  });
});
