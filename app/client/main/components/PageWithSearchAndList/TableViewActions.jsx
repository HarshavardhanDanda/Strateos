import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import './TableViewActions.scss';

function TableViewActions({
  children
}) {

  return (
    <span className="table-view-actions">
      <div className="table-view-actions__selection-info tx-inline tx-inline--xxs" />
      <span className="table-view-actions__selection-actions">
        {children}
      </span>
    </span>
  );
}

TableViewActions.propTypes = {
  children: PropTypes.node
};

export default TableViewActions;
