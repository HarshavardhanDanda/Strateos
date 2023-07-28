import ContainerTypeAPI from 'main/api/ContainerTypeAPI';

const ContainerTypeActions = {
  loadAll(options) {
    return ContainerTypeAPI.indexAll(options);
  },

  loadOrgShippable(subdomain, options) {
    return ContainerTypeActions.loadAll({ shippable_subdomain: subdomain, ...options });
  }
};

export default ContainerTypeActions;
