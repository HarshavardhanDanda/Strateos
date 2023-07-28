import classNames from 'classnames';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import NotificationActions from 'main/actions/NotificationActions';

class CharControllableInput extends React.Component {

  static get propTypes() {
    return {
      value: PropTypes.string,
      defaultValue: PropTypes.string,
      classNames: PropTypes.array,
      autoFocus: PropTypes.bool,
      disabled: PropTypes.bool,
      onKeyDown: PropTypes.func,
      onChange: PropTypes.func,
      onBlur: PropTypes.func,
      illegalChars: PropTypes.array,
      onIllegalChar: PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const initialValue = e.target.value;
    let { value } = e.target;
    const illegalChars = _.intersection(this.props.illegalChars, initialValue);

    illegalChars.forEach((char) => {
      value = initialValue.replace(char, '');

      if (this.props.onIllegalChar != undefined) {
        return this.props.onIllegalChar();
      } else {
        return this.illegalCharWarning(char);
      }
    });

    // attempt to maintain cursor position
    const illegalCharCount = initialValue.length - value.length;
    const selectionStart   = e.target.selectionStart - illegalCharCount;

    e.target.value = value;
    e.target.setSelectionRange(selectionStart, selectionStart);

    return typeof this.props.onChange === 'function'
      ? this.props.onChange(value)
      : undefined;
  }

  illegalCharWarning(char) {
    if (this[`warningFor${char}`] == undefined) {
      this[`warningFor${char}`] = _.throttle(
        () => NotificationActions.createNotification({
          text: `Character '${char}' is not allowed`,
          isError: true,
          timeout: 3 * 1000
        }),
        3 * 1000
      );
    }

    return this[`warningFor${char}`]();
  }

  render() {
    return (
      <input
        ref={(node) => { this.inputNode = node; }}
        className={classNames(this.props.classNames)}
        value={this.props.value}
        disabled={this.props.disabled}
        defaultValue={this.props.defaultValue}
        autoFocus={this.props.autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
        onKeyDown={this.props.onKeyDown}
        onBlur={this.props.onBlur}
        onChange={this.onChange}
      />
    );
  }
}

export default CharControllableInput;
