import { LocalGraphQLClient } from 'graphql-hooks';
import { WorkflowInstancesByRunIdsQueryGQL } from 'main/util/graphql/queries';

/**
 * Testing async behavior inside components can be tough, use this to bounce thread
 * execution n number of times to allow awaits in tested components to resolve.
 *
 * For example: Component method has 2 awaits and then a final setState and you need
 * to test against final state, use threadBounce(3) since setState is also async
 * @param {*} timesToBounce number of times await will be called
 */
async function threadBounce(timesToBounce) {
  // Should have some upper limit, not sure what that is. 20 seems safe for now
  if (timesToBounce < 0 || timesToBounce > 20) {
    throw new Error('timesToBounce must be between 0 and 20');
  }

  for (let i = 0; i < timesToBounce; i++) {
    await null; // eslint-disable-line no-await-in-loop
  }
}

// Use when stubbing out calls where code will call .then or .done of result
function thennable(data) {
  return ({
    then: (fn) => thennable(fn(data)),
    done: (fn) => thennable(fn(data)),
  });
}

const defaultQueries = {
  [WorkflowInstancesByRunIdsQueryGQL]: () => ({
    workflowInstances: {
      items: []
    }
  })
};

function getMockGqlClient(options) {
  return  new LocalGraphQLClient({
    localQueries: (options && options.localQueries) || defaultQueries
  });
}

export {
  threadBounce,
  thennable,
  getMockGqlClient
};
