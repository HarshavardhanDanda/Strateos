import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';

import { PageLoading }               from '@transcriptic/amino';
import RunActions                    from 'main/actions/RunActions';
import SupportTicketActions          from 'main/actions/SupportTicketActions';
import { TabLayout }                 from 'main/components/TabLayout';
import ConnectToStores               from 'main/containers/ConnectToStoresHOC';
import Conversation                  from 'main/conversation/Conversation';
import assembleFullJSON              from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON } from 'main/helpers/RunPage/loadStatus';
import RunStore                      from 'main/stores/RunStore';
import PropTypes                     from 'prop-types';
import ACSControls                   from 'main/util/AcsControls';
import FeatureConstants              from '@strateos/features';
import UserActions                   from 'main/actions/UserActions';

// Stores
import CreateSupportTicket  from './CreateSupportTicket';
import PastTickets          from './PastTickets';
import WaitingShipmentAlert from './WaitingShipmentAlert';

import './RunTimelinePage.scss';

class SupportView extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onCreateSupportTicket = this.onCreateSupportTicket.bind(this);

    this.state = {
      supportTickets: Immutable.List(),
      statusCode: undefined
    };
  }

  componentWillMount() {
    const { runId } = this.props.match.params;
    const { projectId, run } = this.props;
    const { runLoaded } = loadStatus(run);

    if (!runLoaded) {
      this.fetchAndSaveData({ shouldFetchRun: !runLoaded });
    }

    SupportTicketActions.loadAll(projectId, runId)
      .then(tickets => {
        this.setState({ supportTickets: Immutable.List(tickets.results) });
        UserActions.loadUsers(tickets.results.map(ticket => ticket.userId));
      });
  }

  onCreateSupportTicket(formData, clearForm) {
    const { runId } = this.props.match.params;
    const { projectId } = this.props;

    SupportTicketActions.create(projectId, runId, formData)
      .then((ticket) => {
        clearForm();

        this.setState({ supportTickets: this.state.supportTickets.push(ticket) });
      });
  }

  onStatusCodeChange(newStatusCode) {
    this.setState({ statusCode: newStatusCode });
  }

  fetchAndSaveData({ shouldFetchRun }) {
    if (shouldFetchRun) this.fetchRun();
  }

  fetchRun() {
    const { runId } = this.props.match.params;
    const { projectId } = this.props;

    return RunActions.loadMinimal(projectId, runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  render() {
    const { run } = this.props;
    const { runLoaded } = loadStatus(this.props.run);

    let shipment_ids;
    if (runLoaded) {
      shipment_ids = this.props.run.get('pending_shipment_ids');
    }

    if (!runLoaded) {
      return <PageLoading />;
    }

    return (
      <TabLayout>
        <div className="tx-timeline">
          <If condition={shipment_ids != undefined ? shipment_ids.length : undefined}>
            <WaitingShipmentAlert shipment_ids={shipment_ids} />
          </If>

          <If condition={!Transcriptic.current_user.system_admin}>
            <CreateSupportTicket onCreateSupportTicket={this.onCreateSupportTicket} />
          </If>

          <If condition={this.state.supportTickets && (this.state.supportTickets.size > 0)}>
            <PastTickets supportTickets={this.state.supportTickets} />
          </If>
          <If condition={ACSControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)}>
            <Conversation conversation_id={run.get('conversation_id')} />
          </If>
        </div>
      </TabLayout>
    );
  }
}

SupportView.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string,
      runId: PropTypes.string
    })
  })
};

const getDataFromStores = (props) => {
  const { runId } = props.match.params;
  const run = RunStore.getById(runId);
  const projectId = props.match.params.projectId || (run && run.get('project_id'));

  let fullJSON;

  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run });
  }

  return { run: fullJSON, projectId };
};

const ConnectedSupportView = ConnectToStores(SupportView, getDataFromStores);

ConnectedSupportView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      runId: PropTypes.string
    })
  })
};

export default ConnectedSupportView;
