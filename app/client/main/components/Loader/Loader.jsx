import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { Spinner } from '@transcriptic/amino';

import './Loader.scss';

function Loader({ loading, children }) {
  return (
    <div className="loader">
      <If condition={loading}>
        <div className="loader__spinner">
          <Spinner />
        </div>
      </If>
      <div className={classNames({ loading })}>
        { children }
      </div>
    </div>
  );
}

Loader.propTypes = {
  loading: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)])
};

export default Loader;
