import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import sinon from 'sinon';

import LocationTypeStore from 'main/stores/LocationTypeStore';
import AddLocationModal from './AddLocationModal';

describe('AddLocationModal', () => {
  let addLocationModal;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (addLocationModal) {
      addLocationModal.unmount();
    }
  });

  it('should have a modal id', () => {
    expect(AddLocationModal.MODAL_ID).to.equal('ADD_LOCATION_MODAL');
  });

  it('should render a modal', () => {
    const parentLocation = Immutable.Map({
      id: '0'
    });
    addLocationModal = shallow(
      <AddLocationModal parentLocation={parentLocation} />
    ).dive();

    const modal = addLocationModal.find('ConnectedSinglePaneModal');
    expect(modal.length).to.equal(1);
    expect(modal.prop('title')).to.equal('Add New Location');
  });

  it('should have lab select in root location modal', () => {
    const parentLocation = Immutable.Map();
    addLocationModal = shallow(
      <AddLocationModal parentLocation={parentLocation} />
    ).dive();

    expect(addLocationModal.find('LabeledInput').at(3).props().label).to.equal('Lab');
  });

  it('should display error when row has an invalid value', () => {
    const parentLocation = Immutable.Map({
      id: '0'
    });
    addLocationModal = shallow(
      <AddLocationModal parentLocation={parentLocation} />
    ).dive();
    addLocationModal.setState({ locationType: new Map([['category', 'box']]) });
    const labeledInputs = addLocationModal.find('LabeledInput');

    expect(labeledInputs.at(3).props().label).to.equal('Number of rows');
    labeledInputs.at(3).dive().find('TextInput').simulate('blur');
    expect(addLocationModal.find('Validated').at(2).props().error).to.eql('Must be specified');
    labeledInputs.at(3).dive().find('TextInput').simulate('change', { target: { value: -2 } });
    expect(addLocationModal.find('Validated').at(2).props().error).to.eql('Must be a positive whole number');
    labeledInputs.at(3).dive().find('TextInput').simulate('change', { target: { value: 0 } });
    expect(addLocationModal.find('Validated').at(2).props().error).to.eql('Must be a positive whole number');
    labeledInputs.at(3).dive().find('TextInput').simulate('change', { target: { value: 'abc' } });
    expect(addLocationModal.find('Validated').at(2).props().error).to.eql('Must be a positive whole number');
  });

  it('should display error when column has an invalid value', () => {
    const parentLocation = Immutable.Map({
      id: '0'
    });
    addLocationModal = shallow(
      <AddLocationModal parentLocation={parentLocation} />
    ).dive();
    addLocationModal.setState({ locationType: new Map([['category', 'box']]) });
    const labeledInputs = addLocationModal.find('LabeledInput');

    expect(labeledInputs.at(4).props().label).to.equal('Number of columns');
    labeledInputs.at(4).dive().find('TextInput').simulate('blur');
    expect(addLocationModal.find('Validated').at(3).props().error).to.eql('Must be specified');
    labeledInputs.at(4).dive().find('TextInput').simulate('change', { target: { value: -2 } });
    expect(addLocationModal.find('Validated').at(3).props().error).to.eql('Must be a positive whole number');
    labeledInputs.at(4).dive().find('TextInput').simulate('change', { target: { value: 0 } });
    expect(addLocationModal.find('Validated').at(3).props().error).to.eql('Must be a positive whole number');
    labeledInputs.at(4).dive().find('TextInput').simulate('change', { target: { value: 'abc' } });
    expect(addLocationModal.find('Validated').at(3).props().error).to.eql('Must be a positive whole number');
  });

  it('should display error when Cell height has an invalid value', () => {
    const locationTypes = Immutable.fromJS([{
      name: 'tube_box_rack',
      id: 'loctyp194r6bzc879x',
      category: 'tube_box_rack'
    }, {
      name: 'Unknown',
      id: 'loctyp1959vuy4482f',
      category: 'Unknown'
    }, {
      name: 'rack',
      id: 'loctyp17u53uxsfxua',
      category: 'rack'
    }, {
      name: 'shelf',
      id: 'loctyp1az7mba6vjz8',
      category: 'shelf'
    }]);
    sandbox.stub(LocationTypeStore, 'getAllByCategories').returns(locationTypes);
    const parentLocation = Immutable.fromJS({
      id: 'loc1fyaxzxeyfmpx',
    });
    addLocationModal = shallow(
      <AddLocationModal parentLocation={parentLocation} />
    ).dive();
    addLocationModal.setState({ locationType: new Map([['category', 'rack']]) });
    const labeledInputs = addLocationModal.find('LabeledInput');

    expect(labeledInputs.at(5).props().label).to.equal('Cell Height (mm)');
    expect(addLocationModal.find('Validated').at(4).props().error).to.eql('Must be specified');
    labeledInputs.at(5).dive().find('Select').simulate('change', { target: { value: 85 } });
    expect(addLocationModal.find('Validated').at(4).props().error).to.be.undefined;
  });
});
