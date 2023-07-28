import sinon from 'sinon';
import { expect } from 'chai';
import ajax from 'main/util/ajax';
import Immutable from 'immutable';
import FeatureConstants from '@strateos/features';

import LabActions from 'main/actions/LabActions';
import FeatureStore from 'main/stores/FeatureStore';

describe('LabActions', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  it('should load labs', () => {
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.fromJS(['lab1']));

    const get = sandbox.stub(ajax, 'get').returns({
      done: () => ({
        fail: () => ({
          done: () => ({})
        })
      })
    });
    LabActions.loadAllLabWithFeature(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);
    expect(get.calledOnce);
    expect(get.calledWithExactly(
      '/api/labs', { filter: { id: ['lab1'] } }
    )).to.be.true;
  });
});
