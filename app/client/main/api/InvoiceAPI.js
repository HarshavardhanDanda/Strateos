import API from 'main/api/API';

class InvoiceAPI extends API {
  constructor() {
    super('invoices');
  }
}

export default new InvoiceAPI();
