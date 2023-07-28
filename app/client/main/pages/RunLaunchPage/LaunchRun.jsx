// Manages UI for launching a standard protocol
import PropTypes from 'prop-types';
import React     from 'react';

import ProBroMoAnalytics from 'main/analytics/ProBroMoAnalytics';
import ConnectToStores   from 'main/containers/ConnectToStoresHOC';
import LaunchRunActions  from 'main/project/launchRun/LaunchRunActions';
import LaunchRunSequence from 'main/project/launchRun/LaunchRunSequence';
import LaunchRunStore    from 'main/project/launchRun/LaunchRunStore';
import { MultiStepChrome } from '@transcriptic/amino';

class LaunchRun extends React.Component {
  static get propTypes() {
    return {
      // TODO This isn't just a manifest.  The `manifest` prop is actually a Protocol object.
      manifest:             PropTypes.object.isRequired,
      project:              PropTypes.object.isRequired,
      onExit:               PropTypes.func.isRequired,
      exitDisplay:          PropTypes.string.isRequired,
      canSetTestMode:       PropTypes.bool,
      initialTestMode:      PropTypes.bool,
      initialPredecessorId: PropTypes.string,
      parameters:           PropTypes.object,
      customInputsConfig:   PropTypes.object,
      customInputs:         PropTypes.object,
      labId:                PropTypes.string
    };
  }

  static get navigation() {
    return ['Configure', 'Review', 'Success'];
  }

  constructor(props, context) {
    super(props, context);

    this.back                 = this.back.bind(this);
    this.currentNavIndex      = this.currentNavIndex.bind(this);
    this.labelForNavIndex     = this.labelForNavIndex.bind(this);
    this.navigateToNextScreen = this.navigateToNextScreen.bind(this);
    this.onDismiss            = this.onDismiss.bind(this);
  }

  // Much of the state of launching a run is managed by the LaunchRunStore, e.g. 'submitting', 'submitted', etc.
  // because it is dependent on server.
  back() {
    const newIndex = this.currentNavIndex() - 1;

    if (newIndex < 0) {
      this.props.onExit();
    } else {
      LaunchRunActions.clickedTabIndex(newIndex);
    }
  }

  currentNavIndex() {
    return LaunchRunStore.navigationIndex.get();
  }

  labelForNavIndex(index) {
    const navItem = LaunchRun.navigation[index];

    return `${index + 1}. ${navItem}`;
  }

  navigateToNextScreen() {
    const newIndex = this.currentNavIndex() + 1;

    if (newIndex >= LaunchRun.navigation.length) {
      return;
    }

    LaunchRunActions.clickedTabIndex(newIndex);
  }

  onDismiss() {
    return ProBroMoAnalytics.protocolAbandoned(this.props.manifest.id);
  }

  render() {
    return (
      <div className="launch-new-run">
        <div className="launch-new-run__multi-step-chrome-container">
          <MultiStepChrome
            navigation={LaunchRun.navigation}
            currentNavIndex={this.currentNavIndex}
            labelForNavIndex={this.labelForNavIndex}
            dismiss={this.onDismiss}
            stepHeaderIsClickable={(index) => {
              if (index === 0 && LaunchRunStore.submitted.get()) {
                // Don't let them go back to 'Configure' if they've already submitted
                return false;
              } else if (index >= this.currentNavIndex()) {
                return false;
              } else {
                return true;
              }
            }}
            clickedTabIndex={LaunchRunActions.clickedTabIndex}
            shouldCheckOffStep={(index) => index < this.currentNavIndex()}
          />
        </div>
        <LaunchRunSequence
          manifest={this.props.manifest}
          project={this.props.project}
          onNext={this.navigateToNextScreen}
          onBack={this.back}
          onExit={this.props.onExit}
          exitDisplay={this.props.exitDisplay}
          navigation={LaunchRun.navigation}
          currentIndex={this.currentNavIndex()}
          canSetTestMode={this.props.canSetTestMode}
          initialTestMode={this.props.initialTestMode}
          initialPredecessorId={this.props.initialPredecessorId}
          parameters={this.props.parameters}
          customInputs={this.props.customInputs}
          customInputsConfig={this.props.customInputsConfig}
          runSubtab={this.props.runSubtab}
          labId={this.props.labId}
        />
      </div>
    );
  }
}

export default ConnectToStores(LaunchRun, () => {});
