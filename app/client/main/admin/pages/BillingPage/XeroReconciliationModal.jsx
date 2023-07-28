import _ from 'lodash';
import Accounting from 'accounting';
import React from 'react';
import Moment     from 'moment';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { Table, Column, DateTime } from '@transcriptic/amino';
import { SinglePaneModal }   from 'main/components/Modal';
import { Loading } from 'main/components/page';

class XeroReconciliationModal extends React.Component {

  static get propTypes() {
    return {
      date:    PropTypes.string,
      modalId: PropTypes.string,
      dataFetch: PropTypes.func
    };
  }

  static get MODAL_ID() {
    return 'XERO_RECONCILIATION_MODAL';
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      invoices: Immutable.List()
    };
  }

  componentDidMount() {
    this.props.dataFetch(this.props.date).then((data) => {
      const immData = Immutable.fromJS(data);

      return this.setState({
        invoices: immData.get('merged').valueSeq().toList(),
        xero: immData.get('xero'),
        local: immData.get('local')
      });
    });
  }

  totalXero() {
    return this.state.xero.reduce((m, o) => m + parseFloat(o.get('total')), 0);
  }

  totalLocal() {
    return this.state.local.reduce((m, o) => m + parseFloat(o.get('total')), 0);
  }

  renderDateValue(invoice, key) {
    return invoice.has(key) ? <DateTime timestamp={invoice.get(key)} /> : '-';
  }

  render() {
    return (
      <SinglePaneModal modalSize="large" modalId={this.props.modalId} title="Xero Reconciliation">
        <div>
          <p>
            {`Capturing invoices from ${Moment(this.props.date).format('DD MMM YYYY')}
             through end of that month. All invoices in Xero shown here have been paid.`}
          </p>
          <div className="row">
            <Choose>
              <When condition={this.state.invoices.size === 0}>
                <Loading />
              </When>
              <Otherwise>
                <Table
                  loaded
                  data={this.state.invoices}
                  footer
                  disabledSelection
                  id="xero-reconcile-table"
                >
                  <Column
                    renderCellContent={(invoice) => invoice.get('invoice_number')}
                    header="ID"
                    id="id-column"
                    footer={`Xero Total: ${Accounting.formatMoney(this.totalXero())}`}
                    disableFormatHeader
                  />
                  <Column
                    renderCellContent={(invoice) => invoice.get('organization')}
                    header="Organization"
                    id="org-column"
                    footer={`Local Total: ${Accounting.formatMoney(this.totalLocal())}`}
                  />
                  <Column
                    renderCellContent={(invoice) => this.renderDateValue(invoice, 'xero_date')}
                    header="Xero Date"
                    id="xero-date-column"
                    footer={`Discrepancy: ${Accounting.formatMoney(this.totalXero() - this.totalLocal())}`}
                  />
                  <Column
                    renderCellContent={(invoice) => this.renderDateValue(invoice, 'charged_at')}
                    header="Local Charged Date"
                    id="charged-date-column"
                    style={{ 'text-overflow': 'unset' }}
                  />
                  <Column
                    renderCellContent={(invoice) => this.renderDateValue(invoice, 'created_at')}
                    header="Local Created Date"
                    id="created-date-column"
                    style={{ 'text-overflow': 'unset' }}
                  />
                  <Column
                    renderCellContent={(invoice) => [
                      `${Accounting.formatMoney(invoice.get('local_total'))}`,
                      `${Accounting.formatMoney(invoice.get('xero_total')) || '-'}`
                    ].join(' ')}
                    header="Total (Xero)"
                    id="total-column"
                  />
                </Table>
              </Otherwise>
            </Choose>
          </div>
        </div>
      </SinglePaneModal>
    );
  }
}
export default XeroReconciliationModal;
