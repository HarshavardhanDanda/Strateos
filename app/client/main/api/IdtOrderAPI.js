import API from 'main/api/API';

class IdtOrderAPI extends API {
  constructor() {
    super('idt_orders');
  }
}

export default new IdtOrderAPI();
