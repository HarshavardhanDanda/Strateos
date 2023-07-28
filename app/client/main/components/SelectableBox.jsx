import classnames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

class SelectableBox extends React.Component {
  render() {
    return (
      <div
        onClick={this.props.onClick}
        className={classnames({
          'selectable-box': true,
          selected: this.props.selected,
          'selectable-box--placeholder': this.props.placeholder
        })}
      >
        {this.props.children}
      </div>
    );
  }
}

SelectableBox.defaultProps = {
  selected: false,
  placeholder: false
};

SelectableBox.propTypes = {
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  placeholder: PropTypes.bool,
  children: PropTypes.node
}; // set to true to add a dashed border indicating a placeholder box

export default SelectableBox;
