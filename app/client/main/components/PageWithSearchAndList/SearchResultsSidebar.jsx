import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import './SearchResultsSidebar.scss';

function SearchResultsSidebar(props) {
  const {
    filters,
  } = props;

  return (
    <div className="tx-stack tx-stack--sm sidebar">
      <If condition={filters}>
        {filters}
      </If>
    </div>
  );
}

SearchResultsSidebar.defaultProps = {
};

SearchResultsSidebar.propTypes = {
  filters: PropTypes.element,
  showSearch: PropTypes.bool
};

export default SearchResultsSidebar;
