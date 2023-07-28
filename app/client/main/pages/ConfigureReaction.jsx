import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner }      from '@transcriptic/amino';
import Autocomplete                   from 'main/components/Autocomplete';
import Urls                           from 'main/util/urls';
import ProjectActions                 from 'main/actions/ProjectActions';
import ProjectStore                   from 'main/stores/ProjectStore';
import LaunchRequestAPI               from 'main/api/LaunchRequestAPI';

const searchProjects = (value) => {
  const subdomain = Urls.organization().slice(1);
  return ProjectActions.search(subdomain, { query: value, per_page: 5 })
    .then(response => response.results.map(project => project.name));
};

// Given a launch request id this page helps a user pick a project
// to launch it in.
function ConfigureReaction(props) {
  const [isFetching, setIsFetching] = useState(true);
  const [searchVal, setSearchVal] = useState(props.initialSearch || ''); // the project name picked
  const [launchRequest, setLaunchRequest] = useState(undefined);
  useEffect(
    () => {
      if (!launchRequestId) return;
      const promise = LaunchRequestAPI.get(launchRequestId);
      promise
        .then((res) => {
          setIsFetching(false);
          setLaunchRequest(res.data.attributes);
        });
      promise
        .fail(() => {
          setIsFetching(false);
        });
    },
    []
  );
  const launchRequestId = props.match.params.launchRequestId;
  if (!launchRequestId) return <div>A launch request id is required.</div>;
  if (isFetching) return <Spinner />; // TODO: may want to show spinner here
  if (!launchRequest) return <div>Could not load launch request.</div>;
  if (!launchRequest.protocol_id) return <div>This launch request was not created from a protocol.</div>;

  let launchUrl; // TODO: Tell why the button is disabled when this is undefined
  const project = searchVal ? ProjectStore.findByName(searchVal) : undefined;
  if (project) {
    const id = project.get('id');
    launchUrl = Urls.run_launch(id, launchRequest.protocol_id) + `?launch_request_id=${launchRequestId}`;
  }

  return (
    <div
      style={{
        margin: 40,
        maxWidth: 1200
      }}
    >
      <Card>
        <h2>Configure Reaction</h2>
        <br />
        <div style={{ maxWidth: 400 }}>
          <label>PROJECT</label>
          <Autocomplete
            id="search-projects-for-reaction"
            value={searchVal}
            onSearch={searchProjects}
            onChange={setSearchVal}
          />
        </div>
      </Card>
      <br />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <Button
          disabled={!launchUrl}
          to={launchUrl}
        >
          Configure Run
        </Button>
      </div>
    </div>
  );
}

export default ConfigureReaction;
