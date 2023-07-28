import classNames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';
import capitalize from 'underscore.string/capitalize';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import ProtocolTitle from 'main/components/ProtocolTitle';
import UserStore from 'main/stores/UserStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import WorkflowStore from 'main/stores/WorkflowStore';

import { Tooltip, Card, Label, Button, DateTime } from '@transcriptic/amino';
import { WorkflowActions } from '../../actions/WorkflowActions';

import './RunCard.scss';

function FeedbackStatus(props) {
  return (
    <div className="run-card__success-status">
      <Button link type="primary" onClick={props.onShowFeedback}>
        <i className="fa fa-comment" />
      </Button>
      <Choose>
        <When condition={props.success === true}>
          <Label title="Succeeded" type="success" />
        </When>
        <Otherwise>
          <Label title="Failed" type="danger" />
        </Otherwise>
      </Choose>
    </div>
  );
}

FeedbackStatus.propTypes = {
  success: PropTypes.bool,
  onShowFeedback: PropTypes.func
};

class RunCard extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      instanceLabel: undefined
    };
  }

  componentDidMount() {
    const canFetchWorkflowInstance = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_EXPERIMENTS);
    const instance = WorkflowStore.getInstanceByRunId(this.props.run.get('id'));
    if (!_.isUndefined(instance)) {
      this.setState({ instanceLabel: instance.label });
    } else if (canFetchWorkflowInstance) this.fetchInstanceByRun();
  }

  fetchInstanceByRun() {
    const { run } = this.props;
    WorkflowActions.loadInstanceByRun(run.get('id'))
      .then((res) => this.setState({ instanceLabel: res.definitionLabel }));
  }

  progressPercent() {
    if (_.includes(['canceled', 'aborted', 'complete', 'pending', 'rejected'], this.props.run.get('status'))) {
      return 100;
    }

    return this.props.run.get('progress') || 0;
  }

  friendlyStatus() {
    const { run } = this.props;
    const pending_shipment_ids = run.get('pending_shipment_ids');
    const awaitingShipment = pending_shipment_ids && pending_shipment_ids.count() > 0;
    const billingNotValid = !run.get('billing_valid?');

    switch (this.props.run.get('status')) {
      case 'accepted':
        if (awaitingShipment) {
          return 'Awaiting Shipment';
        } else if (billingNotValid) {
          return 'Awaiting Payment Method';
        } else {
          return 'In Queue';
        }
      case 'in_progress':
        return 'Running';
      case 'complete':
        return '';
      case 'aborted':
        return <span className="tx-type--error">Aborted</span>;
      case 'canceled':
        return <span className="tx-type--error">Canceled</span>;
      case 'rejected':
        return run.get('reject_reason');
      case 'pending':
        return 'Pending Approval';
      default:
        return undefined;
    }
  }

  friendlyStatusTestMode() {
    const status = this.props.run.get('status');
    switch (status) {
      case 'accepted':
        return 'Ready to Execute';
      case 'in_progress':
        return 'Executing';
      default:
        return capitalize(status);
    }
  }

  evaluateRedirectUrl(run) {
    const { runView, runStatus } = this.props;
    if (runView && runStatus) {
      return Urls.runspage_instructions(run.get('id'), runView, runStatus);
    }
    return Urls.org ?
      Urls.run(run.get('project_id') || run.get('project').get('id'), run.get('id')) :
      Urls.deref(run.get('id'));
  }

  renderFriendlyStatus() {
    const runStatus = this.props.run.get('status');
    const isAbortedOrCanceledOrCompleted = runStatus === 'aborted' || runStatus === 'canceled' || runStatus === 'complete';
    if (this.props.run.get('test_mode')) {
      return this.friendlyStatusTestMode();
    } else {
      if (isAbortedOrCanceledOrCompleted && this.props.run.get('success') != undefined) {
        return (
          <FeedbackStatus
            onShowFeedback={() => { this.props.onShowFeedback(this.props.run.get('id')); }}
            success={this.props.run.get('success')}
          />
        );
      }

      return this.friendlyStatus();
    }
  }

  render() {
    const { run, owner } = this.props;
    const runTitle  = run.get('title') || `Run ${run.get('id')}`;
    const status    = run.get('status');
    const cardClass = classNames('run-card', this.props.className);
    const url = this.evaluateRedirectUrl(run);
    const to = { to: (AcsControls.isFeatureEnabled(
      FeatureConstants.VIEW_EDIT_RUN_DETAILS) ||
      AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUN_DETAILS)) ?
      url : undefined };

    return (
      <Card className={cardClass} {...to} tagLink={!Urls.org}>
        <div
          className={classNames(
            'run-card__progress',
            `run-card__progress--${status}`
          )}
          style={{
            width: `${this.progressPercent()}%`
          }}
        />
        <div className="run-card__details">
          <div className="run-card__top-line">
            <div>
              <h3 className={classNames('run-card__title', { 'run-card__highlighted': this.props.isHighlighted })}>{runTitle}</h3>
              <p className={classNames('desc', 'monospace', { 'run-card__highlighted': this.props.isHighlighted })}>{run.get('id')}</p>
              <If condition={status === 'rejected'}>
                <h3 className="run-card__description">{run.get('reject_description')}</h3>
              </If>
            </div>
            <Choose>
              <When condition={run.get('test_mode')}>
                <Tooltip
                  placement="bottom"
                  title="This is a test mode run"
                >
                  <i className="fa fa-flask" />
                </Tooltip>
              </When>
              <Otherwise>
                <div className="run-card__status">{this.renderFriendlyStatus()}</div>
              </Otherwise>
            </Choose>
          </div>
          <div className="run-card__bottom-info">
            <p className={classNames('desc', { 'run-card__highlighted': this.props.isHighlighted })}>
              {`
                Created by ${owner ? owner.get('name') : ''} on `}
              <DateTime format="absolute-date-time" timestamp={run.get('created_at')} />
            </p>
            <p className={classNames('desc', { 'run-card__highlighted': this.props.isHighlighted })}>
              <span className="tx-type--heavy">{this.state.instanceLabel ? 'Workflow:' : 'Protocol:' } </span>
              <ProtocolTitle className={classNames('desc', { 'run-card__highlighted': this.props.isHighlighted })} id={this.state.instanceLabel ? this.state.instanceLabel : run.get('protocol_id')} />
            </p>
          </div>
        </div>
      </Card>
    );
  }
}

RunCard.propTypes = {
  className: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Object)
  ]),
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  owner: PropTypes.instanceOf(Immutable.Map),
  onShowFeedback: PropTypes.func,
  isTestAccount: PropTypes.bool,
  isHighlighted: PropTypes.bool,
  projectId: PropTypes.string,
  runView: PropTypes.oneOf(['approvals', 'queue']),
  runStatus: PropTypes.oneOf(['all_runs', 'aborted', 'accepted', 'complete', 'in_progress'])
};

const getStateFromStores = ({ run }) => {
  return {
    owner: UserStore.getById(run.get('owner_id'))
  };
};

const Connected = ConnectToStores(RunCard, getStateFromStores);

Connected.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default Connected;
