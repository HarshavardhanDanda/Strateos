import track from 'main/analytics/HeapWrapper';

const validationStarted = () => {
  track('Run validate started');
};

const validationSucceeded = () => {
  track('Run validate succeeded');
};

const validationFailed = ({ error, response }) => {
  track('Run validate failed', { error, response });
};

const launched = () => {
  track('Run launched');
};

const launchFailed = ({ error, response }) => {
  track('Run launch failed', { error, response });
};

export {
  validationFailed,
  validationStarted,
  validationSucceeded,
  launched,
  launchFailed
};
