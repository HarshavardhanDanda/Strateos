import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Popover } from '@transcriptic/amino';
import HazardTag from 'main/components/Hazards/HazardTag';
import './HazardPopoverTags.scss';

const HazardPopoverTags = (props) => {
  const { hazards, zeroStateText } = props;

  const getPopoverTags = () => {
    if (hazards.length > 1) {
      const tags = hazards.map(hazard => <HazardTag key={hazard} hazard={hazard} />);
      return (
        <Popover
          content={tags}
          placement="bottom"
          trigger="hover"
          onModal
        >
          <p className="tx-type--secondary">
            {hazards.length}
            <i className="fas fa-tags hazard-popover-tags" />
          </p>
        </Popover>
      );
    } else if (hazards.length === 1) {
      const tag = <HazardTag hazard={hazards[0]} />;
      return (
        <Popover
          content={tag}
          placement="bottom"
          trigger="hover"
          showWhenOverflow
        >
          {tag}
        </Popover>
      );
    } else {
      return zeroStateText ? <p className="tx-type--secondary">{zeroStateText}</p>  : '-';
    }
  };

  return (
    getPopoverTags()
  );
};

HazardPopoverTags.propTypes = {
  hazards: PropTypes.arrayOf(PropTypes.string).isRequired,
  zeroStateText: PropTypes.string
};

export default HazardPopoverTags;
