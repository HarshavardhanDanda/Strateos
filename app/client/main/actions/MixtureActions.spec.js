import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import MixtureActions from './MixtureActions';

describe('MixtureActions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get mixture', () => {
    const get = sandbox.stub(ajax, 'get').returns({
      done: () => ({
        fail: () => ({
          done: () => ({})
        })
      })
    });
    MixtureActions.getMixtureById('mix123');
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/mixtures/mix123'
    )).to.be.true;
  });
});
