import { inflect } from 'inflection';
import React       from 'react';

import ModalActions        from 'main/actions/ModalActions';
import ShippingCartActions from 'main/actions/ShippingCartActions';
import ShippingCartModal   from 'main/components/ShippingCartModal';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import ShippingCartStore   from 'main/stores/ShippingCartStore';

const MODAL_ID = 'ShippingCartModal';

class ShippingCart extends React.Component {
  render() {
    const cartSize = ShippingCartStore.size();

    return (
      <div>
        <ShippingCartModal
          modalId={MODAL_ID}
          onDismiss={() => ModalActions.close(MODAL_ID)}
        />
        <If condition={cartSize > 0 && Transcriptic.current_user}>
          <div className="shipping-cart-layer">
            <div className="shipping-cart">
              {`${cartSize} ${inflect('sample', cartSize)} in cart`}

              <div
                className="ship-cart"
                onClick={(e) => {
                  e.stopPropagation();
                  ModalActions.open(MODAL_ID);
                }}
              >
                Ship
              </div>

              <div
                className="clear-cart"
                onClick={(e) => {
                  e.stopPropagation();
                  ShippingCartActions.empty();
                }}
              >
                Empty
              </div>
            </div>
          </div>
        </If>
      </div>
    );
  }
}

export default ConnectToStores(ShippingCart, () => {});
