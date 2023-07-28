import API from 'main/api/API';
import ajax from 'main/util/ajax';

class RefAPI extends API {
  constructor() {
    super('refs');
  }

  fetchWithContainersOmcs(runId) {
    const includes = [
      'container',
      'container.container_type',
      'container.device',
      'orderable_material_component',
      'orderable_material_component.material_component.resource'
    ];

    const options = {
      filters: { run_id: runId },
      includes,
      fields: {
        refs: ['id', 'run_id', 'name', 'container_id', 'new_container_type', 'container_type', 'destiny'],
        orderable_material_components: ['id'],
        resources: ['id', 'name'],
        devices: ['id', 'manufacturer', 'model', 'name']
      },
      limit: 50
    };

    return this.indexAll(options)
      .done(refs => ajax.Deferred().resolve(refs))
      .fail(err => err);
  }
}

export default new RefAPI();
