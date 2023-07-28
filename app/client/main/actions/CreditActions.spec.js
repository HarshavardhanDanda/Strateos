import sinon from 'sinon';
import HTTPUtil from 'main/util/HTTPUtil';
import Urls from 'main/util/urls';
import ajax from 'main/util/ajax';
import { expect } from 'chai';
import CreditActions from './CreditActions';

describe('Credit Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully get Credits', () => {
    const get = sandbox.stub(HTTPUtil, 'get').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });

    CreditActions.loadByOrg('transcriptic', 'org13', {});
    sinon.assert.calledWith(get, Urls.get_credits('transcriptic', 'org13'));
  });

  it('should successfully create new credits', () => {
    const post = sandbox.stub(ajax, 'post').returns({
      done: (cb) => {
        cb([]);
        return { fail: () => ({}) };
      }
    });
    const attributes = {
      amount: '2',
      credit_type: 'Runs',
      name: 'ThisWont',
      organization_id: 'org13',
      expires_at: undefined
    };
    CreditActions.createCredit(attributes.organization_id, attributes.name, attributes.amount, attributes.credit_type, attributes.expires_at);

    expect(post.calledOnce).to.be.true;
    expect(post.calledWithExactly('/api/v1/credits', { data: {
      type: 'credits',
      attributes: attributes
    } })).to.be.true;
  });
});
