import React     from 'react';
import Immutable from 'immutable';
import sinon     from 'sinon';

import { Table }      from '@transcriptic/amino';
import { expect }     from 'chai';
import { shallow }    from 'enzyme';
import { Loading }    from 'main/components/page';
import CreditStore    from 'main/stores/CreditStore';
import { Credits }    from './Credits';

const emptyCredit = Immutable.Map({});
const credits = Immutable.fromJS([
  {
    credit_type: 'Runs',
    organization_id: 'org17nr9ttyy76z',
    created_at: '2015-05-27T16:26:36.418-07:00',
    name: 'Credit for uncompleted steps - r17safcdd3mvr',
    amount_remaining: '0.0',
    updated_at: '2015-05-31T17:00:56.182-07:00',
    amount: '10.5',
    id: 'cred17sdy6qjyz7b'
  },
  {
    credit_type: 'Runs',
    organization_id: 'org17nr9ttyy76z',
    created_at: '2015-05-27T16:26:51.606-07:00',
    name: 'Credit for uncompleted steps - r17sag2w3d56z',
    amount_remaining: '0.0',
    updated_at: '2015-05-31T17:00:56.223-07:00',
    amount: '10.5',
    id: 'cred17sdy79xuhh5'
  }
]);

describe('CreditsTable', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  beforeEach(() => {
    sandbox.stub(CreditStore, 'isLoaded').returns(true);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    sandbox.restore();
  });

  it('Empty Table', () => {
    wrapper = shallow(<Credits credits={emptyCredit} />);
    const result = wrapper.find(Table);
    expect(result.length).to.be.eql(0);
    const message = wrapper.find('em');
    expect(message.text()).to.be.eql('No account credit.');
  });

  it('Table is Loading', () => {
    sandbox.restore();
    sandbox.stub(CreditStore, 'isLoaded').returns(false);
    wrapper = shallow(<Credits credits={emptyCredit} />);
    const loading = wrapper.find(Loading);
    expect(loading.length).to.be.eql(1);
  });

  it('Table is present', () => {
    wrapper = shallow(<Credits credits={credits} />);
    const result = wrapper.find(Table);
    expect(result.length).to.be.eql(1);
  });

  it('Table header is present', () => {
    wrapper = shallow(<Credits credits={credits} />).dive();
    const result = wrapper.find('HeaderCell');
    expect(result.length).to.be.eql(6);
  });

  it('Table data is present', () => {
    wrapper = shallow(<Credits credits={credits} />).dive();
    const result = wrapper.find('Row');
    expect(result.length).to.be.eql(3);
  });
});
