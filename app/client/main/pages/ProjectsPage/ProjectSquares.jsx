import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Spinner } from '@transcriptic/amino';
import { ProjectSquare, NewProjectSquare } from 'main/pages/ProjectsPage/ProjectSquare';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class ProjectSquares extends React.Component {

  static get propTypes() {
    return {
      projects: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
      subdomain: PropTypes.string.isRequired,
      setActiveProject: PropTypes.func.isRequired,
      onToggleProjectStar: PropTypes.func,
      onCreate: PropTypes.func.isRequired,
      onUnhideProject: PropTypes.func
    };
  }

  render() {
    const query = this.props.searchOptions.get('query');
    const isFavoriteEnabled = this.props.searchOptions.get('is_starred');
    const enabled = AcsControls.isFeatureEnabled(FeatureConstants.CREATE_EDIT_PROJECT)
    || (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB));
    return (
      <div className="project-squares">
        <If condition={!(query != undefined ? query.length : undefined) && !isFavoriteEnabled && enabled}>
          <NewProjectSquare onCreate={this.props.onCreate} />
        </If>
        <Choose>
          <When condition={this.props.projects != undefined}>
            {this.props.projects.map((project) => {
              return (
                <ProjectSquare
                  key={project.get('id')}
                  project={project}
                  highlight={query}
                  subdomain={this.props.subdomain}
                  isArchived={project.get('archived_at')}
                  setActiveProject={this.props.setActiveProject}
                  onToggleProjectStar={this.props.onToggleProjectStar}
                  onUnhideProject={this.props.onUnhideProject}
                />
              );
            })}
          </When>
          <Otherwise>
            <div className="project-square loading"><Spinner /></div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

export default ProjectSquares;
