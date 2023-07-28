import BaseTag   from 'main/components/InstructionTags/BaseTag';
import PropTypes from 'prop-types';
import React     from 'react';

class DataTag extends React.Component {
  static get propTypes() {
    return {
      refName: PropTypes.string.isRequired
    };
  }

  static get contextTypes() {
    return {
      onNavigateDataref: PropTypes.func
    };
  }

  render() {
    let onClick;
    if (this.context.onNavigateDataref) {
      onClick = (e) => {
        this.context.onNavigateDataref(this.props.refName);
        return e.stopPropagation();
      };
    }

    return (
      <BaseTag
        backgroundColor="hsla(205, 49%, 66%, 0.5)"
        onClick={onClick}
      >
        {this.props.refName}
      </BaseTag>
    );
  }
}
export default DataTag;
