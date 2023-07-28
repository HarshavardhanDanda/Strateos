import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Spinner }         from '@transcriptic/amino';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import ContainerTypeStore  from 'main/stores/ContainerTypeStore';

function SampleInfo(props) {
  const convertStorage = (condition) => {
    switch (condition) {
      case 'cold_196': return '-196 °C';
      case 'cold_80': return '-80 °C';
      case 'cold_20': return '-20 °C';
      case 'cold_4': return '4 °C';
      case 'ambient': return 'Room temp';
      case 'warm_37': return '37 °C';
      case 'warm_35': return '35 °C';
      default: return undefined;
    }
  };

  const classes = 'shipping-cart-modal__list-group-item list-group-item centering-container';

  return (
    <div className={classes}>
      <strong>{props.container.get('label') || props.container.get('id')}</strong>
      <small>
        {
          props.container.get('storage_condition') ?
            ` (${convertStorage(props.container.get('storage_condition'))})` :
            undefined
        }
      </small>
      <span
        className="badge"
        onClick={(e) => {
          e.stopPropagation();
          return ShippingCartActions.remove(props.container.get('id'));
        }}
      >
        <i className="fa fa-times" />
      </span>
      {
        props.warning && (
          <span className="badge container-warning">
            <i className="fa fa-exclamation-triangle" />
          </span>
        )}
    </div>
  );
}

SampleInfo.propTypes = {
  container: PropTypes.instanceOf(Object),
  warning: PropTypes.bool
};

const atleastOneBadSeal = (containers) => {
  const firstWithBadSeal = containers.find((container) => {
    const difficultToSeal = ContainerTypeStore.isPlate(container.get('container_type_id'));
    return difficultToSeal;
  });

  return firstWithBadSeal != undefined;
};

class VerifySamples extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasAcceptedBadSealMessage: false
    };
  }

  componentDidMount() {
    this.props.reportBadSealMessagePresence(atleastOneBadSeal(this.props.containers));
  }

  render() {
    return (
      <div className="verify-samples row">
        <h2 className="modal__body-title">Review the samples selected for this shipment</h2>
        {
          this.props.waitingOnContainers ? (
            <div className="spinner-container">
              <Spinner />
            </div>
          )
            : (
              <div className="list-group sample-list row">
                {
                  this.props.containers.map((container) => {
                    const difficultToSeal = ContainerTypeStore.isPlate(container.get('container_type_id'));

                    return (
                      <SampleInfo
                        key={container.get('id')}
                        container={container}
                        warning={difficultToSeal}
                      />
                    );
                  })
                }
              </div>
            )}
        {
          atleastOneBadSeal(this.props.containers) && (
            <div className="alert alert-warning seal-alert centering-container">
              <div>
                <span><strong><i className="fa fa-exclamation-triangle" /></strong></span>
                {
                  `Due to the geometry of the flagged containers, the seal integrity cannot
                   be guaranteed in transit. To proceed and accept the responsibility for the
                   container's integrity and possible well contamination, please confirm below:`
                }
              </div>
              <div className="input-container">
                <input
                  type="checkbox"
                  checked={this.props.hasAcceptedBadSealMessage}
                  onChange={e => this.props.reportSealCheckChange(e)}
                  id="input-for-seal-integreity"
                />
                <label htmlFor="input-for-seal-integreity">
                  I accept
                </label>
              </div>
            </div>
          )}
        <div className="shipping-note">
          {`Dry ice shipments can have up to 5 plates or one tube box (81 tubes),
           while ambient shipments have twice that capacity.`}
        </div>
      </div>
    );
  }
}

VerifySamples.propTypes = {
  waitingOnContainers: PropTypes.bool,
  containers: PropTypes.instanceOf(Immutable.Iterable),
  hasAcceptedBadSealMessage: PropTypes.bool,
  reportSealCheckChange: PropTypes.func.isRequired,
  reportBadSealMessagePresence: PropTypes.func.isRequired
};

export default VerifySamples;
