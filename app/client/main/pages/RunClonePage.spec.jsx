import React        from 'react';
import { shallow }  from 'enzyme';
import { Spinner }  from '@transcriptic/amino';
import { expect }   from 'chai';
import sinon from 'sinon';
import RunClonePage from './RunClonePage';

describe('RunClonePage test', () => {

  let wrapper;
  const defaultProps = {
    match: {
      params: {
        projectId: 'p345'
      }
    }
  };

  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('renders empty without throwing', () => {
    wrapper = shallow(<RunClonePage {...defaultProps} />);
  });

  it('renders a spinner if it does not have a project', () => {
    const props = {
      match: {
        params: {
          projectId: 'notinstore'
        }
      }
    };
    wrapper = shallow(<RunClonePage {...props} />, { context: { router: {} } }).dive();
    expect(wrapper.find(Spinner)).to.have.lengthOf(1);
  });
});
