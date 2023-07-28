import React from 'react';
import PropTypes from 'prop-types';

import { formatBSLString } from 'main/util/ContainerUtil';

// Displays a full width banner with a test-mode bkg color and text
function WarningBanner({ text = 'Test Mode' }) {
  return (
    <div className="warning-banner">
      <div className="label-warning">{text}</div>
    </div>
  );
}

WarningBanner.propTypes = {
  text: PropTypes.string
};

function BSLRunBanner({ bsl }) {
  return (
    <WarningBanner
      text={`Launching ${formatBSLString(bsl)} Run`}
    />
  );
}

BSLRunBanner.propTypes = {
  bsl: PropTypes.number.isRequired
};

function TestRunBanner() {
  return <WarningBanner text="You are launching a test run.  Test runs are not physically executed." />;
}

function AdminModeBanner() {
  return <WarningBanner text="Remember, Admins cannot launch runs!" />;
}

export { TestRunBanner, AdminModeBanner, WarningBanner, BSLRunBanner };
