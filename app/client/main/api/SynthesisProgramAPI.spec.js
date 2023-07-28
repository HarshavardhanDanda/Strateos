import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import SynthesisProgramAPI from './SynthesisProgramAPI';

describe('SynthesisProgramAPI', () => {
  const sandbox = sinon.createSandbox();
  const testSynthesisProgramId = 'sp1';
  const testBatchId = 'b1';

  afterEach(() => {
    sandbox.restore();
  });

  it('should call get API', () => {
    const indexStub = sandbox.stub(SynthesisProgramAPI, 'index');
    SynthesisProgramAPI.getSynthesisProgramByOrganization('test_org');
    expect(indexStub.calledOnce).to.be.true;
    expect(indexStub.args[0][0]).to.be.deep.equal({ version: 'v1', organization_id: 'test_org' });
  });

  it('should make post request to add batch to synthesis_program', () => {
    const postStub = sandbox.stub(ajax, 'post');
    SynthesisProgramAPI.addBatchToSynthesisProgram(testSynthesisProgramId, testBatchId);
    expect(postStub.calledOnce).to.be.true;
    expect(postStub.args[0][0]).to.equal(`/api/v1/synthesis_programs/${testSynthesisProgramId}/relationships/batches`);
    expect(postStub.args[0][1]).to.deep.equal({ data: [{
      type: 'batches',
      id: testBatchId
    }] });
  });

  it('should make delete request to remove association of a batch', () => {
    const deleteStub = sandbox.stub(ajax, 'delete');
    SynthesisProgramAPI.removeBatchFromSynthesisProgram(testSynthesisProgramId, testBatchId);
    expect(deleteStub.calledOnce).to.be.true;
    expect(deleteStub.args[0][0]).to.equal(`/api/v1/synthesis_programs/${testSynthesisProgramId}/relationships/batches`);
    expect(deleteStub.args[0][1]).to.deep.equal({ data: [{
      type: 'batches',
      id: testBatchId
    }] });
  });

  it('should call get api', () => {
    const queryString = 'program1';
    const indexStub = sandbox.stub(SynthesisProgramAPI, 'index')
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

    SynthesisProgramAPI.index({
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
