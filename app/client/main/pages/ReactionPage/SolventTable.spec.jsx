import React from 'react';
import enzyme, { mount } from 'enzyme';
import { expect } from 'chai';
import { Column } from '@transcriptic/amino';
import sinon from 'sinon';
import SolventTable from './SolventTable';
import { reactionWithRunCreated } from './ChemicalReactionAPIMock';

describe('Solvent Table', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const reaction = reactionWithRunCreated;

  const props = {
    solvents: reaction.solvents
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('SolventTable should have Table', () => {
    wrapper = mount(<SolventTable {...props} />);
    const Table = wrapper.find('Table');
    expect(Table.length).to.equal(1);
  });

  it('SolventTable should have 3 columns', () => {
    const solventTable = enzyme.shallow(
      <SolventTable
        {... props}
      />
    );
    expect(solventTable.find(Column).length).to.eql(3);
  });

  it('SolventTable should render all solvents', () => {
    wrapper = mount(<SolventTable {...props} />);
    const Rows = wrapper.find('Body').find('tr');
    expect(Rows.length).to.equal(reaction.solvents.length);
  });
});
