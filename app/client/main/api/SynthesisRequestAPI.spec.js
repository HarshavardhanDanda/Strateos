import sinon from 'sinon';
import { expect } from 'chai';

import SynthesisRequestAPI from 'main/api/SynthesisRequestAPI';

describe('SynthesisRequestAPI', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should call get api', () => {
    const queryString = 'test123';
    const indexStub = sandbox.stub(SynthesisRequestAPI, 'index')
      .withArgs({ version: 'v1',
        filters: {
          name: queryString,
        },
        sortBy: ['name']
      }).returns({
        done: (cb) => {
          cb({});
          return { fail: () => ({}) };
        }
      });

    SynthesisRequestAPI.index({
      version: 'v1',
      filters: {
        name: queryString
      },
      sortBy: ['name'] },
    );
    expect(indexStub.calledOnce);
    expect(indexStub.calledWithExactly({ filters: { name: queryString },
      version: 'v1',
      sortBy: ['name']
    })).to.be.true;
  });
});
