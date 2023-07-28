import React from 'react';
import PropTypes from 'prop-types';

import Hazards from 'main/util/Hazards';
import { Tag } from '@transcriptic/amino';

function HazardTag({ hazard, ...otherProps }) {
  const hazardDetails = Hazards.find(details => details.queryTerm === hazard);

  return (
    <Tag
      key={hazardDetails.queryTerm}
      text={hazardDetails.display}
      backgroundColor={hazardDetails.color}
      {...otherProps}
    />
  );
}

HazardTag.propTypes = {
  hazard: PropTypes.oneOf(
    Hazards.map(h => h.queryTerm)
  ).isRequired
};

export default HazardTag;
