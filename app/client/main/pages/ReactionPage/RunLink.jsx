import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import Urls from 'main/util/urls';

// Renders a link to the reaction's run page
// if provided with a run and project id
export default function RunLink(props) {
  const { runId, projectId } = props;
  if (runId && projectId) {
    return (
      <Link to={Urls.run(projectId, runId)}>
        {runId}
      </Link>
    );
  } else {
    return <p>N/A</p>;
  }
}

RunLink.propTypes = {
  projectId: PropTypes.string,
  runId: PropTypes.string
};
