import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import {
  Section,
  LabeledInput,
  TextInput,
  TextArea,
  Select,
  DateTime,
  TextBody
} from '@transcriptic/amino';
import MaterialOrderStatus from 'main/util/MaterialOrderStatus';

import './EditMaterialOrderPage.scss';

class EditMaterialOrderDetail extends React.Component {

  constructor(props) {
    super(props);
    _.bindAll(
      this,
      'renderName',
      'renderSupplier'
    );
  }

  renderName() {
    return this.props.order.getIn(['material', 'name'], '');
  }

  renderSupplier() {
    return this.props.order.getIn(['material', 'supplier', 'name'], '');
  }

  renderCreateAt() {
    return <DateTime timestamp={(this.props.order.get('created_at'))} />;
  }

  renderLocation() {
    return this.props.order.getIn(['lab', 'name'], '');
  }

  renderUser() {
    return this.props.order.getIn(['user', 'name'], '');
  }

  renderLabel(headerText) {
    return <TextBody heavy color="secondary" formatText>{headerText}</TextBody>;
  }

  render() {
    const { trackingCode, note, isReadOnly } = this.props;
    return (
      <div className="row">
        <div className="col-md-4 edit-material-order-page__detail-col">
          <Section title="Details" />
          <div className="tx-stack tx-stack--xxs">
            <LabeledInput label="Order ID">
              { isReadOnly ? (
                <p className="tx-type--secondary">
                  {this.props.order.get('vendor_order_id') || '-'}
                </p>
              ) : (
                <TextInput
                  className="edit-material-order-page__text-input-order-id"
                  placeholder="Order ID"
                  value={this.props.order.get('vendor_order_id') || ''}
                  onChange={e => this.props.handleChange('orderId', e.target.value)}
                />
              )}
            </LabeledInput>
            <dl className="dl-horizontal">
              <dt>{this.renderLabel('Shipment')}</dt>
              <dd>{this.renderName()}</dd>
              <dt>{this.renderLabel('Supplier')}</dt>
              <dd>{this.renderSupplier()}</dd>
              <dt>{this.renderLabel('Date')}</dt>
              <dd>{this.renderCreateAt()}</dd>
              <dt>{this.renderLabel('Lab')}</dt>
              <dd>{this.renderLocation()}</dd>
              <dt>{this.renderLabel('User')}</dt>
              <dd>{this.renderUser()}</dd>
            </dl>
          </div>
        </div>

        <div className="col-md-8 edit-material-order-page__status-col">
          <Section title="Status">
            <div className="col-md-6 tx-stack tx-stack--xxs">
              <LabeledInput label="ORDER STATUS">
                <Select
                  options={[
                    { name: 'Pending', value: MaterialOrderStatus.PENDING }, { name: 'Purchased', value: MaterialOrderStatus.PURCHASED },
                    { name: 'Shipped', value: MaterialOrderStatus.SHIPPED }, { name: 'Arrived', value: MaterialOrderStatus.ARRIVED },
                    { name: 'Checked-in', value: MaterialOrderStatus.CHECKEDIN }]}
                  value={this.props.status}
                  onChange={e => this.props.handleChange('status', e.target.value)}
                  placeholder="Select type"
                  disabled={isReadOnly}
                />
              </LabeledInput>
              <LabeledInput label="TRACKING">
                { isReadOnly ? (
                  <p className="tx-type--secondary">
                    {trackingCode || '-'}
                  </p>
                ) : (
                  <TextInput
                    className="edit-material-order-page__text-input-tracking"
                    placeholder="Enter tracking code"
                    value={trackingCode}
                    onChange={e => this.props.handleChange('trackingCode', e.target.value)}
                  />
                )}
              </LabeledInput>
            </div>
            <div className="col-md-6">
              <div className="edit-material-order-page__note">
                <LabeledInput label="NOTES">
                  {
                    isReadOnly ? (
                      <p className="tx-type--secondary">
                        {note || '-'}
                      </p>
                    ) : (
                      <TextArea
                        className="edit-material-order-page__text-input-note"
                        placeholder="Leave a message about the order"
                        name="outcome"
                        value={note}
                        onChange={e => this.props.handleChange('note', e.target.value)}
                      />
                    )}
                </LabeledInput>
              </div>
            </div>
          </Section>
        </div>
      </div>
    );
  }
}

EditMaterialOrderDetail.propTypes = {
  order: PropTypes.instanceOf(Immutable.Map),
  handleChange: PropTypes.func,
  isReadOnly: PropTypes.bool.isRequired
};

export default EditMaterialOrderDetail;
