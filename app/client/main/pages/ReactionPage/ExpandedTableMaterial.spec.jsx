import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { TableLayout } from '@transcriptic/amino';

import ExpandedTableMaterial from './ExpandedTableMaterial';

describe('Expanded Table Material', () => {
  let wrapper;

  const userInventoryMaterial = [{
    source: {
      type: 'CONTAINER',
      value: {
        id: 'ct1fqsqycg44tux',
        attributes: {
          label: 'container name',
          containerTypeId: 'd1-vial',
          containerTypeShortname: 'd1-vial'
        }
      }
    },
    compound: {
      linkId: 'cmpl1efjg7db6w6th'
    }
  }];

  const strateosMaterial = [{
    source: {
      type: 'RESOURCE',
      value: {
        attributes: {
          name: 'Resource1',
          smiles: 'NCc1ccccc1',
          vendor: 'AGCC',
          supplier: 'Supplier1',
          sku: '123456',
          estimatedCost: '10.0'
        }
      }
    },
    compound: {
      linkId: 'cmpl1efjg7db6w6th'
    }
  }];

  describe('User Inventory as source', () => {
    beforeEach(() => {
      wrapper = shallow(<ExpandedTableMaterial material={userInventoryMaterial} source="User Inventory" />).dive();
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('check if container type is displayed', () => {
      const containerType = wrapper.find(TableLayout.BodyCell).at(0).dive();
      expect(containerType.find('i').length).to.equal(1);
      expect(containerType.text()).to.equal('d1-vial');
    });

    it('check if links are present for container name', () => {
      const containerName = wrapper.find(TableLayout.BodyCell).at(1).dive();
      expect(containerName.find('a').length).to.equal(1);
      expect(containerName.find('a').prop('href')).contains('ct1fqsqycg44tux');
      expect(containerName.text()).to.equal('container name');
    });

    it('check if links are present for compound link', () => {
      const compoundLinkId = wrapper.find(TableLayout.BodyCell).at(2).dive();
      expect(compoundLinkId.find('a').length).to.equal(1);
      expect(compoundLinkId.find('a').prop('href')).contains('cmpl1efjg7db6w6th');
      expect(compoundLinkId.text()).to.equal('cmpl1efjg7db6w6th');
    });
  });

  describe('Stratoes as source', () => {
    beforeEach(() => {
      wrapper = shallow(<ExpandedTableMaterial material={strateosMaterial} source="Stratoes" />).dive();
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('check if supplier is displayed', () => {
      const supplier = wrapper.find(TableLayout.BodyCell).at(0).dive();
      expect(supplier.length).to.equal(1);
      expect(supplier.text()).to.equal('Supplier1');
    });

    it('check if links are present for compound link', () => {
      const compoundLinkId = wrapper.find(TableLayout.BodyCell).at(1).dive();
      expect(compoundLinkId.find('a').length).to.equal(1);
      expect(compoundLinkId.find('a').prop('href')).contains('cmpl1efjg7db6w6th');
      expect(compoundLinkId.text()).to.equal('cmpl1efjg7db6w6th');
    });
  });
});
