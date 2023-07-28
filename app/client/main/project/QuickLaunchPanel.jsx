import Immutable from 'immutable';
import $         from 'jquery';
import PropTypes from 'prop-types';
import React     from 'react';

import { Button }         from '@transcriptic/amino';
import Manifest           from 'main/util/Manifest';
import LaunchRunInputs    from 'main/project/launchRun/LaunchRunInputs';
import QuickLaunchActions from 'main/actions/QuickLaunchActions';
import RunValidator       from 'main/project/launchRun/RunValidator';

class QuickLaunchPanel extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.navigateHome = this.navigateHome.bind(this);

    this.state = {
      inputs: Manifest.defaults(this.manifestInputs()).toJS(),
      hasResolvedInputs: false,
      test_mode: false
    };
  }

  manifest() {
    return this.props.quickLaunch.get('manifest');
  }

  manifestDisplayName() {
    if (this.manifest().get('display_name')) {
      return this.manifest().get('display_name');
    }

    return this.manifest().get('name');
  }

  manifestInputs() {
    return this.manifest().get('inputs');
  }

  navigateHome() {
    window.location = '/';
  }

  render() {
    return (
      <div className="panel-body">
        <div className="panel launch-run-panel">
          <div className="modal-header modal__header">
            <h2 className="modal__title">{`Protocols   /   ${this.manifestDisplayName()}`}</h2>
            <div className="test-mode">
              <label htmlFor="testModeCheckbox">
                <input
                  id="testModeCheckbox"
                  type="checkbox"
                  checked={this.state.test_mode}
                  onChange={e =>
                    this.setState({
                      test_mode: e.target.checked
                    })}
                />Test Mode
              </label>
            </div>
            <button className="close" onClick={this.navigateHome}>
              ×
            </button>
          </div>
          <Choose>
            <When condition={this.state.hasResolvedInputs}>
              <QuickLaunchConfirmation dismiss={this.navigateHome} />
            </When>
            <Otherwise>
              <div>
                <div className="modal__body">
                  <div className="standard-protocol-inputs">
                    <div className="modal__body" ref={(c) => { this.quickLaunchBody = c; }}>
                      <LaunchRunInputs
                        inputTypes={this.manifestInputs().toJS()}
                        inputs={this.state.inputs}
                        onChange={inputs =>
                          this.setState({
                            inputs
                          })}
                        showErrors={this.state.validateRunInputs}
                        test_mode={this.state.test_mode}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal__footer">
                  <Button
                    waitForAction
                    type="primary"
                    disabled={this.state.hasResolvedInputs}
                    onClick={(cb) => {
                      const { projectId } = this.props;
                      const quickLaunchId = this.props.quickLaunch.get('id');

                      // Validate the launch form
                      if (
                        Manifest.hasErrors(
                          this.manifestInputs(),
                          this.state.inputs
                        )
                      ) {
                        return this.setState(
                          {
                            validateRunInputs: true
                          },
                          () => {
                            const quickLaunchBody = $(
                              this.quickLaunchBody
                            );
                            const error = quickLaunchBody.find('.has-error').first()[0];
                            if (error) error.scrollIntoView();

                            return cb();
                          }
                        );
                      } else {
                        const runValidator = new RunValidator({
                          manifest: this.manifest().toJS(),
                          inputs: this.state.inputs
                        });
                        const params = runValidator.transformedParameters();

                        return QuickLaunchActions.resolveInputs(
                          projectId,
                          quickLaunchId,
                          params
                        )
                          .done(() => {
                            return this.setState({
                              hasResolvedInputs: true
                            });
                          })
                          .always(cb);
                      }
                    }}
                  >
                    Generate protocol input
                  </Button>
                </div>
              </div>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }
}

QuickLaunchPanel.propTypes = {
  projectId: PropTypes.string.isRequired,
  quickLaunch: PropTypes.instanceOf(Immutable.Map).isRequired
};

function QuickLaunchConfirmation(props) {
  return (
    <div className="update-success">
      <div className="modal__body">
        <div className="body-container">
          <img alt="success-check" src="/images/icons/inventory_browser_icons/success-check.svg" />
          <h2>
            Quick launch updated successfully. Please return to the command
            line to continue.
          </h2>
        </div>
      </div>
      <div className="modal__footer">
        <Button type="primary" onClick={props.dismiss}>
          Close
        </Button>
      </div>
    </div>
  );
}

QuickLaunchConfirmation.propTypes = {
  dismiss: PropTypes.func.isRequired
};

export default QuickLaunchPanel;
