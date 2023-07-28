import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import LabConsumerStore from 'main/stores/LabConsumerStore';
import data from 'main/test/labconsumer/testData.json';
import SessionStore from 'main/stores/SessionStore';

describe('LabConsumerStore', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    LabConsumerStore._empty();
    LabConsumerStore.initialize(data);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org123' }));
  });

  afterEach(() => {
    if (sandbox) { sandbox.restore(); }
  });

  const assertLabConsumers = (labConsumers, expectedOrganizationId, expectedCount) => {
    expect(labConsumers.size).to.equal(expectedCount);
    labConsumers.forEach((labConsumer) => {
      expect(labConsumer.getIn(['organization', 'id'])).to.equal(expectedOrganizationId);
    });
  };

  it('should have 13 lab consumers in total', () => {
    expect(LabConsumerStore.getAll().size).to.equal(13);
  });

  it('should get expected number of lab consumers by org id', () => {
    assertLabConsumers(LabConsumerStore.getAllForOrg('org123'), 'org123', 2);
    assertLabConsumers(LabConsumerStore.getAllForOrg('org18gq2mp292uq'), 'org18gq2mp292uq', 1);
    assertLabConsumers(LabConsumerStore.getAllForOrg('random_org'), 'random_org', 0);
  });

  it('should get expected number of lab consumers for current org', () => {
    assertLabConsumers(LabConsumerStore.getAllForCurrentOrg(), 'org123', 2);
  });
});
