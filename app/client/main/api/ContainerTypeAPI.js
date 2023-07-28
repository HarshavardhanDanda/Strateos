import API from 'main/api/API';
import ajax from 'main/util/ajax';

class ContainerTypeAPI extends API {
  constructor() {
    super('container_types');
  }

  getSchemaCreation() {
    const url = this.collectionMethodUrl('schema_creation');
    return ajax.get(url);
  }

  createQueryParams(options) {
    const queryParams = super.createQueryParams(options);

    if (options.shippable_subdomain) {
      queryParams.push(`shippable_subdomain=${options.shippable_subdomain}`);
    }

    return queryParams;
  }
}

export default new ContainerTypeAPI();
