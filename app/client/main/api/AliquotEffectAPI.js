import API from 'main/api/API';

class AliquotEffectAPI extends API {
  constructor() {
    super('aliquot_effects');
  }
}

export default new AliquotEffectAPI();
