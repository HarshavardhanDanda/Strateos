import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import Urls from 'main/util/urls';
import ProjectActions from 'main/actions/ProjectActions';
import NotificationActions from 'main/actions/NotificationActions';
import { TypeAheadInput } from '@transcriptic/amino';
import PropTypes from 'prop-types';

const defaultSuggestionLimit = 10;
const debounceWait = 250;

export default function ProjectSelector(props) {
  const [textInput, setTextInput] = useState('');
  // added the props.suggestions for the test
  const [suggestions, setSuggestions] = useState(props.suggestions || []);
  const fetchSuggestionsByProjectDebounced = _.debounce(fetchSuggestionsByProject, debounceWait);

  useEffect(
    () => {
      if (!props.projectName) return;
      setTextInput(props.projectName);
    },
    [props.projectName]
  );

  function fetchSuggestionsByProject(value) {
    if (!Urls.organization()) return;
    const { suggestionLimit } = props;
    const subdomain = Urls.organization().slice(1);
    ProjectActions.search(subdomain, { query: value, per_page: suggestionLimit || defaultSuggestionLimit })
      .then(response => {
        _.isUndefined(props.sourceProjectId) ? setSuggestions(response.results.map(project => ({ name: project.name, value: project.id })))
          : setSuggestions(response.results
            .filter(project => project.id !== props.sourceProjectId)
            .map(project => ({ name: project.name, value: project.id })));
      });
  }

  function suggest(event) {
    if (event.target === undefined) return;
    const { value } = event.target;
    setTextInput(value);
    setSuggestions([]);
    fetchSuggestionsByProjectDebounced(value);
  }

  function onProjectSelected(projectName) {
    const { updateProjectId, updateProject } = props;
    const project = suggestions.find(project => project.name.toLowerCase() === projectName.toLowerCase());
    setSuggestions([]);
    if (updateProject) {
      if (project === undefined) {
        NotificationActions.createNotification({
          text: `${projectName} does not exist`,
          isError: true
        });
        setTextInput(props.projectName);
      } else {
        updateProject(project);
      }
    } else {
      setTextInput(projectName);
      const projectId = project ? project.value : '';
      updateProjectId(projectId);
    }
  }

  function onProjectCleared() {
    const { updateProjectId, updateProject } = props;
    setTextInput('');
    setSuggestions([]);
    if (updateProject) {
      updateProject({ value: '', name: '' });
    } else {
      updateProjectId(null);
    }
  }

  return (
    <TypeAheadInput
      name="text-input"
      value={textInput}
      placeholder={props.placeholder || 'Select project'}
      suggestions={suggestions.map(s => s.name)}
      onChange={e => suggest(e)}
      onSuggestedSelect={selected => {
        if (_.isEmpty(suggestions)) {
          fetchSuggestionsByProject(selected);
        } else {
          onProjectSelected(selected);
        }
      }}
      onClear={() => onProjectCleared()}
      disabled={props.disabled}
      disableClearIcon={props.disabled}
    />
  );
}

ProjectSelector.propTypes = {
  suggestions: PropTypes.arrayOf(Object),
  projectName: PropTypes.string,
  disabled: PropTypes.bool,
  suggestionLimit: PropTypes.number,
  placeholder: PropTypes.string,
  updateProjectId: PropTypes.func,
  updateProject: PropTypes.func,
  sourceProjectId: PropTypes.string,
};
