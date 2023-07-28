import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';

import EMoleculesSearchResults from './EMoleculesSearchResults';

describe('EMoleculesSearchResults', () => {

  let wrapper = null;
  const eMoleculeData = [{
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: '1,3,7-trimethyl-2,3,6,7-tetrahydro-1h-purine-2,6-dione',
    id: '1317_1',
    supplierName: 'InterBioScreen',
    tier: 3,
    estimatedCost: '$0.25/mg',
    sku: '327919424',
    casNumber: '123-123-44',
    structureUrl: 'example.com',
    tierText: 'Tier 3, Ships within 4 weeks'
  },
  {
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    id: '1317_2',
    supplierName: 'InterBio',
    tier: 1,
    estimatedCost: '$0.26/mg',
    sku: '327919427',
    tierText: 'Tier 1, Ships within 4 weeks'
  }
  ];

  const props = {
    data: Immutable.fromJS(eMoleculeData),
    selected: [],
    searchOptions: { get: () => [] },
    pageSize: 12,
    page: 1,
    numPages: 5,
    eMoleculesSearchType: 'ALTERNATE',
    isSearching: false,
    isLoading: () => {}
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  function retrieveText(row, index) {
    return row.find('BodyCell').at(index).children().text();
  }

  it('should display cas number,name and structure url the data is present', () => {
    wrapper = shallow(
      <EMoleculesSearchResults {...props} />
    );
    const row = wrapper.find('List').dive()
      .find('Table').dive()
      .find('Row')
      .at(1);

    expect(retrieveText(row, 2)).to.equal(eMoleculeData[0].name);
    expect(retrieveText(row, 3)).to.equal(eMoleculeData[0].casNumber);
    expect(retrieveText(row, 5)).to.equal(eMoleculeData[0].structureUrl);
  });

  it('should display hyphen if cas number,name and structure url is not present', () => {
    wrapper = shallow(
      <EMoleculesSearchResults {...props} />
    );
    const row = wrapper.find('List').dive()
      .find('Table').dive()
      .find('Row')
      .at(2);

    expect(retrieveText(row, 2)).to.equal('-');
    expect(retrieveText(row, 3)).to.equal('-');
    expect(retrieveText(row, 5)).to.equal('-');
  });

  it('should have spinner when isSearching is true', () => {
    wrapper = mount(
      <EMoleculesSearchResults {...props} isSearching />
    );
    expect(wrapper.find('Spinner').length).to.be.equal(1);
  });
});
