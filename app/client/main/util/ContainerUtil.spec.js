import { expect } from 'chai';
import Immutable from 'immutable';
import {
  isPhysicallyAvailable,
  isStock
} from './ContainerUtil';

describe('ContainerUtil', () => {
  it('consumable should be available', () => {
    const container = Immutable.fromJS({ status: 'consumable' });
    expect(isPhysicallyAvailable(container)).to.be.true;
  });

  it('should determine if stock container', () => {
    const getContainer = (properties) => Immutable.fromJS(properties);
    expect(isStock(getContainer(undefined))).to.be.false;
    expect(isStock(getContainer({ organization: { id: 'some_id' } }))).to.be.false;
    expect(isStock(getContainer({ organization_id: 'some_id' }))).to.be.false;
    expect(isStock(getContainer({}))).to.be.true;
  });
});
