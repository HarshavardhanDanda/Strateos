import React        from 'react';
import { expect }   from 'chai';
import sinon        from 'sinon';
import { shallow }  from 'enzyme';
import Immutable    from 'immutable';
import UserStore    from 'main/stores/UserStore';
import PastTickets     from './PastTickets';

describe('Past Ticket test', () => {

  const supportTickets =
    Immutable.List([{
      created_at: '2017-02-25T12:00:16.398-08:00',
      id: '48',
      message: 'test submit',
      runId: 'r1ehf45nshe7v3',
      userId: 'u1dffycuxmnb2n'
    }]);

  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should have User Profile', () => {
    sandbox.stub(UserStore, 'getById')
      .returns(Immutable.fromJS({ id: 'u1dffycuxmnb2n' }));
    wrapper = shallow(<PastTickets supportTickets={supportTickets} />);

    expect(wrapper.find('UserProfile')).to.have.lengthOf(1);
  });
});
