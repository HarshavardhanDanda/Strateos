import { Breadcrumbs } from '@transcriptic/amino';
import Immutable       from 'immutable';
import _               from 'lodash';
import PropTypes       from 'prop-types';
import React           from 'react';
import { Link }        from 'react-router-dom';

import Urls from 'main/util/urls';

import RunSwitcher from '../RunSwitcher';

class RunBreadCrumbs extends React.Component {
  constructor(props) {
    super(props);
    this.runTitle = this.runTitle.bind(this);
  }

  runTitle(runTitle, runId) {
    return runTitle || `Run ${runId}`;
  }

  render() {
    const { runView, runStatus, project, run } = this.props;

    return (runView ? (
      <Breadcrumbs>
        <Link to={Urls.runspage()}>Runs</Link>
        <Link to={Urls.runspage(runView)}>{_.startCase(runView)}</Link>
        <Link to={Urls.runspage(runView, runStatus)}>{_.startCase(runStatus)}</Link>
        <span>{this.runTitle(run.get('title'), run.get('id'))}</span>
      </Breadcrumbs>
    ) :  (
      <Breadcrumbs>
        <Link key="breadcrumb-project" to={Urls.projects()}>Projects</Link>
        <Link
          to={Urls.runs(project.get('id'))}
        >
          {project.get('name')}
        </Link>
        <If condition={project.get('archived_at')}>
          <span className="tx-type--secondary">(archived)</span>
        </If>
        <RunSwitcher
          runTitle={this.runTitle}
          activeTitle={this.runTitle(run.get('title'), run.get('id'))}
          projectId={project.get('id')}
          currentRunId={run.get('id')}
        >
          <Link
            className="breadcrumbs__item-link--invert"
            to={Urls.run(project.get('id'), run.get('id'))}
          >
            {this.runTitle(run.get('title'), run.get('id'))}
          </Link>
        </RunSwitcher>
      </Breadcrumbs>
    )
    );
  }
}

RunBreadCrumbs.propTypes = {
  project: PropTypes.instanceOf(Immutable.Map),
  run: PropTypes.instanceOf(Immutable.Map)
};

export default RunBreadCrumbs;
