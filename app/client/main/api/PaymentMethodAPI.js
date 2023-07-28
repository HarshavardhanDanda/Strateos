import API from 'main/api/API';

class PaymentMethodAPI extends API {
  constructor() {
    super('payment_methods');
  }
}

export default new PaymentMethodAPI();
