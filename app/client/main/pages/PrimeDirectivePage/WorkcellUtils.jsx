/*
  Create options for the workcell <select />
  Note that the id we use is the workcell_id, not id, because
thats what we POST to the backend
  */
import Urls from 'main/util/urls';

const workcellChoices = (workcells, shouldShowWorkcellChoice = () => true) => {
  const options = workcells
    .valueSeq()
    .sortBy(w => w.get('name'))
    .toJS()
    .filter((workcell) => shouldShowWorkcellChoice(workcell) && workcell.is_test !== true)
    .map((workcell) => {
      const { workcell_id, name, state } = workcell;
      // Disable option if the service is not deployed
      const disabled = !!state && state === 'NOT_DEPLOYED';
      const nname = disabled ? `${name} (not deployed)` : name;
      return { id: workcell_id, name: nname, disabled };
    });
  return [{ id: '', name: 'Select a workcell', disabled: true }].concat(options);
};

/*
  Create the url that the user can use to go to the dashboard where the run was submitted.
  See lab-frontend-config repo.
  */
const createWorkcellPath = (workcellId, workcells, isTestSubmission, sessionId) => {
  const workcell = workcells.find((wc) => wc.get('workcell_id') === workcellId);
  if (!workcell) {
    return undefined;
  }
  if (isTestSubmission) {
    const testWorkcellId = workcell.get('test_workcell');
    if (!testWorkcellId) {
      return undefined;
    }
    const testWorkcell = workcells.find((wc) => wc.get('id') === testWorkcellId);
    if (!testWorkcell) {
      return undefined;
    }
    const search = sessionId ? `?sessionId=${sessionId}` : '';
    return `${Urls.operator_dashboard_deref(workcell.get('id'))}${search}`;
  }
  return Urls.operator_dashboard_deref(workcell.get('id'));
};

export default { workcellChoices, createWorkcellPath };
