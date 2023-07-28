import { GraphQLClient } from 'graphql-hooks';
import ajax from 'main/util/ajax';

let workflowGraphQLClient;

function createClient(url) {
  return new GraphQLClient({
    ssrMode: false,
    url,
    headers: {
      'X-User-Id': ajax.getUserID(),
      'X-Organization-Id':  ajax.getOrganizationID()
    },
    cache: undefined // Explicitly disable cache
  });
}

function getWorkflowGraphQLClient() {
  if (!workflowGraphQLClient) {
    workflowGraphQLClient = createClient('/service/workflow/graphql');
  }
  return workflowGraphQLClient;
}

export { getWorkflowGraphQLClient };
