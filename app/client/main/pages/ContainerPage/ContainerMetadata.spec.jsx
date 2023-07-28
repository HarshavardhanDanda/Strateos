import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount } from 'enzyme';
import UserStore      from 'main/stores/UserStore';
import _ from 'lodash';

import ContainerMetadata from 'main/pages/ContainerPage/ContainerMetadata';
import { TableLayout } from '@transcriptic/amino';

const containerType = {
  id: '96-pcr',
  col_count: 2,
  vendor: 'Eppendorf',
  catalog_number: '951020619'
};

const container = {
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'inbound',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  public_location_description: 'In transit to Transcriptic.',
  empty_mass_mg: 20,
  current_mass_mg: 40,
  hazards: ['flammable', 'strong_acid'],
  created_by: 'ct1fb97rq9z7xqg',
  suggested_user_barcode: '1122'
};

const props = {
  containerType: Immutable.Map(containerType),
  container: Immutable.Map(container)
};

function getTestComponent(pr) {
  return mount(
    <ContainerMetadata {...pr} />
  );
}

describe('Container Meta Data', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('Meta data shown should be correct', () => {
    sandbox.stub(UserStore, 'getById').returns(
      Immutable.Map({
        id: 'ct1fb97rq9z7xqg',
        name: 'Vy N.'
      })
    );
    wrapper = getTestComponent(props);
    const tableRow = wrapper.find(TableLayout.Body).find(TableLayout.Row);

    expect(tableRow.at(0).find('.container-metadata__core-property__item').at(0).text()).to.equal('Catalog no.');
    expect(tableRow.at(0).find('.container-metadata__core-property__item').at(1).text()).to.equal('951020619');
    expect(tableRow.at(1).find('.container-metadata__core-property__item').at(0).text()).to.equal('ID');
    expect(tableRow.at(1).find('.container-metadata__core-property__item').at(1).text()).to.equal('ct1et8cdx6bnmwr');
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(0).text()).to.equal('Barcode');
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(1).text()).to.equal('-');
    expect(tableRow.at(3).find('.container-metadata__core-property__item').at(0).text()).to.equal('Suggested barcode');
    expect(tableRow.at(3).find('.container-metadata__core-property__item').at(1).text()).to.equal('1122');
    expect(tableRow.at(4).find('.container-metadata__core-property__item').at(0).text()).to.equal('Current location');
    expect(tableRow.at(4).find('.container-metadata__core-property__item').at(1).text()).to.equal('In transit to Transcriptic.');
    expect(tableRow.at(5).find('.container-metadata__core-property__item').at(0).text()).to.equal('Storage temp');
    expect(tableRow.at(5).find('.container-metadata__core-property__item').at(1).text()).to.equal('4 °C (± 1 °C)');
    expect(tableRow.at(6).find('.container-metadata__core-property__item').at(0).text()).to.equal('Hazard');
    expect(tableRow.at(6).find('.container-metadata__core-property__item').at(1).text()).to.equal('Flammable, strong acid');
    expect(tableRow.at(7).find('.container-metadata__core-property__item').at(0).text()).to.equal('Container type');
    expect(tableRow.at(7).find('.container-metadata__core-property__item').at(1).text()).to.equal('96-pcr');
    expect(tableRow.at(7).find('.container-metadata__core-property__item').find('a').length).to.equal(1);
    expect(tableRow.at(8).find('.container-metadata__core-property__item').at(0).text()).to.equal('Current mass');
    expect(tableRow.at(8).find('.container-metadata__core-property__item').at(1).text()).to.equal('-');
    expect(tableRow.at(9).find('.container-metadata__core-property__item').at(0).text()).to.equal('Empty container mass');
    expect(tableRow.at(9).find('.container-metadata__core-property__item').at(1).text()).to.equal('20 mg');
    expect(tableRow.at(10).find('.container-metadata__core-property__item').at(0).text()).to.equal('Created by');
    expect(tableRow.at(10).find('.container-metadata__core-property__item').at(1).text()).to.equal('VNVy N.');
    expect(tableRow.at(11).find('.container-metadata__core-property__item').at(0).text()).to.equal('Vendor');
    expect(tableRow.at(11).find('.container-metadata__core-property__item').at(1).text()).to.equal('Eppendorf');
  });

  it('Barcode should be correct', () => {
    const barcode = 'QWEFUDI';
    const cntr = _.assign(container, { barcode: barcode });
    wrapper = getTestComponent(_.assign(props, { container: Immutable.Map(cntr) }));
    const tableRow = wrapper.find(TableLayout.Body).find(TableLayout.Row);
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(0).text()).to.equal('Barcode');
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(1).text()).to.equal(barcode);
  });

  it('Should show suggested_user_barcode if no barcode is there for the container', () => {
    const barcode = 'QWEFUDI';
    const cntr = _.assign(container, { suggested_user_barcode: barcode });
    wrapper = getTestComponent(_.assign(props, { container: Immutable.Map(cntr) }));
    const tableRow = wrapper.find(TableLayout.Body).find(TableLayout.Row);
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(0).text()).to.equal('Barcode');
    expect(tableRow.at(2).find('.container-metadata__core-property__item').at(1).text()).to.equal(barcode);
  });
});
