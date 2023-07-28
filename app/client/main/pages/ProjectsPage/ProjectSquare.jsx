import classNames  from 'classnames';
import Immutable   from 'immutable';
import { inflect } from 'inflection';
import _           from 'lodash';
import BSLLabel    from 'main/components/bsl/BSLLabel';
import PropTypes   from 'prop-types';
import React       from 'react';
import { Link }    from 'react-router-dom';

import CommonUiUtil from 'main/util/CommonUiUtil';
import ImplementationProjectIndicator from 'main/components/ImplementationProjectIndicator';
import ProjectActions from 'main/actions/ProjectActions';
import ModalActions from 'main/actions/ModalActions';
import Urls from 'main/util/urls';
import getProjectActions from 'main/project/ProjectUIActions';
import FavoriteAPI from 'main/api/FavoriteAPI';
import FavoriteStore  from 'main/stores/FavoriteStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import { Highlighted, Card, Label, ActionMenu, Tooltip, DateTime } from '@transcriptic/amino';

import './ProjectSquare.scss';
import './RunTypeSummary.scss';

function NewProjectSquare() {

  return (
    <div
      className="project-square project-square--create-new"
      onClick={() => { ModalActions.open('CreateProjectModal'); }}
    >
      <div className="project-square__contents">
        <i className="project-square__icon fa fa-plus" />
        <div className="project-square__describe">Create New Project</div>
      </div>
    </div>
  );
}

NewProjectSquare.contextTypes = {
  router: PropTypes.object.isRequired
};

function RunTypeSummary(props) {
  return (
    <div className="run-type-summary">
      <Tooltip
        title={`${inflect('Run', props.count)} ${props.description}`}
        placement="bottom"
      >
        <Label icon={props.icon} type={props.type} title={`${props.count}`} inverted />
      </Tooltip>
    </div>
  );
}

RunTypeSummary.propTypes = {
  count: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};
class ProjectSquare extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isHovered: false
    };
  }

  toggleStar() {
    const { project, onToggleProjectStar } = this.props;
    const favorite = FavoriteStore.getByFavorableId(project.get('id'));
    if (_.isEmpty(favorite.toJS())) {
      FavoriteAPI.create({
        attributes: {
          favorable_id: project.get('id'),
          favorable_type: 'Project'
        }
      });
    } else {
      FavoriteAPI.destroy(favorite.get('id')).always(() => {
        if (onToggleProjectStar) {
          onToggleProjectStar(project);
        }
      });
    }
  }

  onUnhideProject() {
    const projectId = this.props.project.get('id');
    const msg = 'Are you sure you want to expose this project to the client Organization?';
    if (CommonUiUtil.confirmWithUser(msg)) {
      ProjectActions.update(projectId, { is_implementation: false })
        .done(this.props.onUnhideProject);
    }
  }

  render() {
    const { project } = this.props;
    const hasImplementationPermission = AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB);
    const archived_at = project.get('archived_at');
    const name        = project.get('name');
    const runCount    = project.get('run_count');
    const totalRunCount = runCount && runCount.reduce((accum, currVal) => { return accum + currVal; });
    const bsl         = project.get('bsl');
    const id          = project.get('id');
    const orgName     = project.getIn(['organization', 'name']);
    const isImplementation    = project.get('is_implementation');
    const actions = getProjectActions(project, { onUnhideProject: this.props.onUnhideProject });

    return (
      <Card
        allowOverflow
        className={classNames(
          'project-square',
          {
            'project-square--implementation': isImplementation,
            'project-square--hovered': this.state.isHovered
          }
        )}
      >
        <div
          className="project-square__contents"
          onMouseLeave={() => { clearTimeout(this.hoverTimeout); this.setState({ isHovered: false }); }}
          onMouseEnter={() => {
            this.hoverTimeout = setTimeout(() => {
              this.setState({ isHovered: true });
              this.props.setActiveProject(project);
            }, 20);
          }}
        >
          <div className={classNames('project-square__background',
            {
              'project-square__background--implementation': isImplementation
            })}
          />
          <div className="project-square__top-bar">
            <div className="project-square__bsl-label"><BSLLabel bsl={bsl} /></div>
            {AcsControls.isFeatureEnabled(FeatureConstants.CREATE_EDIT_PROJECT) &&
              (
                <div className="project-square__action-menu">
                  <ActionMenu
                    options={actions.filter((action) => { return !action.disabled; })}
                    isTiny
                  />
                </div>
              )
            }
          </div>
          <div className="project-square__header-content">
            <div className="project-square__headers">
              <h3 className="project-square__header">
                <Highlighted text={name} highlight={this.props.highlight} />
              </h3>
              {
                isImplementation &&
                (
                  <p className="project-square__subheader">
                    {orgName}
                  </p>
                )
              }
              <p className="project-square__subheader tx-type--primary desc">
                {'Created on'} <DateTime timestamp={(project.get('created_at'))} />
              </p>
              <div className="project-square__view-link">
                {((!isImplementation && AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PROJECTS_RUNS)) ||
                 (isImplementation && hasImplementationPermission)) &&
                  (
                    <div>
                      <Link to={Urls.use(this.props.subdomain).project(id)}>
                        <span className="project-square__view-button">
                          <h4 className="tx-type--invert tx-type--primary tx-type--heavy desc">View Project</h4>
                        </span>
                      </Link>
                    </div>
                  )
                }
              </div>
            </div>
            {(!this.state.isHovered && archived_at) &&
              (
              <div className="project-square__archived">
                <h4 className="tx-type--invert tx-type--primary">Archived</h4>
              </div>
              )
            }
            <div className="project-square__icons">
              {(!Transcriptic.current_user.system_admin) &&
              (
              <div onClick={() => this.toggleStar(project)} className="project-square__favorite-icon">
                <i className={
                  classNames(
                    'project-square__favorite-icon',
                    {
                      'far fa-star': !FavoriteStore.hasFavorableId(project.get('id')),
                      'fas fa-star project-square__favorite-icon--active': FavoriteStore.hasFavorableId(project.get('id')),
                      'project-square__favorite-icon__implementation': isImplementation,
                      'project-square__favorite-icon__implementation--hovered': isImplementation && this.state.isHovered
                    }
                  )}
                />
              </div>
              )
            }
              {
                isImplementation && hasImplementationPermission &&
                (
                  <ImplementationProjectIndicator
                    isHighlighted={this.state.isHovered}
                    onClick={() => this.onUnhideProject()}
                  />
                )}
            </div>
          </div>
          <div className="project-square__info tx-stack tx-stack--xxxs">
            {totalRunCount ?
              (
                <div className="project-square__summaries">
                  {!!runCount.get('accepted') &&
                    (
                      <RunTypeSummary
                        count={runCount.get('accepted')}
                        type="info"
                        icon="far fa-clock"
                        description="Queued"
                      />
                    )
                  }
                  {!!runCount.get('in_progress') &&
                    (
                    <RunTypeSummary
                      count={runCount.get('in_progress')}
                      type="primary"
                      icon="fa fa-circle-notch"
                      description="In Progress"
                    />
                    )
                  }
                  {!!runCount.get('complete') &&
                    (
                      <RunTypeSummary
                        count={runCount.get('complete')}
                        type="success"
                        icon="fa fa-check"
                        description="Completed"
                      />
                    )
                  }
                  {!!runCount.get('aborted') &&
                    (
                    <RunTypeSummary
                      count={runCount.get('aborted')}
                      type="danger"
                      icon="fa fa-times"
                      description="Aborted"
                    />
                    )
                  }
                  {!!runCount.get('pending') &&
                    (
                    <RunTypeSummary
                      count={runCount.get('pending')}
                      type="warning"
                      icon="fa fa-info-circle"
                      description="Pending"
                    />
                    )
                  }
                  {!!runCount.get('rejected') &&
                    (
                    <RunTypeSummary
                      count={runCount.get('rejected')}
                      type="danger"
                      icon="fa fa-ban"
                      description="Rejected"
                    />
                    )
                  }
                  {!!runCount.get('test_mode') &&
                    (
                    <RunTypeSummary
                      count={runCount.get('test_mode')}
                      type="warning"
                      icon="fa fa-flask"
                      description="Test Mode"
                    />
                    )
                  }
                </div>
              )
              :  <p className="desc">No runs created yet.</p>
            }

          </div>
        </div>
      </Card>
    );
  }
}

ProjectSquare.propTypes = {
  project:   PropTypes.instanceOf(Immutable.Map),
  highlight: PropTypes.string,
  subdomain: PropTypes.string,
  isArchived: PropTypes.bool,
  setActiveProject: PropTypes.func,
  onToggleProjectStar: PropTypes.func,
  onUnhideProject: PropTypes.func
};

export { ProjectSquare, NewProjectSquare };
