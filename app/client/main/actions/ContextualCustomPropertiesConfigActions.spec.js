import sinon from 'sinon';
import { expect } from 'chai';

import ContextualCustomPropertiesConfigAPI from 'main/api/ContextualCustomPropertiesConfigAPI';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions.js';

describe('Contextual Custom Properties Config Actions', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should call api with correct filters', () => {
    const spy = sandbox.spy(ContextualCustomPropertiesConfigAPI, 'index');
    ContextualCustomPropertiesConfigActions.loadConfig('org', 'Container');
    expect(spy.args[0][0].filters).deep.equal({ context_type: 'Container', organization_id: 'org' });
    expect(spy.args[0][0].limit).to.equal(10000);
  });
});
