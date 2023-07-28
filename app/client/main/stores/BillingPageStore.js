import rootNode from 'main/state/rootNode';
import Immutable from 'immutable';

const store = rootNode.sub(
  'billingPageStore',
  Immutable.fromJS({ currentMonth: undefined, subdomain: undefined })
);

const currentMonth = () => {
  // need to use this syntax since "null" is ignored
  // as a default return value BillingPageStore.get('currentMonth', null)
  return store.get().get('currentMonth');
};

const setMonth = (month) => {
  return store.setIn(['currentMonth'], month);
};

const setSubDomain = (subdomain) => {
  store.setIn(['subdomain'], subdomain);
};

export {
  currentMonth,
  setMonth,
  setSubDomain
};
