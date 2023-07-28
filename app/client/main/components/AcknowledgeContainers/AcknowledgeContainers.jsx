import PropTypes from 'prop-types';
import React     from 'react';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import Urls from 'main/util/urls';

import { Button } from '@transcriptic/amino';

function AcknowledgeContainers(props) {

  const { labOperatorName } = props;

  return (
    <div className="acknowledge-containers">
      <div className="body-container tx-stack">
        <img
          className="tx-stack__block tx-stack__block--md"
          src="/images/icons/inventory_browser_icons/danger.svg"
          alt=""
        />
        <If condition={!props.test_mode}>
          <h2 className="tx-type--center tx-stack__block tx-stack__block--md">
            {
              `Your samples must be in ${labOperatorName} containers.  If you don't have ${labOperatorName} containers, please
              request an Intake Kit.`
            }
          </h2>
        </If>
        <div className="vertical-spaced-list tx-stack__block tx-stack__block--md">
          <If condition={!props.test_mode && AcsControls.isFeatureEnabled(FeatureConstants.CREATE_SAMPLE_SHIPMENTS)}>
            <div>
              <Button
                type="primary"
                size="large"
                height="tall"
                onClick={() => {
                  if (props.onSetNonTestMode) {
                    return props.onSetNonTestMode(props.onNext);
                  } else {
                    return props.onNext();
                  }
                }}
              >
                I have {labOperatorName} containers
              </Button>
            </div>
          </If>
          <If condition={!props.test_mode}>
            <div>
              <Button
                type="primary"
                invert
                size="large"
                height="tall"
                to={Urls.shipments_intake_kits()}
                onClick={props.onDismiss}
              >
                Go to Intake Kits
              </Button>
            </div>
          </If>
          <If condition={props.onSetTestMode && props.test_mode == null && AcsControls.isFeatureEnabled(FeatureConstants.CREATE_TEST_CONTAINERS)}>
            <div>
              <Button
                type="warning"
                invert
                size="large"
                height="tall"
                onClick={() => {
                  return props.onSetTestMode(props.onNext);
                }}
              >
                Create Test Containers
              </Button>
            </div>
          </If>
        </div>
      </div>
    </div>
  );
}

AcknowledgeContainers.defaultProps = {
  labOperatorName: 'Strateos'
};

AcknowledgeContainers.propTypes = {
  onNext: PropTypes.func,
  onSetNonTestMode: PropTypes.func,
  onSetTestMode: PropTypes.func,
  onDismiss: PropTypes.func,
  labOperatorName: PropTypes.string.isRequired,
  test_mode: PropTypes.bool
};

export default AcknowledgeContainers;
