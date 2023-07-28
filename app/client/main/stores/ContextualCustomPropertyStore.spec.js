import { expect } from 'chai';

import ContextualCustomPropertyStore from 'main/stores/ContextualCustomPropertyStore';
import properties from 'main/test/container/customProperties.json';

describe('ContextualCustomPropertyStore', () => {
  beforeEach(() => {
    ContextualCustomPropertyStore._empty();
    ContextualCustomPropertyStore.initialize(properties);
  });

  it('should have 5 custom properties by default', () => {
    expect(ContextualCustomPropertyStore.getAll().size).to.equal(6);
  });

  it('should get expected number of custom properties by container id', () => {
    expect(ContextualCustomPropertyStore.getCustomProperties('ct1gbfdqv6h5tvx', 'Container').size).to.equal(5);
    expect(ContextualCustomPropertyStore.getCustomProperties('ct1gbfdqv6h5555', 'Container').size).to.equal(1);
  });

});
