import _         from 'lodash';
import Immutable from 'immutable';
import Papa      from 'papaparse';
import PropTypes from 'prop-types';
import React     from 'react';
import Moment from  'moment';
import { Button, ButtonGroup, Table, Column, DateTime  } from '@transcriptic/amino';

import AddressText           from 'main/components/addressLib/addressText';
import ReturnShipmentActions from 'main/actions/ReturnShipmentActions';
import { ContainerTable }    from 'main/pages/ShipsPage/ReturnShipments/ContainerTable';

function ID(returnShipment) {
  return returnShipment.get('id');
}

function Organization(returnShipment) {
  return returnShipment.getIn(['organization', 'name']);
}

function Created(returnShipment) {
  return (
    <DateTime
      timestamp={Moment(returnShipment.get('created_at'))}
    />
  );
}

function ShippingTemp(returnShipment) {
  return returnShipment.get('temp');
}

function ShippingSpeed(returnShipment) {
  return returnShipment.get('speed');
}

function Address(returnShipment) {
  const address = returnShipment.get('address');

  return (
    <If condition={address}>
      <AddressText address={address} />
    </If>
  );
}

function Containers(returnShipment, rowIndex, colIndex, onExpandRow, isExpanded) {
  const labelURL = returnShipment.get('ep_label_url');

  return (
    <span>
      {returnShipment.get('containers').count()}
      {' '}
      <If condition={labelURL}>
        <a
          className="show-containers"
          onClick={() => onExpandRow(!isExpanded)}
        >
          {isExpanded ? 'hide' : 'show'}
        </a>
      </If>
    </span>
  );
}

function Label(returnShipment) {
  const labelURL = returnShipment.get('ep_label_url');

  return (
    <Choose>
      <When condition={labelURL}>
        <a rel="noopener noreferrer" target="_blank" href={labelURL}>Print label here</a>
      </When>
      <Otherwise>---</Otherwise>
    </Choose>
  );
}

function NextAction(returnShipment) {
  let csv;

  if (returnShipment.get('containers').size) {
    csv = encodeURI(Papa.unparse(returnShipment.get('containers').toJS()));
  }

  return (
    <ButtonGroup orientation="horizontal">
      {returnShipment.get('status') === 'authorized' ?
        (
          <React.Fragment>
            {returnShipment.get('address') &&
              (
                <Button
                  key="authorized"
                  type="secondary"
                  waitForAction
                  onClick={(callback) => {
                    ReturnShipmentActions.purchase(
                      returnShipment.get('id')
                    ).done(callback);
                  }}
                  icon="fas fa-square-dollar"
                  label="Purchase label"
                  heavy
                  link
                />
              )
            }
            <Button
              key="cancel"
              type="secondary"
              waitForAction
              onClick={callback =>
                ReturnShipmentActions.cancel(returnShipment.get('id')).done(callback)
              }
              icon="fas fa-circle-xmark"
              label="Cancel shipment"
              heavy
              link
            />
          </React.Fragment>
        )
        :
        returnShipment.get('status') === 'purchased' && (
          <Button
            key="purchased"
            type="secondary"
            waitForAction
            onClick={callback =>
              ReturnShipmentActions.ship(
                returnShipment.get('id')
              ).done(callback)
            }
            icon="fas fa-truck"
            label="Mark as shipped"
            heavy
            link
          />
        )
      }
      { !!returnShipment.get('containers').size &&
        (
          <Button
            type="secondary"
            to={`data:text/csvcharset=utf-8,${csv}`}
            tagLink
            newTab
            download="containers.csv"
            icon="fas fa-download"
            label="Download contents"
            heavy
            link
          />
        )
      }
    </ButtonGroup>
  );
}

function ExpandedRow(returnShipment) {
  return (
    <ContainerTable containers={returnShipment.get('containers')} />
  );
}

class ReturnShipmentsTable extends React.Component {

  static get propTypes() {
    return {
      returnShipments: PropTypes.instanceOf(Immutable.Iterable).isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      expanded: {}
    };
  }

  render() {
    const data = this.props.returnShipments;

    return (
      <Table
        loaded={!_.isNil(data)}
        data={data}
        disabledSelection
        expanded={this.state.expanded}
        renderExpandedRow={ExpandedRow}
        onExpandRow={(record, willBeExpanded, expandedRows) => { this.setState({ expanded: expandedRows }); }}
        id="ReturnShipments"
      >
        <Column renderCellContent={ID} header="ID" disableFormatHeader id="id" />
        <Column renderCellContent={Organization} header="Organization" id="organization" />
        <Column renderCellContent={Created} header="Created" id="created" />
        <Column renderCellContent={ShippingTemp} header="Shipping Temp" id="shipping-temp" />
        <Column renderCellContent={ShippingSpeed} header="Shipping Speed" id="shipping-speed" />
        <Column renderCellContent={Address} header="Address"id="address" />
        <Column renderCellContent={Containers} header="Containers" id="containers" />
        <Column renderCellContent={Label} header="Label" id="label" />
        <Column renderCellContent={NextAction} style={{ whiteSpace: 'normal' }} header="Next Action" id="next-action" />
      </Table>
    );
  }
}

export default ReturnShipmentsTable;
