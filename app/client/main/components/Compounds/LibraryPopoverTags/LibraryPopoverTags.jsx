import React from 'react';
import PropTypes from 'prop-types';
import { Popover, Tag } from '@transcriptic/amino';
import './LibraryPopoverTags.scss';

function LibraryPopoverTags(props) {
  const { libraries, onModal } = props;

  const tags = libraries.map(lib => (
    <Tag
      key={lib.name}
      text={lib.name}
    />
  ));

  return (
    <React.Fragment>
      {
      libraries.length > 1 ? (
        <Popover
          className="popover-wrapper"
          content={tags}
          placement="bottom"
          trigger="hover"
          onModal={onModal}
        >
          <p className="tx-type--secondary">
            {libraries.length}
            <i className="fas fa-tags library-popover-tags" />
          </p>
        </Popover>
      )
        : libraries.length == 1 ? (
          <Popover
            content={tags}
            placement="bottom"
            trigger="hover"
            showWhenOverflow
            onModal={onModal}
          >{tags}
          </Popover>
        ) : '-'
    }
    </React.Fragment>
  );
}

LibraryPopoverTags.propTypes = {
  libraries: PropTypes.arrayOf(PropTypes.object).isRequired,
  onModal: PropTypes.bool
};

export default LibraryPopoverTags;
