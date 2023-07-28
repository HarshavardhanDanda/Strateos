import React     from 'react';
import PropTypes from 'prop-types';

import { Label } from '@transcriptic/amino';

import './HeaderRow.scss';

class HeaderRow extends React.Component {
  static get propTypes() {
    return {
      instructionId: PropTypes.string.isRequired,
      complete: PropTypes.bool
    };
  }

  render() {
    return (
      <div className="card-table-spacing provision-card-header">
        <p
          className="tx-type--heavy desc
                     card-table-spacing__location
                     provision-card-header__tab
                     card-table-spacing__column"
        >
          <span className="provision-card-header__background">
            <span className="provision-card-header__tab-content">
              <span>{this.props.instructionId}</span>
              <Label
                title={this.props.complete ? 'complete' : 'incomplete'}
                type={this.props.complete ? 'success' : 'warning'}
                className="provision-card-header__tab-status"
              />
            </span>
          </span>
          <span className="provision-card-header__tab-triangle" />
        </p>
        <h4 className="tx-type--heavy card-table-spacing__barcode card-table-spacing__column">BARCODE</h4>
        <h4 className="tx-type--heavy card-table-spacing__container-id card-table-spacing__column">CONTAINER ID</h4>
        <h4 className="tx-type--heavy card-table-spacing__container-type-id card-table-spacing__column">CONTAINER TYPE</h4>
        <h4 className="tx-type--heavy card-table-spacing__available card-table-spacing__column">AVAILABLE</h4>
        <h4 className="tx-type--heavy card-table-spacing__source card-table-spacing__column">SOURCE</h4>
        <h4 className="tx-type--heavy card-table-spacing__destination card-table-spacing__column">DESTINATION</h4>
        <h4 className="tx-type--heavy card-table-spacing__mixture card-table-spacing__column">MIXTURE</h4>
      </div>
    );
  }
}

export default HeaderRow;
