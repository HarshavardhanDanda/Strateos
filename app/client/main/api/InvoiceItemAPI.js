import API from 'main/api/API';

class InvoiceItemAPI extends API {
  constructor() {
    super('invoice_items');
  }
}

export default new InvoiceItemAPI();
