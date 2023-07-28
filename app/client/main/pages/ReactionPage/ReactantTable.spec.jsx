import React from 'react';
import enzyme, { mount } from 'enzyme';
import { expect } from 'chai';
import { Column } from '@transcriptic/amino';
import sinon from 'sinon';
import ReactantTable from './ReactantTable';
import { reactionWithRunCreated } from './ChemicalReactionAPIMock';

describe('Reactant Table', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const reaction = reactionWithRunCreated;

  const props = {
    reactants: reaction.reactants
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('ReactantTable should have Table', () => {
    wrapper = mount(<ReactantTable {...props} />);
    const Table = wrapper.find('Table');
    expect(Table.length).to.equal(1);
  });

  it('ReactantTable should have 14 columns', () => {
    const reactantTable = enzyme.shallow(
      <ReactantTable
        {... props}
      />
    );
    expect(reactantTable).to.be.ok;
    expect(reactantTable.find(Column).length).to.eql(14);
  });

  it('ReactantTable should render all reactants', () => {
    wrapper = mount(<ReactantTable {...props} />);
    const Rows = wrapper.find('Body').find('tr');
    expect(Rows.length).to.equal(reaction.reactants.length);
  });
});
