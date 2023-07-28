import Immutable    from 'immutable';
import Moment       from 'moment';
import React        from 'react';
import _            from 'lodash';
import PropTypes from 'prop-types';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import * as ContainerUtil from 'main/util/ContainerUtil';

import { StatusPill, DateTime } from '@transcriptic/amino';

class ContainerBadge extends React.Component {
  static get propTypes() {
    return {
      container:      PropTypes.instanceOf(Immutable.Map),
      staleContainer: PropTypes.instanceOf(Immutable.Map),
      inShippingCart: PropTypes.bool,
      shipment:       PropTypes.instanceOf(ShipmentModel)
    };
  }

  statusBadgeInfo() {
    const { container, staleContainer, shipment } = this.props;
    const destructionTime = staleContainer != undefined ? staleContainer.get('willBeDestroyedAt') : undefined;

    switch (container.get('status')) {
      case 'available':
        if (destructionTime) {
          if (Moment() > Moment(destructionTime)) {
            return ['warning', 'fa-trash-alt', 'Destruction imminent'];
          } else {
            const span = (
              <span>
                Will be destroyed
                <DateTime format="from-now" timestamp={destructionTime} />
              </span>
            );
            return ['warning', 'fa-trash-alt', span];
          }
        }
        break;
      case 'inbound':
        return ['info', 'fa-truck', `Member of inbound shipment ${shipment ? shipment.label() : ''}`];
      case 'pending_destroy':
        return ['warning', 'fa-trash-alt', 'Pending destruction'];
      case 'destroyed':
        return ['danger', 'fa-trash-alt', 'Destroyed'];
      case 'pending_return':
        return ['info', 'fa-archive', 'Preparing for return shipment'];
      case 'returned':
        return ['info', 'fa-ship', 'Shipped out'];
      default:
        return undefined;
    }
  }

  renderBadge(text, icon, type) {
    return <StatusPill type={type} icon={icon} text={text} shape="tag" />;
  }

  render() {
    const { container, inShippingCart } = this.props;
    const isTestMode = container.get('test_mode');
    const isStock = ContainerUtil.isStock(container);
    const info = this.statusBadgeInfo();

    const testBadge = isTestMode && (
      this.renderBadge('Test mode', 'fa-wrench', 'warning')
    );

    const shippingCartBadge = inShippingCart && (
      this.renderBadge('In shipping cart', 'fa-shopping-cart', 'info')
    );

    const stockBadge = isStock && (
      this.renderBadge('Stock container', 'fa-warehouse', 'success')
    );

    let statusBadge;

    if (info) {
      const [labelType, iconClass, labelTitle] = info;
      statusBadge = this.renderBadge(labelTitle, iconClass, labelType);
    }

    return (
      <div className="container-badge tx-inline tx-inline--sm">
        {testBadge}
        {shippingCartBadge}
        {stockBadge}
        {statusBadge}
      </div>
    );
  }
}

export default ContainerBadge;
