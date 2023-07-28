import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import $ from 'jquery';

import API, { useGet } from './API';

class FooAPI extends API {
  constructor() {
    super('foos');
  }

  // override the API#get method
  get() {
    return $.Deferred().resolve({ data: 'test-data' });
  }
}

class ErrorFooAPI extends FooAPI {
  get() {
    return $.Deferred().reject('test-error-message');
  }
}

class NeverReturnsFooAPI extends FooAPI {
  get() {
    return $.Deferred();
  }
}

// Fake component used to test the useGet hook
function TestComponent({ api }) {
  const { result, isFetching, error } = useGet(api, '123');
  if (result) return <div className="result">{result.data}</div>;
  if (isFetching) return <div className="fetching">Fetching...</div>;
  if (error) return <div className="error">{error}</div>;
  return (
    <div>Unknown state...</div>
  );
}

describe('APIHooks', () => {
  it('Displays result data on successful fetch', (done) => {
    // Must mount and use setTimeout of 0 to get the useEffect to run
    const wrapper = mount(<TestComponent api={new FooAPI()} />);
    setTimeout(
      () => {
        const res = wrapper.find('.result');
        expect(res.length).to.equal(1);
        expect(res.text()).to.include('test-data');
        wrapper.unmount();
        done();
      },
      0
    );
  });

  it('Displays error message on failure', (done) => {
    // Must mount and use setTimeout of 0 to get the useEffect to run
    const wrapper = mount(<TestComponent api={new ErrorFooAPI()} />);
    setTimeout(
      () => {
        const err = wrapper.find('.error');
        expect(err.length).to.equal(1);
        expect(err.text()).to.include('test-error-message');
        wrapper.unmount();
        done();
      },
      0
    );
  });

  it('Displays a loading state while loading', (done) => {
    // Must mount and use setTimeout of 0 to get the useEffect to run
    const wrapper = mount(<TestComponent api={new NeverReturnsFooAPI()} />);
    setTimeout(
      () => {
        const fetching = wrapper.find('.fetching');
        expect(fetching.length).to.equal(1);
        expect(fetching.text()).to.include('Fetching...');
        wrapper.unmount();
        done();
      },
      0
    );
  });
});
