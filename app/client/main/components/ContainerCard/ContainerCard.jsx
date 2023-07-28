import classNames from 'classnames';
import Immutable  from 'immutable';
import Moment     from 'moment';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Card, DateTime } from '@transcriptic/amino';

import './ContainerCard.scss';

class ContainerCard extends React.Component {

  constructor(props) {
    super(props);

    this.canShowShipmentInfo = this.canShowShipmentInfo.bind(this);
    this.showShipmentLabel = this.showShipmentLabel.bind(this);
    this.showShipmentCode = this.showShipmentCode.bind(this);
    this.aliquotCount = this.aliquotCount.bind(this);
    this.containerTitle = this.containerTitle.bind(this);

    this.state = {
      showOverlay: false
    };
  }

  canShowShipmentInfo() {
    const status = this.props.container.get('status');
    return (
      (this.props.shipment !== undefined) &&
      (this.props.shipment.get('checked_in_at') == undefined) &&
      !['destroyed', 'pending_destory'].includes(status)
    );
  }

  showShipmentLabel() {
    return (
      this.canShowShipmentInfo() &&
      !this.props.shipmentLabelDisabled &&
      this.props.shipment.get('label') != undefined
    );
  }

  showShipmentCode() {
    return (
      this.canShowShipmentInfo() &&
      this.props.container.get('shipment_code') !== undefined
    );
  }

  aliquotCount() {
    const aliquotCount = this.props.container.get('aliquot_count');
    const aliquots = this.props.container.get('aliquots');

    if (aliquotCount) {
      return aliquotCount;
    } else if (aliquots) {
      return aliquots.size;
    }

    return undefined;
  }

  containerTitle() {
    const label = this.props.container.get('label');
    const fullText = (label !== undefined) ? label : this.props.container.get('id');

    if (fullText.length > this.props.maxTitleLength) {
      const prefixLength = (this.props.maxTitleLength / 2) - 1;
      const suffixLength = prefixLength - 2;
      const suffixStart = fullText.length - suffixLength;

      return `${fullText.slice(0, prefixLength)}...${fullText.slice(suffixStart)}`;
    } else {
      return fullText;
    }
  }

  render() {
    const isTube = this.props.container.getIn(['container_type', 'is_tube']);
    const containerTypeId = this.props.container.getIn([
      'container_type',
      'id'
    ]);
    const containerCategory = isTube ? 'Tube' : 'Plate';
    const iconSuffix = isTube ? 'tube-icon.svg' : 'plate-icon.svg';
    const iconUrl = `/images/icons/inventory_browser_icons/${iconSuffix}`;
    const status = this.props.container.get('status');
    const destroyedAt = <DateTime timestamp={(this.props.container.get('deleted_at'))} />;
    const testMode = this.props.container.get('test_mode', false);
    const destructionTime = this.props.container.get('will_be_destroyed_at');

    let destructionNotice;

    if (destructionTime) {
      destructionNotice = (Moment() > Moment(destructionTime)) ?
        'Destruction imminent'
        :
        [
          'Will be destroyed ',
          <DateTime key="destruction-time-key" format="from-now" timestamp={destructionTime} />
        ];
    }

    return (
      <div
        onMouseEnter={() =>
          this.setState({
            showOverlay: true
          })}
        onMouseLeave={() =>
          this.setState({
            showOverlay: false
          })}
        className={this.props.className ? this.props.className : ''}
      >
        <Card
          selected={this.props.isSelected}
          className={classNames('container-card', { 'container-card--standard-width': this.props.standardWidth })}
        >
          <div className="card__content">
            <div className="card__header">
              <div className="name-code-container">
                {this.showShipmentCode() &&
                  (
                  <h4 className="shipment-code">
                    {this.props.container.get('shipment_code')}
                  </h4>
                  )
                }
                <p className="card__title">{this.containerTitle()}</p>
              </div>
              <img
                className={classNames({
                  shipping: this.canShowShipmentInfo()
                })}
                src={iconUrl}
                alt={isTube ? 'Tube Icon' : 'Plate Icon'}
              />
            </div>
            <div className="card-footer">
              <div className="detail extra-detail desc">
                {this.aliquotCount() ?
                  `${this.aliquotCount()} aliquots (${containerTypeId})`
                  : { containerTypeId }
                }
              </div>
              {this.props.justCreated ? (
                <div className="detail created-at">
                  <span className="tx-type--success">NEW </span>
                  <span className="date desc">Created just now</span>
                </div>
              )
                :
                (status === 'destroyed') || (status === 'pending_destroy') ? (
                  <div className="detail">
                    <span className="desc tx-type--error">
                      <Choose>
                        <When condition={status === 'destroyed'}>
                          {`Destroyed ${destroyedAt}`}
                        </When>
                        <Otherwise>Pending Destruction</Otherwise>
                      </Choose>
                    </span>
                  </div>
                )
                  :
                  destructionTime ?
                    (
                      <div className="detail">
                        <span className="desc tx-type--error">
                          {destructionNotice}
                        </span>
                      </div>
                    )
                    : (
                      <div className="detail created-at">
                        <span className="date desc">{'Created'}
                          <DateTime timestamp={(this.props.container.get('created_at'))} />
                        </span>
                      </div>
                    )}
              {testMode &&
                (
                <div className="detail">
                  <span className="desc tx-type--warning">Test Container</span>
                </div>
                )
              }
              {this.showShipmentLabel() &&
                (
                <div className="shipping-label">
                  <span className="desc">
                    {`Please ship ${this.props.shipment.get('label')}`}
                  </span>
                </div>
                )
              }
            </div>
          </div>
          {
            ((this.state.showOverlay || this.props.isSelected) &&
              !this.props.overlayDisabled)
            &&
            (
              <CardDetailHover
                text={`View ${containerCategory}`}
                isSelected={this.props.isSelected}
                isSelectable={this.props.isSelectable}
                isFetching={this.props.isFetching}
                onSelected={() => {
                  this.props.onContainerSelected(
                    this.props.container.get('id'),
                    !this.props.isSelected
                  );
                }}
                onDetailsClicked={() => {
                  this.props.onViewDetailsClicked(this.props.container);
                }}
              />
            )
          }
        </Card>
      </div>
    );
  }
}

ContainerCard.propTypes = {
  shipment: PropTypes.instanceOf(Immutable.Map),
  container: PropTypes.instanceOf(Immutable.Map),
  shipmentLabelDisabled: PropTypes.bool,
  maxTitleLength: PropTypes.number,
  isSelected: PropTypes.bool,
  justCreated: PropTypes.bool,
  overlayDisabled: PropTypes.bool,
  isSelectable: PropTypes.bool,
  isFetching: PropTypes.bool,
  onContainerSelected: PropTypes.func,
  onViewDetailsClicked: PropTypes.func,
  className: PropTypes.string,
  standardWidth: PropTypes.bool
};

ContainerCard.defaultProps = {
  isSelected: false,
  isSelectable: false,
  isFetching: false,
  showShipmentCode: false,
  shipment: undefined,
  shipmentLabelDisabled: false,
  overlayDisabled: false,
  maxTitleLength: 35
};

class CardDetailHover extends React.Component {
  render() {
    return (
      <div
        className={
          classNames(
            'card-detail-hover',
            {
              selected: this.props.isSelected
            }
          )
        }
      >
        { this.props.isSelectable &&
          (
            <div
              className={
              classNames(
                'checkbox',
                {
                  checked: this.props.isSelected
                }
              )
            }

              onClick={this.props.onSelected}
            >
              {this.props.isSelected &&
              <i className="fa fa-check" />
              }
            </div>
          )
        }

        { this.props.isFetching ?
          <i className="fa fa-spinner fa-spin" />
          : (
            <button
              className="view-details"
              onClick={this.props.onDetailsClicked}
            >{this.props.text}
            </button>
          )
        }
      </div>
    );
  }
}

CardDetailHover.defaultProps = {
  isSelected: false,
  isSelectable: false,
  isFetching: false
};

CardDetailHover.propTypes = {
  onDetailsClicked: PropTypes.func,
  isSelected: PropTypes.bool,
  isSelectable: PropTypes.bool,
  isFetching: PropTypes.bool,
  onSelected: PropTypes.func,
  text: PropTypes.string
};

export { CardDetailHover, ContainerCard };
