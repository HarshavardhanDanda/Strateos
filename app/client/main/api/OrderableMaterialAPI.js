import API from 'main/api/API';

class OrderableMaterial extends API {
  constructor() {
    super('orderable_materials');
  }
}

export default new OrderableMaterial();
