import PropTypes from 'prop-types';
import React     from 'react';

import './QuickListCreatorListItem.scss';

function QuickListCreatorListItem(props) {
  return (
    <div className="list-item quick-list-creator__list-item">
      {
        // If the removeItem prop has been set, call it when an item's
        // delete button is clicked
        <If condition={props.removeItem}>
          <button
            className="list-item__remove"
            onClick={props.removeItem}
          >
            <i className="far fa-times-circle" />
          </button>
        </If>
      }
      <h2 className="list-item__datum list-item__name tx-type--secondary tx-type--heavy">
        {props.title}
      </h2>
      {
        // Map over the data props attribute and if a child has a value, render
        // it, along with its label if it has been provided
        props.data.map(
          (datum) => {
            return (datum.value && (
              <span key={datum.label} className="list-item__datum">
                <If condition={datum.label}>
                  <h4 className="tx-type--heavy">{datum.label}</h4>
                </If>
                {datum.value}
              </span>
            ));
          })
      }
    </div>
  );
}

QuickListCreatorListItem.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired
    })
  ).isRequired,
  removeItem: PropTypes.func
};

export default QuickListCreatorListItem;
