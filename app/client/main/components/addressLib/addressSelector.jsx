import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import { Spinner, RadioGroup, Radio, Button, ModalDrawer }    from '@transcriptic/amino';
import SelectableBox  from 'main/components/SelectableBox';
import RowWrappedGrid from 'main/components/grid';
import AddressCreator from './addressCreator';
import AddressText    from './addressText';

function AddressBox(props) {
  return (
    <div className="grid-element">
      <SelectableBox selected={props.isSelected} onClick={props.onSelect}>
        <div className="address-text-container address-selector__address">
          <AddressText address={props.address} />
        </div>
      </SelectableBox>
    </div>
  );
}

AddressBox.propTypes = {
  address: PropTypes.instanceOf(Immutable.Map),
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func
};

class AddressSelector extends React.Component {
  static get propTypes() {
    return {
      addresses:              PropTypes.instanceOf(Immutable.Iterable),
      onAddressIdChange:      PropTypes.func.isRequired,
      addressId:              PropTypes.string,
      loadAllAddresses:       PropTypes.func.isRequired,
      createAddress:          PropTypes.func.isRequired,
      disableAddressCreation: PropTypes.bool,
      useNewAddressSelectorFormat: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      disableAddressCreation: false,
      useNewAddressSelectorFormat: false
    };
  }

  constructor(props) {
    super(props);
    this.addressCreatorEle = React.createRef();
    this.state = {
      loading: true,
      childDrawerState: false
    };
    this.onAddressSelected = this.onAddressSelected.bind(this);
  }

  componentWillMount() {
    this.props.loadAllAddresses()
      .done((addresses) => {
        if (!this.props.addressId) {
          this.props.onAddressIdChange(
            addresses.length > 0 ? addresses[0].id : undefined
          );
        }
        this.setState({ loading: false });
      });
  }

  formattedAddress(address) {
    return (
      <div>
        {address.get('attention') && (<p className="tx-type--primary"><strong>{address.get('attention', '')}</strong></p>) }
        <p className="tx-type--primary" style={{ margin: 0 }}>
          {address.get('street')} {address.get('street_2', '')}, {address.get('city')},
          {address.get('state')}, {address.get('zipcode')}, {address.get('country', '')}
        </p>
      </div>
    );
  }

  triggerAction(e) {
    this.addressCreatorEle.current.saveOrUpdate(e);
  }

  onAddressSelected(address) {
    if (typeof address === 'string') {
      this.props.onAddressIdChange(address || undefined);
    } else {
      this.props.onAddressIdChange(address ? address.get('id') : undefined);
    }
    this.setState({
      childDrawerState: false
    });
  }

  renderAddressForm() {
    return (
      <AddressCreator
        ref={this.addressCreatorEle}
        onAddressCreated={this.onAddressSelected}
        createAddress={this.props.createAddress}
        newAddressForm
      />
    );
  }

  renderFooterButtons() {
    return (
      <React.Fragment>
        <Button
          type="secondary"
          size="small"
          height="standard"
          className="goto-button"
          onClick={() => this.setState({ childDrawerState: false })}
        >
          Back
        </Button>
        <Button
          type="primary"
          size="small"
          height="standard"
          className="goto-button"
          style={{ marginLeft: '8px' }}
          waitForAction
          onClick={(e) => this.triggerAction(e)}
        >
          Use this address
        </Button>
      </React.Fragment>
    );
  }

  renderNewFormat() {
    return (
      <React.Fragment>
        <RadioGroup
          name="address-picker"
          value={this.props.addressId}
          onChange={(e) => {
            this.onAddressSelected(e.target.value);
          }}
        >
          {this.props.addresses.map((address) => {
            return (
              <Radio
                value={address.get('id')}
                key={address.get('id')}
                id={address.get('id')}
                label={this.formattedAddress(address)}
              />
            );
          })
          }
        </RadioGroup>
        {!this.props.disableAddressCreation && (
          <div className="address-selector__add-button">
            <Button
              link
              type="info"
              icon="fal fa-plus"
              onClick={() => this.setState({ childDrawerState: true })}
            >
              Add new address
            </Button>
          </div>
        )}
        <ModalDrawer
          title="Shipping address"
          drawerState={this.state.childDrawerState}
          onDrawerClose={() => this.setState({ childDrawerState: false })}
          drawerChildren={this.renderAddressForm()}
          drawerFooterChildren={this.renderFooterButtons()}
          sideTransition
        />
      </React.Fragment>
    );
  }

  renderOldFormat() {
    return (
      <React.Fragment>
        <RowWrappedGrid>
          {this.props.addresses.map((address) => {
            return (
              <AddressBox
                key={address.get('id')}
                address={address}
                isSelected={address.get('id') === this.props.addressId}
                onSelect={() => this.onAddressSelected(address)}
              />
            );
          }
          )}
          {!this.props.disableAddressCreation && (
            <div className="grid-element" key="new-address">
              <SelectableBox
                placeholder
                selected={!this.props.addressId}
                onClick={() => this.onAddressSelected(undefined)}
              >
                <div className="address-selector__address address-selector__address--new">
                  <i className="fa fa-2x fa-pencil-alt" />
                  <h3 className="address-selector__address-title">Add a new address</h3>
                </div>
              </SelectableBox>
            </div>
          )}
        </RowWrappedGrid>
        {this.props.addressId ?
          undefined :
          (
            <AddressCreator
              onAddressCreated={this.onAddressSelected}
              createAddress={this.props.createAddress}
            />
          )}
      </React.Fragment>
    );
  }

  render() {
    if (this.state.loading) return <Spinner />;

    return (
      <div className="address-selector">
        {this.props.useNewAddressSelectorFormat ? this.renderNewFormat() : this.renderOldFormat()}
      </div>
    );
  }
}

export default AddressSelector;
