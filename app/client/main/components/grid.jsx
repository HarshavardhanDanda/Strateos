import classNames           from 'classnames';
import { AnyChildrenShape } from 'main/proptypes';
import PropTypes            from 'prop-types';
import React                from 'react';

class RowWrappedGrid extends React.Component {

  static get propTypes() {
    return {
      gridClassname: PropTypes.string,
      children:      AnyChildrenShape
    };
  }

  render() {
    return (
      <div className={classNames('row-wrapped-grid', this.props.gridClassname)}>
        {this.props.children}
      </div>
    );
  }
}

export default RowWrappedGrid;
