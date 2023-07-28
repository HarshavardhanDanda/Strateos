import React from 'react';
import PropTypes from 'prop-types';

import { RadioGroup, Radio }  from '@transcriptic/amino';
import FeatureStore from 'main/stores/FeatureStore.js';
import FeatureConstants from '@strateos/features';
import EditCourierPickup from './EditCourierPickup';

const { AddressSelector } = require('main/components/address').default;

const COURIER_SHIPPING_TEMPERATURES = ['Ambient', 'On Ice'];
const SHIPPING_TEMPERATURES = ['Ambient', 'Dry Ice'];
const SHIPPING_SPEEDS = ['Express Saver', '2nd Day', 'Overnight'];

class EditShipmentOptions extends React.Component {
  static get propTypes() {
    return {
      isCourierPickup: PropTypes.bool.isRequired,
      shippingSpeed:  PropTypes.string.isRequired,
      shippingTemp:   PropTypes.string.isRequired,
      onShippingSpeedSelected: PropTypes.func.isRequired,
      onShippingTempSelected: PropTypes.func.isRequired,
      addressId: PropTypes.string,
      onAddressIdChange: PropTypes.func.isRequired,
      courierName:         PropTypes.string,
      onChangeCourierName: PropTypes.func.isRequired
    };
  }

  getShippingNote() {
    if (this.props.shippingTemp === 'Dry Ice') {
      return 'Dry ice packages must be sent overnight and will ship only from Monday to Thursday.';
    } else if (this.props.shippingSpeed === 'Overnight') {
      return 'Overnight packages are shipped only from Monday to Thursday.';
    } else if (this.props.shippingSpeed === '2nd Day') {
      return '2nd day packages are shipped only from Monday to Wednesday.';
    }
    return undefined;
  }

  isSpeedButtonActive(speed) {
    if (this.props.shippingTemp === 'Dry Ice' && speed !== 'Overnight') {
      return false;
    } else if (this.props.shippingSpeed === speed) {
      return true;
    }
    return true;
  }

  render() {
    const shippingTemps = this.props.isCourierPickup ? COURIER_SHIPPING_TEMPERATURES : SHIPPING_TEMPERATURES;
    return (
      <div className="shipping-options col-sm-12">
        <div className="shipping-options__parameter row">
          <div className="shipping-options__parameter col-sm-3 col-sm-offset-3">
            <h3>Temperature</h3>
            <RadioGroup
              value={this.props.shippingTemp}
              onChange={(e) => {
                e.stopPropagation();
                this.props.onShippingTempSelected(e.target.value);
              }}
            >
              {
                shippingTemps.map((temp) => {
                  return (
                    <Radio
                      value={temp}
                      key={temp}
                      id={temp}
                      label={temp}
                    />
                  );
                })
              }
            </RadioGroup>
          </div>
          <If condition={!this.props.isCourierPickup}>
            <div className="shipping-options__parameter col-sm-3">
              <h3>Speed</h3>

              <RadioGroup
                value={this.props.shippingSpeed}
                onChange={(e) => {
                  e.stopPropagation();
                  return this.props.onShippingSpeedSelected(e.target.value);
                }}
              >
                {
                  SHIPPING_SPEEDS.map((speed) => {
                    return (
                      <Radio
                        value={speed}
                        id={speed}
                        key={speed}
                        disabled={!this.isSpeedButtonActive(speed)}
                        label={speed}
                      />
                    );
                  })
                }
              </RadioGroup>
            </div>
          </If>
        </div>
        <div className="row">
          <div className="address-type show-grid col-sm-8 col-sm-offset-2">
            <Choose>
              <When condition={!this.props.isCourierPickup}>
                <If condition={this.getShippingNote()}>
                  <div className="alert alert-info">
                    <strong>Note:</strong> {this.getShippingNote()}
                  </div>
                </If>
                <h3>Address</h3>
                <AddressSelector
                  onAddressIdChange={this.props.onAddressIdChange}
                  addressId={this.props.addressId}
                  useNewAddressSelectorFormat
                  disableAddressCreation={!FeatureStore.hasFeature(FeatureConstants.ADMINISTRATION)}
                />
                <div className="shipping-note show-grid">
                  Only US addresses are accepted. For international shipping, contact{' '}
                  <a href="mailto:support@transcriptic.com">
                    support@transcriptic.com
                  </a>
                </div>
              </When>
              <Otherwise>
                <EditCourierPickup
                  courierName={this.props.courierName}
                  onChangeCourierName={this.props.onChangeCourierName}
                />
              </Otherwise>
            </Choose>
          </div>
        </div>
      </div>
    );
  }
}

export default EditShipmentOptions;
