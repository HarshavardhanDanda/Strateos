import PropTypes from 'prop-types';
import React     from 'react';

import './RunTimingInfo.scss';

function RunTimingInfo(props) {
  return (
    <table className="run-timing-info">
      <tbody>
        {
          props.items.map((item) => {
            return (
              <tr key={item.header}>
                <td className="run-timing-info__header"><h4>{item.header}</h4></td>
                <td><p>{item.content}</p></td>
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}

RunTimingInfo.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  }))
};

export default RunTimingInfo;
