import React from 'react';
import { MultiStepModalPane } from 'main/components/Modal';
import { ZeroState } from '@transcriptic/amino';
import 'main/pages/ReactionPage/CompoundSourceSelector/setupPane.scss';

class SetupPane extends React.Component {
  render() {
    const zeroStateTitle = () => {
      return (
        <h3>
          Your samples must be in Strateos containers. If you dont have Strateos containers, please <a href="https://strateos.atlassian.net/servicedesk/customer/portal/7/group/-" target="_blank" rel="noreferrer">contact&nbsp;</a>
          Strateos operator to request new containers.
        </h3>
      );
    };

    return (
      <div className="setup-pane">
        <MultiStepModalPane
          key="ContainerRegistrationSetup"
          {...this.props}
          showBackButton={false}
        >
          <ZeroState
            title={zeroStateTitle()}
            zeroStateSvg="/images/materials-illustration.svg"
          />
        </MultiStepModalPane>
      </div>
    );
  }
}

export default SetupPane;
