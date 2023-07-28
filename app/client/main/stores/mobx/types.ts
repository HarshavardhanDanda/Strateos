interface OptionsObject {
  name: string;
  value: string;
  disabled?: boolean;
}

enum WorkcellType {
  Meta = 'metamcx',
  Mcx = 'mcx',
}

enum RunsViewType {
  Queue,
  Approvals,
  RunTransferModal
}

export {
  OptionsObject,
  WorkcellType,
  RunsViewType
};
