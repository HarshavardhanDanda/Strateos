const PaymentMethodUtil = {
  poAttachmentName(pm) {
    return /^.*\/(.+?)$/.exec(pm.get('po_attachment_url'))[1];
  }
};

export default PaymentMethodUtil;
