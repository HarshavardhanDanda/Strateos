import Immutable from 'immutable';
import React from 'react';
import sinon from 'sinon';
import { expect, assert } from 'chai';
import LocationStore from 'main/stores/LocationStore';

import {
  Label,
  Id,
  Location,
  Storage,
  Cover,
  Code,
  IntakeCode,
  ContainerType,
  LocationPath,
  LocationName,
  CurrentLocation,
  Barcode,
  StorageTemp,
  Hazard,
  CurrentMass,
  EmptyContainerMass,
  CreatedBy,
  CatalogNo,
  Vendor
} from './ContainerProperties';

describe('ContainerProperties', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(LocationStore, 'getById').returns(Immutable.fromJS({ name: '3A', id: 'loc2' }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('render all rows', () => {
    const container =
      Immutable.fromJS({ location: { ancestors: [{ id: 'loc1', name: '-80' }], id: 'loc2', name: '3A' } });
    assert(React.isValidElement(Location(container)));
    assert(!React.isValidElement(Location(Immutable.fromJS({}))));
    assert(React.isValidElement(LocationName(container)));
    expect(LocationPath(container)).to.eql([{ name: '-80', id: 'loc1' }, { name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({}))).to.eql([]);
    expect(LocationPath(Immutable.fromJS({ location: undefined }))).to.eql([]);
    expect(LocationPath(Immutable.fromJS({ location: { id: 'loc2', name: '3A' } })))
      .to.eql([{ name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({ location: { ancestors: undefined, id: 'loc2', name: '3A' } })))
      .to.eql([{ name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({
      location: { ancestors: [{ name: '3B', id: 'loc3' }], id: 'loc2', name: '3A' },
      location_id: '123'
    }))).to.eql([{ name: '3B', id: 'loc3' }, { name: '3A', id: 'loc2' }]);
    expect(Id(Immutable.fromJS({ id: 'container-123' }))).to.equal('container-123');
    expect(Storage(Immutable.fromJS({ storage_condition: 'ambient' }))).to.equal('ambient');
    expect(Cover(Immutable.fromJS({ cover: 'uncovered' }))).to.equal('uncovered');
    expect(Label(Immutable.fromJS({ label: 'container-123' }))).to.equal('container-123');
    expect(Code(Immutable.fromJS({ shipment_code: 'XYZ' }))).to.equal('XYZ');
    expect(IntakeCode(Immutable.fromJS({ shipment_code: 'XYZ' }))).to.equal('XYZ');
    expect(ContainerType(Immutable.fromJS({ container_type: { shortname: 'tube' } }))).to.equal('tube');
    expect(CurrentLocation(Immutable.fromJS({ public_location_description: 'In transit to Transcriptic.' }))).to.equal('In transit to Transcriptic.');
    expect(Barcode(Immutable.fromJS({ barcode: 'abcd' }))).to.equal('abcd');
    expect(StorageTemp(Immutable.fromJS({ storage_condition: 'cold_80' }))).to.equal('-80 °C (± 1 °C)');
    expect(Hazard(Immutable.fromJS({ hazards: ['flammable'] }))).to.equal('Flammable');
    expect(CurrentMass(Immutable.fromJS({ current_mass_mg: 40 }))).to.equal('40 mg');
    expect(EmptyContainerMass(Immutable.fromJS({ empty_mass_mg: 20 }))).to.equal('20 mg');
    expect(CreatedBy(Immutable.fromJS({ created_by: '-' }))).to.equal('-');
    expect(CatalogNo(Immutable.fromJS({ catalog_number: '12345' }))).to.equal('12345');
    expect(Vendor(Immutable.fromJS({ vendor: 'Wildcat Wholesale' }))).to.equal('Wildcat Wholesale');
  });

  it('should render properly if LocationStore is undefined', () => {
    sandbox.restore();
    sandbox.stub(LocationStore, 'getById').returns(undefined);
    const container =
      Immutable.fromJS({ location: { ancestors: [{ id: 'loc1', name: '-80' }], id: 'loc2', name: '3A' } });
    assert(React.isValidElement(Location(container)));
    assert(!React.isValidElement(Location(Immutable.fromJS({}))));
    assert(React.isValidElement(LocationName(container)));
    expect(LocationPath(container)).to.eql([{ name: '-80', id: 'loc1' }, { name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({}))).to.eql([]);
    expect(LocationPath(Immutable.fromJS({ location: undefined }))).to.eql([]);
    expect(LocationPath(Immutable.fromJS({ location: { id: 'loc2', name: '3A' } })))
      .to.eql([{ name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({ location: { ancestors: undefined, id: 'loc2', name: '3A' } })))
      .to.eql([{ name: '3A', id: 'loc2' }]);
    expect(LocationPath(Immutable.fromJS({
      location: { ancestors: [{ name: '3B', id: 'loc3' }], id: 'loc2', name: '3A' },
      location_id: '123'
    }))).to.eql([{ name: '3B', id: 'loc3' }, { name: '3A', id: 'loc2' }]);
    expect(Id(Immutable.fromJS({ id: 'container-123' }))).to.equal('container-123');
    expect(Storage(Immutable.fromJS({ storage_condition: 'ambient' }))).to.equal('ambient');
    expect(Cover(Immutable.fromJS({ cover: 'uncovered' }))).to.equal('uncovered');
    expect(Label(Immutable.fromJS({ label: 'container-123' }))).to.equal('container-123');
    expect(Code(Immutable.fromJS({ shipment_code: 'XYZ' }))).to.equal('XYZ');
    expect(IntakeCode(Immutable.fromJS({ shipment_code: 'XYZ' }))).to.equal('XYZ');
    expect(ContainerType(Immutable.fromJS({ container_type: { shortname: 'tube' } }))).to.equal('tube');
    expect(CurrentLocation(Immutable.fromJS({ public_location_description: 'In transit to Transcriptic.' }))).to.equal('In transit to Transcriptic.');
    expect(Barcode(Immutable.fromJS({ barcode: 'abcd' }))).to.equal('abcd');
    expect(StorageTemp(Immutable.fromJS({ storage_condition: 'cold_80' }))).to.equal('-80 °C (± 1 °C)');
    expect(Hazard(Immutable.fromJS({ hazards: ['flammable'] }))).to.equal('Flammable');
    expect(CurrentMass(Immutable.fromJS({ current_mass_mg: 40 }))).to.equal('40 mg');
    expect(EmptyContainerMass(Immutable.fromJS({ empty_mass_mg: 20 }))).to.equal('20 mg');
    expect(CreatedBy(Immutable.fromJS({ created_by: '-' }))).to.equal('-');
    expect(CatalogNo(Immutable.fromJS({ catalog_number: '12345' }))).to.equal('12345');
    expect(Vendor(Immutable.fromJS({ vendor: 'Wildcat Wholesale' }))).to.equal('Wildcat Wholesale');
  });

  it('location should have horizontalDisplay as true by default', () => {
    const container =
      Immutable.fromJS({ location: { ancestors: [{ id: 'loc1', name: '-80' }], id: 'loc2', name: '3A' } });
    const location = Location(container);
    expect(location.props.horizontalDisplay).to.be.true;
  });
});
