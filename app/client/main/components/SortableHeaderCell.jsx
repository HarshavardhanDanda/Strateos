import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

class SortableHeaderCell extends React.Component {

  static get propTypes() {
    return {
      id:        PropTypes.string,
      text:      PropTypes.string,
      orderDesc: PropTypes.bool,
      isCurrent: PropTypes.bool,
      onClick:   PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <th
        style={{ cursor: 'pointer' }}
        onClick={() => {
          const orderDesc = !this.props.isCurrent ? false : !this.props.orderDesc;

          this.props.onClick(this.props.id, orderDesc);
        }}
      >
        {this.props.text}
        <If condition={this.props.isCurrent}>
          <i className={classNames('fa', this.props.orderDesc ? 'fa-caret-up' : 'fa-caret-down')} />
        </If>
      </th>
    );
  }
}

export default SortableHeaderCell;
