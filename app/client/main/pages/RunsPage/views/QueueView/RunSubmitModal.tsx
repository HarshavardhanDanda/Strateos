import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import Immutable from 'immutable';
import {
  Banner,
  Checkbox,
  Column,
  Icon,
  InputWithUnits,
  LabeledInput,
  Select,
  Table,
  TextBody } from '@transcriptic/amino';
import { Loading } from 'main/components/page';
import { SinglePaneModal } from 'main/components/Modal';
import { renderName } from 'main/pages/RunsPage/views/TableColumns';
import StoresContext from 'main/stores/mobx/StoresContext';
import { RunStatuses } from 'main/stores/mobx/RunFilterStore';
import RunManagementStore, { RunSubmitState } from 'main/stores/mobx/RunManagementStore';
import { WorkcellType } from 'main/stores/mobx/types';
import './RunSubmitModal.scss';

const MODAL_ID = 'RUN_SUBMIT_MODAL';

const RunSubmitModal = observer(() => {
  const { runFilterStore, runManagementStore } = useContext(StoresContext);
  const {
    selectedRuns,
    selectedSubmitWorkcellId,
    selectedRunsAvailableWorkcellOptions,
    selectedSubmitWorkcellType,
    shouldSubmitRunsAggregated,
    selectedRunsCanAggregate,
    submitModalState,
    selectedSubmitWorkcellUri,
  } = runManagementStore;
  const requestPendingOrSuccessful = (submitModalState === RunSubmitState.Success || submitModalState === RunSubmitState.Pending);
  const runStatusForSelectedRun = (submitModalState === RunSubmitState.Success) ? RunStatuses.InProgress : runFilterStore.runStatus;
  const closeButtonText = requestPendingOrSuccessful ? 'Close' : 'Cancel';

  return (
    <SinglePaneModal
      title={`Runs Selected(${selectedRuns.length})`}
      acceptText="Submit"
      dismissText={closeButtonText}
      modalClass="run-submit-modal"
      modalBodyClass="run-submit-modal__body"
      modalSize="large"
      modalId={MODAL_ID}
      onAccept={runManagementStore.bulkSubmitSelectedRuns}
      disableDismiss // Specific to dismissing after submit
      onDismissed={runManagementStore.resetSubmitModalOptions} // on cancel click
      acceptBtnDisabled={requestPendingOrSuccessful}
      type="primary"
      size="small"
      bannerRenderer={messageBanner(submitModalState, selectedSubmitWorkcellUri)}
    >
      <div className="run-submit-modal_workcell-select">
        <LabeledInput label="Workcell">
          <Select
            className="select-workcell"
            name="Workcell"
            placeholder="Select a workcell"
            value={selectedSubmitWorkcellId}
            onChange={e => runManagementStore.setSelectedSubmitWorkcellId(e.target.value)}
            options={selectedRunsAvailableWorkcellOptions}
          />
        </LabeledInput>
      </div>
      <div className="run-submit-modal_run-table">
        <TextBody heavy>Selected runs</TextBody>
        <Table data={Immutable.fromJS(selectedRuns)} loaded id="run-submit" disabledSelection>
          <Column id="name" header="Name" renderCellContent={renderName(runStatusForSelectedRun)} popOver />
          <Column id="protocol" header="Protocol" renderCellContent={immutableColumn(['protocol', 'name'])} popOver />
          <Column id="org" header="Organization"renderCellContent={immutableColumn('organization_name')} />
          <Column id="remove" header="Remove" renderCellContent={trashColumn(runManagementStore, requestPendingOrSuccessful)} />
        </Table>
      </div>
      <div className="run-submit-modal_workcell-based-options">
        {(selectedSubmitWorkcellType == WorkcellType.Meta) && (
          <LabeledInput label="Extra options">
            <MetaOptions
              checked={shouldSubmitRunsAggregated}
              aggregationDisabled={!selectedRunsCanAggregate}
              onChange={runManagementStore.setShouldSubmitRunsAggregated}
            />
          </LabeledInput>
        )}
        {(selectedSubmitWorkcellType == WorkcellType.Mcx) && (
          <LabeledInput label="Extra options">
            <McxOptions />
          </LabeledInput>
        )}
      </div>
    </SinglePaneModal>
  );
});

const messageBanner = (modalState: RunSubmitState, submittedUri: string) => function() {
  const emptyBannerClass = 'run-submit-modal-empty-banner';

  switch (modalState) {
    case RunSubmitState.Ready:
      return <div className={emptyBannerClass} />;
    case RunSubmitState.Failure:
      return (
        <Banner
          bannerType="error"
          bannerMessage={<span>Run scheduling failed.</span>}
        />
      );
    case RunSubmitState.Aborted:
      return (
        <Banner
          bannerType="error"
          bannerMessage={<span>Run scheduling aborted.</span>}
        />
      );
    case RunSubmitState.Pending:
      return (
        <Banner
          bannerType="info"
          bannerMessage={<Loading />}
        />
      );
    case RunSubmitState.Success:
      return (
        <Banner
          bannerType="success"
          bannerMessage={<span>Click <a href={submittedUri} target="_blank" rel="noreferrer"> here</a> to view the SCLE dashboard</span>}
        />
      );
  }
};

interface MetaOptionsProps {
  aggregationDisabled: boolean;
  checked: boolean;
  onChange: (c: boolean) => void;
}

function MetaOptions(props: MetaOptionsProps) {
  const { aggregationDisabled, checked, onChange } = props;
  return (
    <div className="run-submit-modal_meta-options">
      <Checkbox
        id="bulk-submit-aggregation-checkbox"
        checked={formatChecked(checked)}
        disabled={aggregationDisabled}
        onChange={e => onChange(e.target.checked)}
        label={<p className="aggregation-checkbox-label">Aggregate Runs Together</p>} // Workaround for Amino !important
      />
    </div>
  );
}

const McxOptions = observer(() => {
  const { runManagementStore } = useContext(StoresContext);
  const {
    setShouldReserveSubmitDestinies,
    setIsTestSubmission,
    setTestSubmitSessionId,
    setShouldAllowConstraintViolations,
    setMaxMcxScheduleTime,
    shouldReserveSubmitDestinies,
    shouldAllowConstraintViolations,
    isTestSubmission,
    maxMcxScheduleTime,
    workcellSessionOptions,
    testSubmitSessionId,
  } = runManagementStore;
  return (
    <div className="run-submit-modal_mcx-options">
      <div className="col-0">
        <Checkbox
          id="bulk-submit-mcx-reserve-destinies"
          onChange={e => setShouldReserveSubmitDestinies(e.target.checked)}
          checked={formatChecked(shouldReserveSubmitDestinies)}
          label="Reserve Destinies"
        />
        <Checkbox
          id="bulk-submit-mcx-is-test"
          onChange={e => setIsTestSubmission(e.target.checked)}
          checked={formatChecked(isTestSubmission)}
          label="Test Submission"
        />
        <Select
          id="bulk-submit-mcx-test-session"
          value={testSubmitSessionId}
          disabled={!isTestSubmission}
          options={workcellSessionOptions}
          onChange={e => setTestSubmitSessionId(e.target.value)}
        />
      </div>
      <div className="col-1">
        <Checkbox
          id="bulk-submit-mcx-allow-constraint-violations"
          onChange={e => setShouldAllowConstraintViolations(e.target.checked)}
          checked={formatChecked(shouldAllowConstraintViolations)}
          label="Allow Time Constraint Violations"
        />
        <Checkbox
          id="bulk-submit-mcx-time-allowance-check"
          onChange={_ => {}}
          checked={formatChecked(true)} // TODO: local state or in store?
          label="Time Allowance"
        />
        <InputWithUnits
          dimension="time"
          value={maxMcxScheduleTime}
          disabled={false} // TODO: based on time allowance check
          onChange={e => setMaxMcxScheduleTime(e.target.value)}
          name="bulkd-submit-mcx-max-schedule-time"
        />
      </div>
    </div>
  );
});

const formatChecked = (isChecked: boolean) => (isChecked ? 'checked' : 'unchecked');

const immutableColumn = (property: string | Array<string>, defaultValue: unknown = '') => function(record: Immutable.Map<string, unknown>) {
  const value = Array.isArray(property) ?
    record.getIn(property, defaultValue) :
    record.get(property, defaultValue);
  return (<div>{value}</div>);
};

const trashColumn = (runStore: RunManagementStore, requestPendingOrSuccessful: boolean) => function(record: Immutable.Map<string, unknown>) {
  return !requestPendingOrSuccessful ?
    <Icon icon="fa fa-trash" className="run-submit-modal__remove-button" onClick={() => runStore.toggleRun(record.get('id') as string, false)} />
    :
    <Icon icon="fa fa-trash" className="run-submit-modal__remove-button--disabled" />;
};

export { RunSubmitModal, MODAL_ID };
export default RunSubmitModal;
