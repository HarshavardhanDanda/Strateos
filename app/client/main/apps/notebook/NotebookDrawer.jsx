import React from 'react';
import $ from 'jquery';
import Moment from 'moment';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ProjectStore from 'main/stores/ProjectStore';
import ProjectActions from 'main/actions/ProjectActions';
import Urls from 'main/util/urls';
import NotebookActions from 'main/actions/NotebookActions';
import NotebookStore from 'main/stores/NotebookStore';

import { Button } from '@transcriptic/amino';

import Notebook from './Notebook';
import NotebookCard from './NotebookCard';

const notebookListIsEmpty = (notebookList) => {
  if (notebookList == undefined) return false;
  if (notebookList.get('content') == undefined) return false;

  return notebookList.get('content').size === 0;
};

class NotebookDrawer extends React.Component {
  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  static get propTypes() {
    return {
      projectId: PropTypes.string.isRequired,
      project: PropTypes.instanceOf(Immutable.Map)
    };
  }

  constructor() {
    super();

    this.state = {
      trayShown: false,
      current_notebook_id: undefined,
      notebook_list: undefined,
      offsetTop: 103,
      height: window.innerHeight - 146,
      width: 800
    };

    this.headerHeight        = 145;
    this.scroll              = this.scroll.bind(this);
    this.showTray            = this.showTray.bind(this);
    this.hideTray            = this.hideTray.bind(this);
    this.openNotebook        = this.openNotebook.bind(this);
    this.createNotebook      = this.createNotebook.bind(this);
    this.closeNotebook       = this.closeNotebook.bind(this);
    this.pushCell            = this.pushCell.bind(this);
    this.notebookRightOffset = this.notebookRightOffset.bind(this);
  }

  componentDidMount() {
    NotebookActions.loadAll(this.props.projectId);
    ProjectActions.load(this.props.projectId);

    $(this.toggleNotebook).on('mousedown', () => {
      if (!this.state.trayShown) return;

      const handler = (evt) => {
        this.setState({
          width: window.innerWidth - evt.pageX
        });
      };

      $(document).on('mousemove', handler);
      $(document).on('mouseup', () => {
        $(document).off('mousemove', handler);
      });
    });

    $(window).on('showNotebookDrawer', this.showTray);
    $(window).on('hideNotebookDrawer', this.hideTray);

    $(window).resize(this.scroll);
    $(window).scroll(this.scroll);
  }

  componentWillUnmount() {
    $(window).off('showNotebookDrawer', this.showTray);
    $(window).off('hideNotebookDrawer', this.hideTray);
    $(window).off('resize', this.scroll);
    $(window).off('scroll', this.scroll);
  }

  // the header should be sticky on scroll
  scroll() {
    if (window.scrollY < this.headerHeight + 1) {
      const offsetTop = (this.headerHeight - window.scrollY) + 1;

      this.setState({
        offsetTop,
        height: window.innerHeight - offsetTop
      });
    } else if (this.state.offsetTop > 0) {
      this.setState({
        offsetTop: 1,
        height: window.innerHeight
      });
    }
  }

  showTray() {
    this.setState({ trayShown: true });
  }

  hideTray() {
    this.setState({ trayShown: false });
  }

  openNotebook(notebook) {
    if (Transcriptic.current_user.id === notebook.user_id) {
      this.setState({ current_notebook_id: notebook.id });
    } else {
      this.context.router.history.push(
        Urls.notebook(this.props.projectId, notebook.id)
      );
    }
  }

  createNotebook() {
    NotebookActions.create(this.props.projectId).done(this.openNotebook);
  }

  closeNotebook() {
    this.setState({ current_notebook_id: undefined });
  }

  pushCell(text, autoexec = false) {
    if (this.currentNotebook) {
      this.currentNotebook.pushCell(text, autoexec);
    }
  }

  notebookRightOffset() {
    if (this.state.trayShown) {
      return 0;
    } else {
      return -this.state.width;
    }
  }

  render() {
    if (Feature.can_view_notebooks && this.props.project) {
      return (
        <div
          id="notebook-frame"
          ref={(node) => { this.notebookFrame = node; }}
          style={{
            height: this.state.height,
            top: this.state.offsetTop,
            width: this.state.width,
            right: this.notebookRightOffset()
          }}
        >
          <div id="toggle-notebook" ref={(node) => { this.toggleNotebook = node; }}>
            <Choose>
              <When condition={this.state.trayShown}>
                <a onClick={this.hideTray}>
                  <i className="fa fa-bars" />
                </a>
              </When>
              <Otherwise>
                <a onClick={this.showTray}>
                  <i className="fa fa-bars" />
                </a>
              </Otherwise>
            </Choose>
          </div>
          <Choose>
            <When condition={this.state.current_notebook_id}>
              <Notebook
                ref={(node) => { this.currentNotebook = node; }}
                project={this.props.project}
                notebook={NotebookStore.getById(this.state.current_notebook_id)}
                height={this.state.height}
                onSaveNotebook={this.refreshNotebooksList}
                onCloseNotebook={this.closeNotebook}
              />
            </When>
            <Otherwise>
              <div className="browser">
                <h2>Notebooks</h2>
                <If condition={notebookListIsEmpty(this.state.notebook_list)}>
                  <div className="status-label alert alert-info">
                    <h4>For Power Users</h4>
                    <div className="detail">
                      Notebooks are interactive Python environments for working with your data,
                      protocols, runs, and more directly within your projects
                    </div>
                  </div>
                </If>
                <Button
                  id="create-notebook"
                  type="primary"
                  onClick={this.createNotebook}
                >
                  Create New Notebook
                </Button>
                <div className="notebook-list">
                  {NotebookStore.getAllByUserId(Transcriptic.current_user.id)
                    .sort(n => Moment(n.get('last_modified')))
                    .map((n) => {
                      if (n.get('type') === 'notebook') {
                        return (
                          <NotebookCard
                            onClick={notebook => this.openNotebook(notebook.toJS())}
                            onRefreshEvent={this.refreshNotebooksList}
                            project={this.props.project}
                            notebook={n}
                            onViewStatic={() => {
                              this.context.router.history.push(Urls.notebook(this.props.projectId, n.get('id')));
                            }}
                          />
                        );
                      }
                      return null; // eslint-disable-line no-null/no-null
                    })}
                </div>
              </div>
            </Otherwise>
          </Choose>
        </div>
      );
    } else {
      return null; // eslint-disable-line no-null/no-null
    }
  }
}

const getStateFromStores = (props) => {
  const { projectId } = props.match.params;
  const project = ProjectStore.getById(projectId);
  return {
    projectId,
    project
  };
};

const ConnectedNotebookDrawer = ConnectToStores(NotebookDrawer, getStateFromStores);

ConnectedNotebookDrawer.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};

export default ConnectedNotebookDrawer;
