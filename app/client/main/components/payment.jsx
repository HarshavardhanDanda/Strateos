import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import { LabeledInput, DateSelector, TextInput, Table, Column } from '@transcriptic/amino';
import AddressStore from 'main/stores/AddressStore';
import Urls from 'main/util/urls';
import AttachmentUploader from 'main/components/AttachmentUploader';

class CreditCardInfoEditor extends React.Component {
  render() {
    return (
      <div className="tx-stack tx-stack--sm">
        <LabeledInput label="Name On Card">
          <TextInput
            placeholder="John Appleseed"
            value={this.props.cardInfo.name}
            onChange={e =>
              this.props.onChange(
                _.extend({}, this.props.cardInfo, {
                  name: e.target.value
                })
              )}
          />
        </LabeledInput>
        <LabeledInput label="Credit Card Number">
          <TextInput
            placeholder="4444 4444 4444 4444"
            value={this.props.cardInfo.number}
            onChange={e =>
              this.props.onChange(
                _.extend({}, this.props.cardInfo, {
                  number: e.target.value
                })
              )}
          />
        </LabeledInput>
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Expiration Date">
              <DateSelector
                date={this.props.cardInfo.expiry}
                onChange={(e) => {
                  return this.props.onChange(
                    _.extend({}, this.props.cardInfo, {
                      expiry: e.target.value
                    })
                  );
                }}
              />
            </LabeledInput>
          </div>
          <div className="col-sm-6">
            <LabeledInput label="Security Code">
              <TextInput
                placeholder="123"
                value={this.props.cardInfo.cvc}
                onChange={e =>
                  this.props.onChange(
                    _.extend({}, this.props.cardInfo, {
                      cvc: e.target.value
                    })
                  )}
              />
            </LabeledInput>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Zip Code">
              <TextInput
                placeholder="12345"
                value={this.props.cardInfo.address_zip}
                onChange={e =>
                  this.props.onChange(
                    _.extend({}, this.props.cardInfo, {
                      address_zip: e.target.value
                    })
                  )}
              />
            </LabeledInput>
          </div>
        </div>
      </div>
    );
  }
}

CreditCardInfoEditor.propTypes = {
  onChange: PropTypes.func,
  cardInfo: PropTypes.shape({
    name: PropTypes.string,
    number: PropTypes.string,
    cvc: PropTypes.string,
    address_zip: PropTypes.string,
    expiry: PropTypes.object
  })
};

class PurchaseOrderInfoEditor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onPOAttached = this.onPOAttached.bind(this);
    this.onPOUploadAborted = this.onPOUploadAborted.bind(this);
    this.onPOUploaded = this.onPOUploaded.bind(this);
    this.prepareTableData = this.prepareTableData.bind(this);
    this.renderTableRecord = this.renderTableRecord.bind(this);
    this.onAddressIdChange = this.onAddressIdChange.bind(this);

    this.state = {
      poFile: undefined,
      uploading: false,
      selected: {}
    };
  }

  componentDidMount() {
    this.setAddress();
  }

  setAddress() {
    const address_id = this.props.address_id ? this.props.address_id : undefined;
    if (address_id) {
      const selected = {};
      selected[address_id] = true;
      this.setState({ selected });
    }
  }

  prepareTableData(addresses) {
    const data = [];

    addresses.forEach((address) => {
      const element = {};
      element.id = address.get('id');
      element[1] = address.get('attention');
      element[2] = `${address.get('street')}, ${address.get('street_2') || ''}, 
        ${address.get('city')}, ${address.get('state')} ${address.get('zipcode')}, 
        ${window.ISO3166[address.get('country')].name}`;
      data.push(element);
    });

    return Immutable.fromJS(data);
  }

  onAddressIdChange(address_id) {
    this.props.onChange(
      _.extend({}, this.props.poInfo, {
        address_id
      })
    );
  }

  onPOAttached(files) {
    this.setState({
      poFile: files[0],
      uploading: true
    });
  }

  onPOUploaded({ id }) {
    this.props.onChange(
      _.extend({}, this.props.poInfo, {
        upload_id: id
      })
    );

    this.setState({
      uploading: false
    });
  }

  onPOUploadAborted() {
    this.setState({
      poFile: undefined,
      uploading: false
    });
  }

  renderTableRecord(record, rowIndex, colIndex) {
    return <p>{record.get((colIndex + 1).toString())}</p>;
  }

  render() {
    const addresses = AddressStore.getAll();
    const data = this.prepareTableData(addresses);

    return (
      <div className="tx-stack tx-stack--sm">
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Purchase Order (PDF/HTML)">
              <If condition={this.props.attachmentUrl}>
                <div style={{ paddingBottom: '15px' }}>
                  <a href={`/upload/url_for?key=${this.props.attachmentUrl}`} target="_blank" rel="noopener noreferrer">
                    <i className="fa fa-paperclip" /> Existing Attachment
                  </a>
                </div>
              </If>
              <AttachmentUploader
                uploading={this.state.uploading}
                files={this.state.poFile ? [this.state.poFile] : []}
                onUploadDone={this.onPOUploaded}
                onUploadAborted={this.onPOUploadAborted}
                multiple={false}
                onFilesSelected={this.onPOAttached}
                size="auto"
                accept=".pdf,.html"
              />
            </LabeledInput>
          </div>
          <div className="col-sm-6">
            <LabeledInput label="Alias (optional)">
              <TextInput
                value={this.props.poInfo.alias}
                onChange={e =>
                  this.props.onChange(
                    _.extend({}, this.props.poInfo, {
                      alias: e.target.value
                    })
                  )}
              />
            </LabeledInput>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Reference Number">
              <TextInput
                placeholder="(e.g. 93182203)"
                value={this.props.poInfo.po_reference_number}
                onChange={(e) => {
                  return this.props.onChange(
                    _.extend({}, this.props.poInfo, {
                      po_reference_number: e.target.value
                    })
                  );
                }}
              />
            </LabeledInput>
          </div>
          <div className="col-sm-6">
            <LabeledInput label="Expiration Date">
              <DateSelector
                date={this.props.poInfo.expiry}
                showDay
                onChange={e =>
                  this.props.onChange(
                    _.extend({}, this.props.poInfo, {
                      expiry: e.target.value
                    })
                  )}
              />
            </LabeledInput>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Limit">
              <div className="input-group">
                <span className="input-group-addon">$</span>
                <TextInput
                  placeholder="10000"
                  value={this.props.poInfo.po_limit}
                  onChange={e =>
                    this.props.onChange(
                      _.extend({}, this.props.poInfo, {
                        po_limit: e.target.value
                      })
                    )}
                />
              </div>
            </LabeledInput>
          </div>
        </div>
        <LabeledInput label="Bill to address (as indicated on P.O.)">
          { this.props.customerOrganizationId && (
            <p className="tx-type--secondary">Add new address in the
              <Link to={`${Urls.customer_organization(this.props.customerOrganizationId)}/addresses`}> Address pane.</Link>
            </p>
          )}
          <Table
            data={data}
            loaded
            onSelectRow={(record) => {
              const selected = {};
              selected[record.get('id')] = true;
              this.setState({ selected: selected });
              this.onAddressIdChange(record.get('id'));
            }}
            onSelectAll={() => { }}
            selected={this.state.selected}
            id="po-address-table"
          >
            <Column renderCellContent={this.renderTableRecord} header="Name" id="name-column" relativeWidth={1} />
            <Column renderCellContent={this.renderTableRecord} header="Address" id="address-column" relativeWidth={2} />
          </Table>
        </LabeledInput>
      </div>
    );
  }
}

PurchaseOrderInfoEditor.defaultProps = {
  poInfo: {}
};

PurchaseOrderInfoEditor.propTypes = {
  poInfo: PropTypes.shape({
    alias: PropTypes.string,
    po_reference_number: PropTypes.string,
    expiry: PropTypes.object,
    po_limit: PropTypes.string,
    po_attachment_url: PropTypes.string,
    address_id: PropTypes.string,
    po_address_inputs: PropTypes.instanceOf(Immutable.Map)
  }),
  onChange: PropTypes.func,
  attachmentUrl: PropTypes.string,
  customerOrganizationId: PropTypes.string
};

export { CreditCardInfoEditor, PurchaseOrderInfoEditor };
