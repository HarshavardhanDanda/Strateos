import Classnames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import ReleaseActions from 'main/actions/ReleaseActions';
import ReleaseStore   from 'main/stores/ReleaseStore';

class ValidateRelease extends React.Component {

  static get propTypes() {
    return {
      release: PropTypes.instanceOf(Immutable.Map),
      onSuccess: PropTypes.func,
      onFailure: PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      validateStatus: undefined
    };
  }

  componentDidMount() {
    this.progressInterval = setInterval(() => { this.pollRelease(); }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.progressInterval);
  }

  pollRelease() {
    ReleaseActions.load(this.props.release.getIn(['package', 'id']), this.props.release.get('id'))
      .done((data) => {
        this.setState({ validateStatus: 'success' });

        if (data.validation_progress === 100) {
          clearInterval(this.progressInterval);

          if (data.validation_errors.length > 0) {
            this.setState({ validateStatus: 'failure' });

            if (this.props.onFailure) {
              this.props.onFailure();
            }

            return;
          }

          if (this.props.onSuccess) {
            this.props.onSuccess(data);
          }
        }
      })
      .fail(() => {
        this.setState({ validateStatus: 'failure' });

        clearInterval(this.progressInterval);

        if (this.props.onFailure) {
          this.props.onFailure();
        }
      });
  }

  currentProgress(release) {
    if (this.state.validateStatus === 'success') {
      return release.get('validation_progress');
    } else if (this.state.validateStatus === 'failure') {
      return 100;
    } else {
      return 2;
    }
  }

  progressText(release) {
    if (this.state.validateStatus === 'failure') {
      return 'Validation Failed';
    }

    if (this.state.validateStatus == undefined) {
      return '0%';
    }

    if (release.get('validation_progress') < 100) {
      return `${release.get('validation_progress')}%`;
    } else {
      return '';
    }
  }

  render() {
    const release   = ReleaseStore.getById(this.props.release.get('id'));
    const errors    = release != undefined ? release.get('validation_errors') : undefined;
    const errorSize = errors ? errors.size : 0;

    const progress = this.currentProgress(release);
    const text     = this.progressText(release);
    const danger   = this.state.validateStatus === 'failure' || errorSize > 0;

    return (
      <div id="validate">
        <h3>Please wait, analyzing...</h3>
        <div className="progress">
          <div
            className={Classnames(
              'progress-bar',
              'progress-bar-striped',
              'active',
              { 'progress-bar-danger': danger }
            )}
            style={{ width: `${progress}%` }}
            role="progressbar"
          >
            {text}
          </div>
        </div>
        <If condition={errors != undefined}>
          <div className="validation-error-list">
            {errors.map((err, i) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i}>
                  <h3>{err.get('code')}</h3>
                  <div className="validation-error-messasge">
                    {err.get('message')}
                  </div>
                </div>
              );
            })}
          </div>
        </If>
      </div>
    );
  }
}

export default ValidateRelease;
