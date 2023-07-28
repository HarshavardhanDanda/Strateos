import track from 'main/analytics/HeapWrapper';

const protocolAbandoned = (protocolID) => {
  track('ProBroMo - Abandoned', { protocolID });
};

export default { protocolAbandoned };
