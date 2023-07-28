import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Dispatcher from 'main/dispatcher';
import ContainerAPI from './ContainerAPI';
import ContextualCustomProperties from './ContextualCustomProperties';

describe('ContextualCustomProperties', () => {
  const sandbox = sinon.createSandbox();

  const mockResponse = {
    id: 'ccp1gbfdncs7mz3s',
    value: 'Mosaic 0001',
    context_id: 'ct1gbfdncqtgg5j',
    context_type: 'Container',
    key: 'ccpc_key_001'
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('should call post request to update custom properties for a given context(container/compound etc)', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: cb => {
        cb(mockResponse);
        return { fail: () => ({}) };
      }
    });
    const mockDispatch = sandbox.spy(Dispatcher, 'dispatch');
    const containerId = 'ccp1gbfdncs7mz3s';
    const ccpcKey = 'ccpc_key_001';
    const value = 'Mosaic 0001';
    const url = `/api/containers/${containerId}/contextual_custom_properties_configs/${ccpcKey}`;

    ContextualCustomProperties.updateCustomProperty(
      ContainerAPI,
      containerId,
      ccpcKey,
      value);

    expect(post.calledOnce).to.be.true;
    expect(post.calledWithExactly(url, { value: value })).to.be.true;
    expect(mockDispatch.calledOnce);
  });
});
