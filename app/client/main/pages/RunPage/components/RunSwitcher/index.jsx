import PropTypes from 'prop-types';
import React     from 'react';

import { PopOverSwitcher } from '@transcriptic/amino';

import RunAPI               from 'main/api/RunAPI';
import { AnyChildrenShape } from 'main/proptypes';
import Urls                 from 'main/util/urls';

// Fetches and displays recent runs from a project for the user to select from
class RunSwitcher extends React.Component {
  static get propTypes() {
    return {
      projectId: PropTypes.string.isRequired,
      runTitle: PropTypes.func.isRequired,
      activeTitle: PropTypes.string.isRequired,
      currentRunId: PropTypes.string.isRequired,
      children: AnyChildrenShape
    };
  }

  constructor(props) {
    super(props);
    this.state = { runs: undefined };
  }

  componentDidMount() {
    this.fetch(this.props.projectId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.projectId !== prevProps.projectId) {
      this.fetch(this.props.projectId);
    }
  }

  fetch() {
    const options = {
      doIngest: false,
      filters: {
        project_id: this.props.projectId,
        test_mode: false
      },
      limt: 15,
      sortBy: ['-created_at'],
      fields: {
        runs: ['id', 'status', 'title']
      }
    };
    this.setState({ runs: undefined }, () => {
      RunAPI.index(options).then((response) => {
        this.setState({ runs: response.data });
      });
    });
  }

  labelForStatus(status) {
    const labelMapping = {
      pending: 'pending',
      accepted: 'pending',
      complete: 'success',
      aborted: 'error',
      canceled: 'error',
      'test-mode': 'warning',
      in_progress: 'default'
    };

    return labelMapping[status];
  }

  makeSwitcherItems() {
    if (!this.state.runs) {
      return undefined;
    }

    return this.state.runs
      .filter(r => r.id !== this.props.currentRunId)
      .map((run) => {
        const id = run.id;
        const { title, status } = run.attributes;
        return {
          id: id,
          name: this.props.runTitle(title, id),
          url: Urls.run(this.props.projectId, id),
          label: this.labelForStatus(status)
        };
      });
  }

  render() {
    return (
      <PopOverSwitcher
        items={this.makeSwitcherItems()}
        activeTitle={this.props.activeTitle}
      >
        {this.props.children}
      </PopOverSwitcher>
    );
  }
}

export default RunSwitcher;
