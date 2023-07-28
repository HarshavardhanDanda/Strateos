import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import Urls from 'main/util/urls';
import CreateOrEditProjectModal from 'main/components/CreateOrEditProjectModal';
import ProtocolBrowserModal from 'main/project/ProtocolBrowserModal';
import BSLLabel from 'main/components/bsl/BSLLabel';
import ModalActions from 'main/actions/ModalActions';
import { Header, Button } from '@transcriptic/amino';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class ProjectHeader extends React.Component {
  static get propTypes() {
    return {
      project: PropTypes.object,
      cloneId: PropTypes.string,
      datasetId: PropTypes.string,
      notebookId: PropTypes.string
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor() {
    super();
    this.onSelectProtocol = this.onSelectProtocol.bind(this);
  }

  onSelectProtocol(protocolId) {
    const url = Urls.run_launch(this.props.project.get('id'), protocolId);
    return this.context.router.history.push(url);
  }

  getTitle() {
    const { project } = this.props;
    return (
      <div className="project-header">
        <Link to={Urls.project(project.get('id'))} className="tx-type--secondary">
          { project.get('name') }
        </Link>
        <If condition={project.get('archived_at')}>
          <span className="tx-type--secondary"> (Archived)</span>
        </If>
        <a
          className="project-settings-btn"
          onClick={() => ModalActions.open('EditProjectModal')}
        >
          <i className="fa fa-cog" />
        </a>
      </div>
    );
  }

  render() {
    const { project, cloneId, datasetId, notebookId } = this.props;
    const links = [
      {
        name: 'Dashboard',
        url: Urls.runs(project.get('id'))
      },
      {
        name: 'Queries',
        url: Urls.queries(project.get('id'))
      }
    ];

    if (cloneId) {
      links.push({
        name: 'Clone',
        url: Urls.run_clone(project.get('id'), cloneId)
      });
    }
    if (datasetId) {
      links.push({
        name: 'Dataset',
        url: Urls.dataset(project.get('id'), datasetId)
      });
    }
    if (notebookId) {
      links.push({
        name: 'Notebook',
        url: Urls.notebook(project.get('id'), notebookId)
      });
    }

    return (
      <Header title={this.getTitle()} links={links}>
        <div>
          <BSLLabel bsl={project.get('bsl')} />
          <CreateOrEditProjectModal project={project} />
          <div className="pull-right">
            <If condition={cloneId == undefined}>
              <div>
                <ProtocolBrowserModal
                  project={this.props.project}
                  onSelectProtocol={this.onSelectProtocol}
                />
                <If condition={AcsControls.isFeatureEnabled(FeatureConstants.LAUNCH_RUN)}>
                  <Button
                    type="primary"
                    size="large"
                    id="create-new-run"
                    key="create_run"
                    onClick={() => ProtocolBrowserModal.launchModal()}
                  >
                    Launch Run
                  </Button>
                </If>
              </div>
            </If>
          </div>
        </div>
      </Header>
    );
  }
}

export default ProjectHeader;
