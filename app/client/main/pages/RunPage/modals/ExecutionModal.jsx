import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import NotificationActions from 'main/actions/NotificationActions';
import RunStatusLabel from 'main/components/RunStatusLabel';

import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';

import { SinglePaneModal } from 'main/components/Modal';

import ScheduleView from 'main/project/ScheduleView';

import './ExecutionModal.scss';

class ExecutionModal extends React.Component {

  constructor(props) {
    super(props);

    this.onOpen = this.onOpen.bind(this);

    this.state = { warps: undefined };
  }

  onOpen() {
    const { run } = this.props;
    const url = `${Urls.run(run.getIn(['project', 'id']), run.get('id'))}/warps.json`;

    return ajax
      .get(url)
      .done(data => this.setState({ warps: data }))
      .fail((...response) => NotificationActions.handleError(...Array.from(response || [])));
  }

  render() {
    const { warps } = this.state;

    return (
      <SinglePaneModal
        modalId="EXECUTION_MODAL"
        modalSize="large"
        onOpen={this.onOpen}
        title="Execution details"
        modalBodyClass="execution-modal"
      >
        <div className="execution-modal__status">
          <RunStatusLabel run={this.props.run} />
        </div>
        <div>
          <Choose>
            <When condition={warps != undefined}>
              <Choose>
                <When condition={warps.length}>
                  <ScheduleView warps={warps} />
                </When>
                <Otherwise>
                  <div className="alert alert-info icon-and-adjacent-text">
                    <i className="fa fa-cogs" />
                    {'This run has no warps yet. You\'ll be able to see the schedule after the run has been executed.'}
                  </div>
                </Otherwise>
              </Choose>
            </When>
            <Otherwise>
              Loading...
            </Otherwise>
          </Choose>
        </div>
      </SinglePaneModal>
    );
  }
}

ExecutionModal.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map)
};

export default ExecutionModal;
