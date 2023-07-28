import $         from 'jquery';
import PropTypes from 'prop-types';
import React     from 'react';

import Urls from 'main/util/urls';
import { SinglePaneModal } from 'main/components/Modal';
import NotebookActions from 'main/actions/NotebookActions';
import NotebookStore from 'main/stores/NotebookStore';
import { Page, PanelLayout, Spinner, DateTime } from '@transcriptic/amino';
import ProjectActions from 'main/actions/ProjectActions';
import ModalActions from 'main/actions/ModalActions';
import ProjectStore from 'main/stores/ProjectStore';
import ProjectHeader from 'main/components/ProjectHeader';
import ajax from 'main/util/ajax';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';

const MODAL_ID = 'CONFIRM_FORK_MODAL';

class ConfirmForkModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fork = this.fork.bind(this);
    this.state = {
      loading: false
    };
  }

  fork() {
    this.setState({
      loading: true
    });
    return NotebookActions.fork(
      this.props.project_id,
      this.props.notebook_id
    ).done(() => {
      $(window).trigger('showNotebookDrawer');
      return ModalActions.close(MODAL_ID);
    });
  }

  render() {
    return (
      <SinglePaneModal
        modalId={MODAL_ID}
        title="Confirm Fork"
        acceptText={this.state.loading ? 'Processing...' : 'Fork this Notebook'}
        onAccept={this.fork}
        acceptBtnDisabled={this.state.loading}
      >
        <div>
          <p>
            {
              'Forking this notebook will create a copy that you can edit. It will not affect the original notebook.'
            }
          </p>
        </div>
      </SinglePaneModal>
    );
  }
}

ConfirmForkModal.propTypes = {
  project_id: PropTypes.string.isRequired,
  notebook_id: PropTypes.string.isRequired
};

class StaticNotebook extends React.Component {
  constructor(props, context) {
    super(props, context);

    // ref that is set onMount
    this.nbviewer_iframe = undefined;
    this.setFrameHeight = this.setFrameHeight.bind(this);

    this.state = {
      height: 100,
      statusCode: undefined
    };
  }

  componentDidMount() {
    return ajax
      .when(
        ProjectActions.load(this.props.match.params.projectId),
        NotebookActions.loadAll(this.props.match.params.projectId)
      )
      .fail(() =>
        this.setState({
          statusCode: 400
        })
      );
  }

  setFrameHeight() {
    if (this.nbviewer_iframe) {
      this.setState({
        height: this.nbviewer_iframe.contentWindow.document.body.scrollHeight
      });
    }
  }

  render() {
    const { project, notebook } = this.props;

    return (
      <Page
        title={`Notebook: ${this.props.match.params.notebookId}`}
        statusCode={this.state.statusCode}
      >
        <Choose>
          <When condition={!project}>
            <Spinner />
          </When>
          <Otherwise>
            <PanelLayout panelBody={false}>
              <ProjectHeader project={project} />
              <div>
                <Choose>
                  <When condition={notebook}>
                    <div className="static-notebook-header">
                      <h2>
                        {notebook.get('name')}
                      </h2>
                      <h4>
                        {`Authored by ${notebook.getIn(['user', 'name'])} - Updated on `}
                        <DateTime
                          timestamp={notebook.get('last_modified')}
                          format="absolute-format"
                        />{' '}
                        —{' '}
                        <ConfirmForkModal
                          project_id={this.props.match.params.projectId}
                          notebook_id={this.props.match.params.notebookId}
                        />
                        <If condition={!Transcriptic.current_user.system_admin}>
                          <a onClick={() => ModalActions.open(MODAL_ID)}>
                            Fork this Notebook
                          </a>
                        </If>
                      </h4>
                    </div>
                  </When>
                  <Otherwise>
                    <Spinner />
                  </Otherwise>
                </Choose>
                <iframe
                  title="static-notebook"
                  className="static-notebook"
                  ref={(node) => {
                    this.nbviewer_iframe = node;
                  }}
                  style={{
                    height: this.state.height
                  }}
                  onLoad={this.setFrameHeight}
                  src={`${Urls.notebook(
                    this.props.match.params.projectId,
                    this.props.match.params.notebookId
                  )}.nbviewer`}
                />
              </div>
            </PanelLayout>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

StaticNotebook.propTypes = {
  project: PropTypes.object,
  notebook: PropTypes.object,
  match: PropTypes.shape({
    params: PropTypes.shape({
      notebookId: PropTypes.string,
      projectId: PropTypes.string
    })
  })
};

const getStateFromStores = (props) => {
  const project = ProjectStore.getById(props.match.params.projectId);
  const notebook = NotebookStore.getById(props.match.params.notebookId);

  return {
    project,
    notebook
  };
};

export default ConnectToStores(StaticNotebook, getStateFromStores);
