import sinon from 'sinon';
import { expect } from 'chai';
import Dispatcher from 'main/dispatcher';
import JsonAPIIngestor from './JsonAPIIngestor';

describe('JSON API ingestor', () => {
  const sandbox = sinon.createSandbox();
  let payload;

  afterEach(() => {
    sandbox.restore();
  });

  it('should grouped entities', () => {
    payload = { data: [] };
    expect(JsonAPIIngestor.getGroupedEntities(payload)).to.deep.equal({});

    // eslint-disable-next-line no-null/no-null
    payload = { data: null };
    expect(JsonAPIIngestor.getGroupedEntities(payload)).to.deep.equal({});

    payload = { data: undefined };
    expect(JsonAPIIngestor.getGroupedEntities(payload)).to.deep.equal({});

    payload = { data: { type: 'foobar', id: '1' } };
    expect(JsonAPIIngestor.getGroupedEntities(payload)).to.deep.equal({
      foobar: [{ type: 'foobar', id: '1' }]
    });
  });

  it('should ingest and dispatch', () => {
    const dispatch = sandbox.stub(Dispatcher, 'dispatch');

    payload = {};
    JsonAPIIngestor.ingest(payload);
    expect(dispatch.notCalled).to.be.true;

    dispatch.reset();

    // eslint-disable-next-line no-null/no-null
    payload = { data: null };
    JsonAPIIngestor.ingest(payload);
    expect(dispatch.notCalled, 'null').to.be.true;

    dispatch.reset();

    payload = { data: { type: 'foobar', id: '1' } };
    JsonAPIIngestor.ingest(payload);

    expect(dispatch.calledWithExactly({
      type: 'FOOBAR_API_LIST',
      entities: [{ type: 'foobar', id: '1' }]
    })).to.be.true;
  });
});
