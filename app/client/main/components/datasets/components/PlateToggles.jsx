import classNames from 'classnames';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import './PlateToggles.scss';

// List of toggles for selecting readings or spot data from the MSDPlateReader or Envision datasets.
class PlateToggles extends React.Component {

  static get propTypes() {
    return {
      toggleList: PropTypes.arrayOf(PropTypes.shape({
        id:       PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label:    PropTypes.string.isRequired,
        color:    PropTypes.string.isRequired
      })),
      title:         PropTypes.string,
      selectedId:    PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      onClickToggle: PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <div className="tx-plate-toggles">
        <h4 className="tx-plate-toggles__title">{this.props.title || 'Toggles'}</h4>
        <ul className="tx-plate-toggles__list nav">
          {
            this.props.toggleList.map((toggle, index) => {
              const selected = toggle.id === this.props.selectedId;
              const onClick  = () => this.props.onClickToggle(toggle.id);

              const toggleClasses = classNames({
                'tx-plate-toggles__toggle': true,
                'tx-plate-toggles__toggle--selected': selected
              });

              return (
                // eslint-disable-next-line
                <li key={index} className={toggleClasses} onClick={onClick}>
                  <span className="tx-plate-toggles__indicator" style={{ backgroundColor: toggle.color }} />
                  <span className="tx-plate-toggles__label">
                    {toggle.label}
                  </span>
                </li>
              );
            })
          }
        </ul>
      </div>
    );
  }
}

export default PlateToggles;
