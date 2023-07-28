import Immutable      from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import { Button } from '@transcriptic/amino';

import ModalActions         from 'main/actions/ModalActions';
import RunActions           from 'main/actions/RunActions';
import { PageHeader }       from 'main/components/PageLayout';
import RunStatusLabel       from 'main/components/RunStatusLabel';
import UserProfile          from 'main/components/UserProfile';
import BSLLabel             from 'main/components/bsl/BSLLabel';
import ProtocolBrowserModal from 'main/project/ProtocolBrowserModal';
import SessionStore         from 'main/stores/SessionStore';
import Urls                 from 'main/util/urls';
import AcsControls          from 'main/util/AcsControls';
import FeatureConstants     from '@strateos/features';
import LabConsumerActions   from 'main/actions/LabConsumerActions';
import ProgramExecutionsActions from 'main/actions/ProgramExecutionsActions';
import ImplementationProjectIndicator from 'main/components/ImplementationProjectIndicator';
import _ from 'lodash';

import FeatureStore         from 'main/stores/FeatureStore';
import WorkflowStore from 'main/stores/WorkflowStore';
import { WorkflowActions } from '../../../../actions/WorkflowActions';
import RunBreadCrumbs from '../RunBreadCrumbs';

const HeaderPrimary = ({ run, project, owner, runView, isImplementationProject }) => {
  const statuses       = ['pending', 'accepted'];
  const runStatus      = run.get('status');
  const billingIsValid = run.get('billing_valid?');

  return [
    (owner && (
      <UserProfile user={owner} label="Submitter" invert key={owner.get('id')} />
    )),

    <BSLLabel key="bsl-label" bsl={project.get('bsl')} invert />,

    <RunStatusLabel key="run-status-label" run={run} />,

    (isImplementationProject && (
      <ImplementationProjectIndicator organizationName={run.get('organization_name')} />
    )),

    (run.get('test_mode') ? (
      <RunStatusLabel key="warning-label" run={run} isTestMode />
    ) : (
      statuses.includes(runStatus) && !billingIsValid && SessionStore.isOrgAdmin() && !runView) ? (
        <Button
          key="warning-label"
          type="warning"
          size="small"
          onClick={() => ModalActions.open('EditProjectModal')}
        >
          Add Payment
        </Button>
      ) : undefined
    ),

    (AcsControls.isFeatureEnabled(FeatureConstants.LAUNCH_RUN) && !runView && (
      <div key="create_run" className="tx-inline__item tx-inline__item--xxs">
        <Button
          type={isImplementationProject ? 'secondary' : 'primary'}
          size="small"
          id="create-new-run"
          onClick={() => ProtocolBrowserModal.launchModal()}
        >
          Launch Run
        </Button>
      </div>
    ))
  ];
};

class Header extends React.Component {
  static get propTypes() {
    return {
      project: PropTypes.instanceOf(Immutable.Map),
      run: PropTypes.instanceOf(Immutable.Map),
      owner: PropTypes.instanceOf(Immutable.Map),
      runView: PropTypes.string,
      runStatus: PropTypes.string
    };
  }

  constructor(props) {
    super(props);
    this.onSwitchToExternalRun = this.onSwitchToExternalRun.bind(this);
    this.onClickExecute = this.onClickExecute.bind(this);
    this.onExecutePostRunProgram = this.onExecutePostRunProgram.bind(this);
    this.state = {
      executing: false,
      hasLabConsumers: false,
      instanceId: undefined,
      postRunProgramExecuting: false
    };
  }

  componentDidMount() {
    const canFetchWorkflowInstance = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_EXPERIMENTS);
    this.checkForLabConsumers(this.props.run.get('lab_id'));
    const instance = WorkflowStore.getInstanceByRunId(this.props.run.get('id'));
    if (!_.isUndefined(instance)) {
      this.setState({ instanceId: instance.id });
    } else if (canFetchWorkflowInstance) this.fetchInstanceByRun();
  }

  onClickExecute() {
    const { run, project } = this.props;
    RunActions.execute(project.get('id'), run.get('id'))
      .done(() => {
        this.setState({ executing: true });
        const msg = 'Your run is executing and this may take a few minutes' +
          ' Please check this page later.';
        alert(msg);
      });
  }

  fetchInstanceByRun() {
    const { run } = this.props;
    WorkflowActions.loadInstanceByRun(run.get('id'))
      .then((res) => this.setState({ instanceId: res.id }));
  }

  onSwitchToExternalRun() {
    const { run, runView } = this.props;
    const isInternal = run.get('internal_run');
    const message = `
      Run is currently ${isInternal ? 'internal' : 'external'}. Are you sure you want to switch it to ${isInternal ? 'external' : 'internal'}
    `;

    if (window.confirm(message)) {
      runView ? RunActions.updateRun(run.get('id'), { internal_run: !isInternal })
        :
        RunActions.update(
          run.getIn(['project', 'id']),
          run.get('id'),
          { run: { internal_run: !isInternal } }
        );
    }
  }

  termination(action, actionName) {
    const { run, project } = this.props;

    let message = `${actionName} the run?`;

    if (run.get('dependents') && run.get('dependents').size > 0) {
      message += ` The following dependent runs will also be ${actionName.toLowerCase()}ed:` +
        ` ${run.get('dependents').map(dependent => dependent.get('id'))}`;
    }

    if (confirm(message)) {
      return action(project.get('id'), run.get('id')).done(() => ModalActions.open('RunFeedbackModal'));
    }

    return undefined;
  }

  checkForLabConsumers(labId) {
    LabConsumerActions.loadLabConsumersByLab(labId).done((response) => {
      this.setState({ hasLabConsumers: response && response.data && response.data.length > 1 });
    });
  }

  onExecutePostRunProgram() {
    this.setState({ postRunProgramExecuting: true });
    ProgramExecutionsActions.createAndExecutePostRunProgram(this.props.run.get('id'))
      .always(() => {
        this.setState({ postRunProgramExecuting: false });
      });
  }

  actions() {
    const { run, project, runView, runStatus, reactionId } = this.props;
    const shouldShowFeedback = ['aborted', 'canceled', 'complete'].includes(run.get('status'));
    const isFeedbackPresent = run.get('success') != undefined && run.get('success_notes');
    const runType = runView || (run.get('status') === 'pending' ? 'approvals' : 'queue');
    const organization_id = run.get('organization_id');
    const lab_id = run.get('lab_id');
    const hasRunStateMgmtPermission = AcsControls.isFeatureEnabled(FeatureConstants.RUN_STATE_MGMT);
    const canEditRun = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_EDIT_RUN_DETAILS) && (organization_id == SessionStore.getOrg().get('id'));
    const canViewLabRuns = FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_RUNS_IN_LABS, lab_id);
    const canViewRunSettings = canEditRun || canViewLabRuns;
    const canCloneLabRun = FeatureStore.hasFeatureInLab(FeatureConstants.CLONE_RUN_IN_LAB, lab_id);
    const canCancelLabRun = FeatureStore.hasFeatureInLab(FeatureConstants.CANCEL_RUN_IN_LAB, lab_id);
    const switchToExternalRun = (runView ? hasRunStateMgmtPermission : !!SessionStore.isAdmin()) && (this.state.hasLabConsumers || !SessionStore.hasFeature('ccs_org'));
    const cloneRunUrl = Urls.run_clone(project.get('id'), run.get('id'));
    const canShowExperiment = this.state.instanceId && AcsControls.isFeatureEnabled(FeatureConstants.VIEW_EXPERIMENTS);
    const canTriggerRun = runStatus === 'complete' && FeatureStore.hasFeatureInLab(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE, lab_id) && !this.state.postRunProgramExecuting;

    const actions = [
      {
        text: 'View Activity Log',
        icon: 'fas fa-file-chart-line',
        onClick: () => ModalActions.open('VIEW_ACTIVITY_LOG_MODAL'),
        disabled: false,
      },
      {
        text: 'Upload Data',
        icon: 'fas fa-upload',
        onClick: () => ModalActions.open('UPLOAD_FILE_MODAL'),
        disabled: false
      },
      {
        text: 'Delete Data',
        icon: 'fas fa-trash',
        onClick: () => ModalActions.open('DELETE_FILE_MODAL'),
        disabled: false,
      },
      {
        text: 'Download Data',
        icon: 'fas fa-download',
        onClick: () => ModalActions.open('DOWNLOAD_FILE_MODAL'),
        disabled: false,
      },
      {
        text: 'Run Settings',
        onClick: () => { ModalActions.open('RunSettingsModal'); },
        icon: 'fa fa-cogs',
        disabled: !canViewRunSettings
      },
      {
        text: 'Clone Run',
        to: runView ? `${cloneRunUrl}/${runView}` : cloneRunUrl,
        icon: 'fa fa-clone',
        disabled: !run.get('launch_request_id') || !(canEditRun || canCloneLabRun)
      },
      {
        text: 'View Reaction Summary',
        href: Urls.reaction(run.getIn(['project', 'organization', 'subdomain']), reactionId),
        icon: 'fa fa-chart-network',
        disabled: !reactionId
      },
      {
        text: isFeedbackPresent ? 'View Run Feedback' : 'Leave Run Feedback',
        onClick: () => ModalActions.open('RunFeedbackModal'),
        icon: isFeedbackPresent ? 'far fa-comment' : 'fas fa-pencil-alt',
        disabled: !shouldShowFeedback
      },
      {
        text: 'Prime Directive',
        href: Urls.runspage_prime_directive(run.get('id'), runType, runStatus || run.get('status')),
        icon: 'fa fa-flask',
        disabled: !canViewLabRuns && !SessionStore.isAdmin()
      },
      {
        text: 'Switch to External Run',
        icon: 'fa fa-exchange-alt',
        onClick: this.onSwitchToExternalRun,
        disabled: !run.get('internal_run') || !switchToExternalRun
      },
      {
        text: 'Show Execution',
        icon: 'fa fa-play',
        onClick: () => ModalActions.open('EXECUTION_MODAL'),
        disabled: !!run.get('test_mode') || (!canViewLabRuns && !SessionStore.isAdmin())
      },
      {
        text: 'See Launch Parameters',
        icon: 'fa fa-rocket',
        onClick: () => ModalActions.open('PARAMETERS_MODAL'),
        disabled: run.get('launch_request_id') == undefined
      },
      {
        text: 'Show Experiment',
        href: Urls.get_workflow_instance(this.state.instanceId),
        icon: 'far fa-file-alt',
        disabled: !canShowExperiment
      },
      {
        text: 'Trigger program',
        icon: 'fa fa-play-circle',
        onClick: this.onExecutePostRunProgram,
        disabled: !canTriggerRun
      }
    ];

    switch (run.get('status')) {
      case 'accepted':
        if (run.get('test_mode')) {
          actions.push({
            text: this.state.executing ? 'Executing...' : 'Execute',
            icon: this.state.executing ? 'fa fa-clock-o' : 'fa fa-fast-forward',
            onClick: this.state.executing ? undefined : this.onClickExecute
          });
        }
        actions.push({
          text: 'Cancel Run',
          icon: 'fa fa-times',
          onClick: () => this.termination(RunActions.cancel, 'Cancel'),
          disabled: !(canEditRun || canCancelLabRun)
        });
        break;
      case 'pending':
        actions.push({
          text: 'Cancel Run',
          icon: 'fa fa-times',
          onClick: () => this.termination(RunActions.cancel, 'Cancel'),
          disabled: !(canEditRun || canCancelLabRun)
        });
        break;
      case 'in_progress':
        if (Transcriptic.current_user.system_admin || canViewLabRuns) {
          actions.push({
            text: 'Abort Run',
            icon: 'fa fa-times',
            onClick: () => {
              canViewLabRuns ?
                (
                  confirm('Are you sure you want to abort the run?') && (
                    RunActions.abortRun(run.get('id')).done(() => ModalActions.open('RunFeedbackModal')))
                )
                : this.termination(RunActions.abort, 'Abort');
            }
          });
        }
        break;
      default:
        break;
    }

    return actions;
  }

  render() {
    const { runView, runStatus, run, project, owner } = this.props;
    const isImplementationProject = project.get('is_implementation');

    return (
      <PageHeader
        titleArea={(
          <RunBreadCrumbs
            runView={runView}
            runStatus={runStatus}
            run={run}
            project={project}
            invert
          />
        )}
        primaryInfoArea={HeaderPrimary({ run, project, owner, runView, isImplementationProject })}
        actions={this.actions()}
        type={isImplementationProject ? 'brand' : 'primary'}
      />
    );
  }
}

export default Header;
