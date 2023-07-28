import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

class ValidationError extends React.Component {
  static get propTypes() {
    return {
      err: PropTypes.shape({
        code:    PropTypes.string,
        message: PropTypes.string,
        info:    PropTypes.string
      }).isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      showErrorJSON: false
    };
  }

  render() {
    return (
      <div className="validation-error-list">
        <h3>{this.props.err.code}</h3>
        <div className="validation-error-message">{this.props.err.message}</div>
        <If condition={this.props.err.info}>
          <a
            onClick={() =>
              this.setState({
                showErrorJSON: !this.state.showErrorJSON
              })}
          >
            <Choose>
              <When condition={this.state.showErrorJSON}>Hide info</When>
              <Otherwise>Show info</Otherwise>
            </Choose>
          </a>
        </If>
        <If condition={this.props.err.info && this.state.showErrorJSON}>
          <pre>{this.props.err.info}</pre>
        </If>
      </div>
    );
  }
}

class ValidationProgress extends React.Component {

  static get propTypes() {
    return {
      validator: PropTypes.shape({
        progress: PropTypes.number,
        errors:   PropTypes.array
      })
    };
  }

  render() {
    const { progress } = this.props.validator;
    const { errors }   = this.props.validator;
    const hasErrors    = errors && errors.length > 0;
    const percentWidth = Math.max(2, progress);
    const isDone = progress >= 100;

    return (
      <div className="validate">
        <div className="progress">
          <div
            className={classNames(
              'progress-bar',
              {
                'progress-bar-striped': !isDone,
                'progress-bar-danger': hasErrors,
                'progress-bar-success': isDone
              }
            )}
            role="progressbar"
            style={{ width: `${percentWidth}%` }}
          >
            <Choose>
              <When condition={hasErrors}>
                Launch Failed
              </When>
              <Otherwise>{`${progress}%`}</Otherwise>
            </Choose>
          </div>
        </div>
        <If condition={hasErrors}>
          <dl>
            {errors.map((err) => {
              return <ValidationError key={err.message} err={err} />;
            })}
          </dl>
        </If>
      </div>
    );
  }
}

export { ValidationError, ValidationProgress };
