import React from 'react';
import enzyme from 'enzyme';
import { expect } from 'chai';
import { Column, Table, Unit } from '@transcriptic/amino';
import sinon from 'sinon';
import ProductTable from './ProductTable';
import { reactionWithRunCreated } from './ChemicalReactionAPIMock';

describe('Product Table', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const reaction = reactionWithRunCreated;

  const props = {
    product: reaction.products
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('ProductTable should have Table', () => {
    wrapper = enzyme.shallow(<ProductTable {...props} />);
    const table = wrapper.find(Table);
    expect(table.length).to.equal(1);
  });

  it('ProductTable should have 7 columns', () => {
    const productTable = enzyme.shallow(
      <ProductTable
        {... props}
      />
    );
    expect(productTable).to.be.ok;
    expect(productTable.find(Column).length).to.eql(7);

    expect(productTable.find(Column).at(0).props().header).to.equal('Rxn Id');
    expect(productTable.find(Column).at(1).props().header).to.equal('Product');
    expect(productTable.find(Column).at(2).props().header).to.equal('MF');
    expect(productTable.find(Column).at(3).props().header).to.equal('FM');
    expect(productTable.find(Column).at(4).props().header).to.equal('MW');
    expect(productTable.find(Column).at(5).props().header).to.equal('EM');
    expect(productTable.find(Column).at(6).props().header).to.equal('Theo Mass');
  });

  it('Check values of First row', () => {
    const productTable = enzyme.shallow(
      <ProductTable
        {... props}
      />
    );

    const table = productTable.find(Table);
    const firstRowColumns = table.dive().find('BodyCell');
    expect(firstRowColumns.at(0).dive().text()).to.eql('IV');
    expect(firstRowColumns.at(1).dive().text()).to.eql('fluro test');
    expect(firstRowColumns.at(2).dive().text()).to.eql('C4H7BF3K');
    expect(firstRowColumns.at(3).dive().text()).to.eql('211.26');
    expect(firstRowColumns.at(4).dive().text()).to.eql('162.0');
    expect(firstRowColumns.at(5).dive().text()).to.eql('162.022997');
    expect(firstRowColumns.at(6).dive().find(Unit).props().value).to.eql('85.000:milligram');
  });
});
