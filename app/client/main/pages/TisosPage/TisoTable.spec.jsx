import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Card } from '@transcriptic/amino';
import TisoTable from './TisoTable';

describe('Tiso Table test', () => {

  let tisoTable;

  const props = {
    reservations: [{
      project_id: 'p1cyw8vrzs4cnt',
      device_id: 'l2s2-smr-02',
      org_subdomain: 'l2s2dev',
      instruction_id: 'i1dzgetcru7e9v',
      run_id: 'r1d3jvvxyh79fs',
      run_execution_id: '14422',
      updated_at: '2019-04-29T18:35:58.954-07:00',
      container_type: 'A1 vial',
      container_id: 'ct1d3fd7ggp9htf',
      id: '27870',
      slot: {
        col: 0,
        row: 1
      }
    }],
    match: {
      path: '/admin/tisos'
    }
  };

  afterEach(() => {
    tisoTable.unmount();
  });

  it('reservation table should render on load', () => {
    tisoTable = shallow(<TisoTable {...props} />);
    expect(tisoTable.find('Table')).to.have.length(1);
  });

  it('Tiso Table should have card component', () => {
    tisoTable = shallow(<TisoTable {...props} />);
    expect(tisoTable.find(Card).length).to.equal(1);
  });

  it('Tiso Table should have table component', () => {
    tisoTable = shallow(<TisoTable {...props} />);
    expect(tisoTable.find('Table').length).to.equal(1);
  });

  it('Tiso table should have eight columns', () => {
    tisoTable = shallow(<TisoTable {...props} />).find('Table').dive();
    expect(tisoTable.find('HeaderCell').length).to.equal(8);
  });

  it('Tiso table should have reservation id column', () => {
    tisoTable = shallow(<TisoTable {...props} />).find('Table').dive();
    expect(tisoTable.find('HeaderCell').first().dive().text()).to.be.eql('reservation id');
  });

  it('Tiso table should have container id column', () => {
    tisoTable = shallow(<TisoTable {...props} />).find('Table').dive();
    expect(tisoTable.find('HeaderCell').last().dive().text()).to.equal('slot');
  });

  it('should have gray as TabLayout background color', () => {
    tisoTable = shallow(<TisoTable {...props} />);
    const tabLayout = tisoTable.find('TabLayout');

    expect(tabLayout.length).to.equals(1);
    expect(tabLayout.props().theme).to.equals('gray');
  });
});
