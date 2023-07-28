import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import classnames from 'classnames';
import PropTypes from 'prop-types';

class VerticalButtonGroup extends React.Component {
  static get propTypes() {
    return {
      values: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onClick: PropTypes.func,
      onDelete: PropTypes.func,
      deleteEnabled: PropTypes.bool
    };
  }

  render() {
    return (
      <div className="vertical-button-group">
        {this.props.values.map((value, i) => {
          // We use the array index here because we have no other way to
          // uniquely identify these values.
          const key = `${value.get('value')} + ${i}`;
          return (
            <div className="button-container" key={key}>
              <button
                className={classnames({
                  btn: true,
                  'btn-default': true,
                  'btn-large': true,
                  active: value.get('active'),
                  error: value.get('hasError'),
                  first: i === 0,
                  last: i === this.props.values.size - 1
                })}
                onClick={() => this.props.onClick(i)}
              >
                <div className="innards">
                  <span className="text">
                    { value.get('value') }
                  </span>
                  <i className="fa fa-angle-right" />
                </div>
              </button>
              <Choose>
                <When condition={this.props.deleteEnabled}>
                  <i
                    className="trash-icon fa fa-fw fa-trash-alt"
                    onClick={() => this.props.onDelete(i)}
                  />
                </When>
                <Otherwise>
                  <i className="trash-icon fa fa-fw" />
                </Otherwise>
              </Choose>
            </div>
          );
        })}
      </div>
    );
  }
}

class VerticalButtonGroupWithLabel extends React.Component {
  static get propTypes() {
    return {
      values: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      onClick: PropTypes.func,
      onDelete: PropTypes.func,
      onAddClick: PropTypes.func,
      addEnabled: PropTypes.bool,
      deleteEnabled: PropTypes.bool,
      title: PropTypes.string
    };
  }

  static get defaultProps() {
    return {
      addEnabled: true
    };
  }

  render() {
    return (
      <div className="vertical-button-group-with-label">
        <div className="vertical-button-group-with-label__title">
          <span>
            {this.props.title}
          </span>
          <If condition={this.props.addEnabled}>
            <a onClick={this.props.onAddClick}>
              <i className="fa fa-plus add-btn" />
            </a>
          </If>
        </div>
        <VerticalButtonGroup
          onClick={this.props.onClick}
          onDelete={this.props.onDelete}
          values={this.props.values}
          deleteEnabled={this.props.deleteEnabled}
        />
      </div>
    );
  }
}

export { VerticalButtonGroup, VerticalButtonGroupWithLabel };
