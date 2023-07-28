import classNames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import Accounting        from 'accounting';
import Urls                from 'main/util/urls';
import { Table, Column } from '@transcriptic/amino';

class ProjectInvoice extends React.Component {

  constructor(props) {
    super(props);

    this.state = { expanded: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    return this.setState({ expanded: !this.state.expanded });
  }

  prepareData(items) {

    let idCounter = 1;
    const data = [];

    items.forEach(item => {
      const element = {};
      element.id = idCounter++;
      element[1] = item.get('name');
      element[2] = item.get('quantity');
      element[3] = Accounting.formatMoney(item.get('charge'));
      element[4] = Accounting.formatMoney(item.get('total'));
      data.push(element);
    });

    return Immutable.fromJS(data);

  }

  renderTableRecord(record, rowIndex, colIndex) {
    return record.get((colIndex + 1).toString());
  }

  render() {
    const { items } =  this.props;
    const data = this.prepareData(items);
    const classes = classNames('invoice__card', {
      expanded: this.state.expanded
    });

    return (
      <div className={classes} onClick={this.toggle}>
        <div className="invoice-card__header">
          <h4>
            {
              this.props.project_id ?
                `Project: ${
                  (this.props.project && this.props.project.get('name')) ?
                    this.props.project.get('name')
                    :
                    this.props.project_id
                }`
                :
                'No Project'
            }
          </h4>
          <div className="invoice-card__download-wrapper col-sm-5">
            {
              (this.props.invoice && (this.props.invoice.get('xero_invoice_number') || this.props.invoice.get('netsuite_invoice_id'))) && (
                <div className="invoice-card__download">
                  <a href={Urls.invoice(this.props.invoice.get('id'))}>
                    Download PDF
                  </a>
                </div>
              )}
            <h4>Project Total:
              <span className="tx-type--primary"> {Accounting.formatMoney(
                this.props.items.reduce(
                  ((m, o) => {
                    return m + parseFloat(o.get('total'));
                  }), 0
                ))}
              </span>
              <i className={`invoice-card__header--left fa fa-chevron-${this.state.expanded ? 'down' : 'right'}`} />
            </h4>
          </div>
        </div>
        <If condition={this.state.expanded}>
          <Table
            data={data}
            loaded
            disabledSelection
            id="invoice-table"
          >
            <Column renderCellContent={this.renderTableRecord} header="Item" id="item-column" />
            <Column renderCellContent={this.renderTableRecord} header="Qty" id="qty-column" />
            <Column renderCellContent={this.renderTableRecord} header="Unit Price" id="price-column" />
            <Column renderCellContent={this.renderTableRecord} header="Total" id="total-column" />
          </Table>
        </If>
      </div>
    );
  }
}

ProjectInvoice.propTypes = {
  items:      PropTypes.instanceOf(Immutable.Iterable).isRequired,
  project_id: PropTypes.string,
  project:    PropTypes.instanceOf(Immutable.Map),
  invoice:    PropTypes.instanceOf(Immutable.Map)
};

export default ProjectInvoice;
