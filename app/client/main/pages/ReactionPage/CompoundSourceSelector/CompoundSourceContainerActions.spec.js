import sinon from 'sinon';
import { expect } from 'chai';
import { CompoundSourceSelectorContainerModalActions } from './CompoundSourceContainerActions';

describe('Compound source action', () => {
  let mockDoSearch;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    mockDoSearch = sandbox.stub(CompoundSourceSelectorContainerModalActions, 'doSearch').returns({});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do a search with correct query', () => {
    CompoundSourceSelectorContainerModalActions.onSearchInputChange(() => {}, 'search input');
    expect(mockDoSearch.calledOnce).to.be.true;
    expect(mockDoSearch.args[0][0].searchQuery).to.equal('search input');
  });
});
