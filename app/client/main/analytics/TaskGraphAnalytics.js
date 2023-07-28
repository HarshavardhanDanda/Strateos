import track from 'main/analytics/HeapWrapper';

const taskGraphViewed = (runId) => {
  track('Task Graph - Viewed', { runId });
};

const adminTaskGraphButtonClicked = (runId) => {
  track('Task Graph - Clicked Admin Show Task Graph Button', { runId });
};

const refSelected = (runId, refName) => {
  track('Task Graph - Ref selected', { runId, refName });
};

const refDeSelected = (runId, refName) => {
  track('Task Graph - Ref deselected', { runId, refName });
};

const loadTaskGraphFailed = (runId) => {
  track('Task Graph - load failed', { runId });
};

const usedBrowserFindInPage = (runId) => {
  track('Task Graph - Used Browser Find In Page', { runId });
};

const viewedTaskDetails = (runId, taskId) => {
  track('Task Graph - Viewed Task Details', { runId, taskId });
};

const viewedTimeConstraints = (runId, taskId) => {
  track('Task Graph - Viewed Time Constraints', { runId, taskId });
};

export {
  adminTaskGraphButtonClicked,
  refSelected,
  refDeSelected,
  taskGraphViewed,
  loadTaskGraphFailed,
  usedBrowserFindInPage,
  viewedTaskDetails,
  viewedTimeConstraints
};
