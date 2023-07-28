import PropTypes from 'prop-types';
import React     from 'react';

import ProtocolOverview from 'main/project/launchRun/ProtocolOverview';

import { Button, ButtonGroup } from '@transcriptic/amino';

// The overview of a protocol in the context of launching a run in the ProBroMo
const LaunchProtocolOverviewHeader = function({ onBackToProtocols, manifest, dismiss }) {
  return (
    <div className="modal-header modal__header">
      <h2 className="modal__title">
        <a onClick={onBackToProtocols}>Protocols</a>
        {' \xA0/\xA0\xA0'}
        <Choose>
          <When condition={manifest.display_name}>
            {manifest.display_name}
          </When>
          <Otherwise>
            {manifest.name}
          </Otherwise>
        </Choose>
      </h2>
      <button className="close" onClick={dismiss}>
        {'\xD7'}
      </button>
    </div>
  );
};

LaunchProtocolOverviewHeader.propTypes = {
  onBackToProtocols: PropTypes.func.isRequired,
  manifest: PropTypes.object.isRequired,
  dismiss: PropTypes.func.isRequired
};

function LaunchProtocolOverviewFooter({
  onBackToProtocols,
  onSelectProtocol
}) {
  return (
    <div className="modal__footer">
      <ButtonGroup>
        <Button
          type="secondary"
          size="medium"
          tabIndex="-1"
          onClick={onBackToProtocols}
        >
          Back To Protocols
        </Button>
        <Button type="primary" size="medium" onClick={onSelectProtocol}>
          Get Started
        </Button>
      </ButtonGroup>
    </div>
  );
}

LaunchProtocolOverviewFooter.propTypes = {
  onBackToProtocols: PropTypes.func.isRequired,
  onSelectProtocol: PropTypes.func.isRequired
};

function LaunchProtocolOverviewBody({ manifest }) {
  return <ProtocolOverview manifest={manifest} />;
}

LaunchProtocolOverviewBody.propTypes = {
  manifest: PropTypes.object.isRequired
};

export {
  LaunchProtocolOverviewHeader,
  LaunchProtocolOverviewFooter,
  LaunchProtocolOverviewBody
};
