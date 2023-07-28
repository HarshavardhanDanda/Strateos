import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { inflect } from 'inflection';
import Immutable from 'immutable';

import { KeyValueList, Button, DateTime } from '@transcriptic/amino';

import UserProfile from 'main/components/UserProfile';

import './ShipmentCard.scss';

class ShipmentCard extends React.Component {
  static get propTypes() {
    return {
      className:        PropTypes.string.isRequired,
      createdAt:        PropTypes.string.isRequired,
      receivedAt:       PropTypes.string,
      title:            PropTypes.string.isRequired,
      actionText:       PropTypes.string,
      statusMessage:    PropTypes.string,
      detailEntries:    PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.node,
          value: PropTypes.node
        })
      ),
      onAction:         PropTypes.func,
      actionLeavesPage: PropTypes.bool,
      estDeliveryDate:  PropTypes.string,
      trackingNumber:   PropTypes.string,
      children:         PropTypes.node,
      intakeKitItems:   PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number,
          quantity: PropTypes.number,
          container_type_id: PropTypes.string,
          intake_kit_id: PropTypes.string,
          created_at: PropTypes.string,
          updated_at: PropTypes.string
        })
      ),
      creator:          PropTypes.instanceOf(Immutable.Map)
    };
  }

  static get defaultProps() {
    return {
      detailEntries: []
    };
  }

  shouldRenderShippingStatus() {
    return !this.props.receivedAt && this.props.statusMessage;
  }

  generateStatusEntries() {
    const entries = [];

    if (!this.props.receivedAt && this.props.trackingNumber) {
      entries.push({
        key: 'Tracking No.:',
        value: <p>{this.props.trackingNumber}</p>
      });
    }

    if (!this.props.receivedAt && this.props.estDeliveryDate) {
      entries.push({
        key: <h4 className="shipment-card__del-est-key">Delivery Estimate:</h4>,
        value: <p><DateTime timestamp={this.props.estDeliveryDate} /></p>
      });
    }

    if (this.props.receivedAt) {
      entries.push({
        key: <h4 className="shipment-card__received-key">Received:</h4>,
        value: <p><DateTime timestamp={this.props.receivedAt} /></p>
      });
    }

    return entries;
  }

  generateLeftEntries() {

    let additionalEntries = [
      {
        key: 'Created:',
        value: (
          <p>
            <DateTime
              timestamp={this.props.createdAt}
            />
          </p>
        )
      }
    ];

    if (this.props.creator) {
      additionalEntries = additionalEntries.concat([{
        key: 'Creator:',
        value: <UserProfile user={this.props.creator} showDetails />
      }]);
    }

    return this.props.detailEntries.concat(additionalEntries);
  }

  getOrderText(containerType, containerTypeText, displayText) {
    return (containerType ? (containerType.quantity !== 0 ? containerType.quantity + ' ' + inflect(containerTypeText, containerType.quantity) + displayText + ', ' : '') : '');
  }

  rackDetails() {
    const { intakeKitItems } = this.props;
    const plateCount = intakeKitItems.filter(item => item.container_type_id === '96-pcr')[0];
    const boxCount = intakeKitItems.filter(item => item.container_type_id === 'micro-1.5')[0];
    const a1VialCount = intakeKitItems.filter(item => item.container_type_id === 'a1-vial')[0];
    const d1VialCount = intakeKitItems.filter(item => item.container_type_id === 'd1-vial')[0];
    const d2VialCount = intakeKitItems.filter(item => item.container_type_id === 'd2-vial')[0];
    const plateText = this.getOrderText(plateCount, 'plate', ' of Transcriptic 96-pcr');
    const boxText = this.getOrderText(boxCount, 'box', ' of Transcriptic 1.5mL tubes');
    const a1VialText = this.getOrderText(a1VialCount, 'Rack', ' of 24 A1 vials');
    const d1VialText = this.getOrderText(d1VialCount, 'Rack', ' of 12 D1 vials');
    const d2VialText = this.getOrderText(d2VialCount, 'Rack', ' of 8 HRD2 vials');
    const finalText = (plateText + boxText + a1VialText + d1VialText + d2VialText).replace(/,\s*$/, '');
    return (
      <p className="tx-type--heavy">
        {finalText}
      </p>
    );
  }

  renderShippingStatus() {
    if (this.shouldRenderShippingStatus) {
      return (
        <p className="shipment-card__shipping-status">
          {this.props.statusMessage}
        </p>
      );
    }

    return undefined;
  }

  renderHeader() {
    return (
      <div className={classNames('shipment-card__header', { 'shipment-card__header--center': this.props.actionText })}>
        <h3 className="shipment-card__title">{this.props.title}</h3>
        <Choose>
          <When condition={this.props.actionText}>
            <div className="shipment-card__action-button-wrapper">
              <Choose>
                <When condition={this.props.actionLeavesPage}>
                  <Button link type="primary" onClick={this.props.onAction}>{this.props.actionText}</Button>
                </When>
                <Otherwise>
                  <Button type="primary" size="small" height="short" onClick={this.props.onAction}>
                    {this.props.actionText}
                  </Button>
                </Otherwise>
              </Choose>
            </div>
          </When>
          <When condition={(!this.props.receivedAt && this.props.statusMessage)}>
            {this.renderShippingStatus()}
          </When>
        </Choose>
      </div>

    );
  }

  render() {

    const leftKeyValueEntries = this.generateLeftEntries();

    const rightKeyValueEntries = this.generateStatusEntries();

    // If there no action or status, and there's more entries on the right than the left, move the details up to better
    // use vertical space.
    const shouldAlignUp =
      !this.props.actionText &&
      !this.shouldRenderShippingStatus() &&
      (leftKeyValueEntries.length < rightKeyValueEntries.length);

    return (
      <div className={classNames('shipment-card', this.props.className)}>
        <div className="shipment-card__body-container">
          <div className="shipment-card__body">
            <div
              className={classNames(
                'shipment-card__header',
                { 'shipment-card__header--center': this.props.actionText }
              )}
            >
              <h3 className="shipment-card__title">{this.props.title}</h3>
              <Choose>
                <When condition={this.props.actionText}>
                  <div className="shipment-card__action-button-wrapper">
                    <Choose>
                      <When condition={this.props.actionLeavesPage}>
                        <Button link type="primary" onClick={this.props.onAction}>{this.props.actionText}</Button>
                      </When>
                      <Otherwise>
                        <Button type="primary" size="small" height="short" onClick={this.props.onAction}>
                          {this.props.actionText}
                        </Button>
                      </Otherwise>
                    </Choose>
                  </div>
                </When>
                <When condition={(!this.props.receivedAt && this.props.statusMessage)}>
                  {this.renderShippingStatus()}
                </When>
              </Choose>
            </div>
            <div className={classNames(
              'shipment-card__details',
              { 'shipment-card__details--align-up': shouldAlignUp })}
            >
              <div>
                {this.props.intakeKitItems && this.rackDetails()}
                <KeyValueList
                  isLeftRight
                  alignLeft
                  entries={leftKeyValueEntries}
                />
              </div>
              <div>
                <If condition={this.props.actionText}>
                  {this.renderShippingStatus()}
                </If>
                <KeyValueList
                  isLeftRight
                  alignRight
                  entries={rightKeyValueEntries}
                />
              </div>
            </div>
          </div>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default ShipmentCard;
