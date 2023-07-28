import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import ContainerAPI from './ContainerAPI';
import ContextualCustomProperties from './ContextualCustomProperties';

describe('ContainerAPI', () => {
  const sandbox = sinon.createSandbox();
  const customProperty = Immutable.fromJS(
    {
      id: 'ccp1gbfdncs7mz3s',
      type: 'contextual_custom_properties',
      context_type: 'Container',
      context_id: 'ct1gbfdncqtgg5j',
      key: 'ct_prop_1',
      value: 'Mosaic 0001'
    }
  );

  afterEach(() => {
    sandbox.restore();
  });

  it('should call update custom property api', () => {
    const mockUpdateCustomProperty = sandbox.spy(ContextualCustomProperties, 'updateCustomProperty');
    const key = 'ccpc_key_1';
    const value = 'some data';
    const containerId = customProperty.get('context_id');

    ContainerAPI.updateCustomProperty(
      containerId,
      key,
      value);

    expect(mockUpdateCustomProperty.calledOnce).to.be.true;
  });
});
