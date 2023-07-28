import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import { NamedIcon }       from '@transcriptic/amino';
import { formatBSLString } from 'main/util/ContainerUtil';

import './BSLLabel.scss';

function BSLLabel({ bsl, invert }) {
  const bslClass = classNames({
    'bsl-label': true,
    'bsl-1':     bsl === 1,
    'bsl-2':     bsl === 2,
    'bsl-label--invert': invert,
  });

  return (
    <span className={bslClass}>
      <NamedIcon
        iconClass="far fa-cube"
        name={formatBSLString(bsl)}
      />
    </span>
  );
}

BSLLabel.propTypes = {
  bsl: PropTypes.number.isRequired,
  invert: PropTypes.bool
};

export default BSLLabel;
