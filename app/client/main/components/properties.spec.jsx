import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { GenericSearcher } from 'main/components/properties';

describe('properties', () => {

  describe('GenericSearcher', () => {
    const sandbox = sinon.createSandbox();
    let engineQuerySpy;
    let wrapper;
    let props;

    beforeEach(() => {
      engineQuerySpy = sandbox.spy();
      props = {
        engine: {
          query: engineQuerySpy
        }
      };
    });

    afterEach(() => {
      if (wrapper) wrapper.unmount();
      if (sandbox) sandbox.restore();
    });

    it('should query search results again if query prop q is updated', () => {
      wrapper = mount(<GenericSearcher {...props} />);
      wrapper.find('SearchField').props().onChange({ target: { value: 'query' } });

      expect(engineQuerySpy.calledOnce).to.be.true;
      engineQuerySpy.args[0][1]({ results: [], page: 1 });
      wrapper.find('SearchField').props().onChange({ target: { value: 'query1' } });

      expect(engineQuerySpy.calledTwice).to.be.true;
    });

    it('should not query search results again if query prop q is set with same value', () => {
      wrapper = mount(<GenericSearcher {...props} />);
      wrapper.find('SearchField').props().onChange({ target: { value: 'query' } });

      expect(engineQuerySpy.calledOnce).to.be.true;
      engineQuerySpy.args[0][1]({ results: [], page: 1 });
      wrapper.find('SearchField').props().onChange({ target: { value: 'query' } });
      expect(engineQuerySpy.calledOnce).to.be.true;
    });
  });
});
