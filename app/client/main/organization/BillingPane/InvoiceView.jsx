import Accounting from 'accounting';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Divider }         from '@transcriptic/amino';
import ProjectInvoice      from './ProjectInvoice';

class InvoiceView extends React.Component {

  render() {
    const allItems        = this.props.invoice.get('invoice_items');
    const byCredit        = allItems.groupBy(item => item.get('credit_id') != undefined);
    const creditItems     = byCredit.get(true, Immutable.List());
    const nonCreditItems  = byCredit.get(false, Immutable.List());
    const projectGroups   = nonCreditItems.groupBy(item => item.get('project_id'));

    return (
      <div>
        {
          projectGroups.map((items, projectId) => {
            const project = Immutable.Map({ id: projectId, name: items.getIn([0, 'project_name']) });
            return (
              <div key={projectId}>
                <Divider />
                <ProjectInvoice
                  key={projectId} // eslint-disable-line react/no-array-index-key
                  project_id={projectId}
                  project={project}
                  items={items}
                  invoice={this.props.invoice}
                />
              </div>
            );
          }).toList()
        }
        {
          creditItems.map((item) => {
            return (
              <div className="invoice-view__invoice invoice__card" key={item.get('credit_id')}>
                <div className="invoice-card__header invoice-card__header--credit">
                  <h4 className="invoice-card__header--long">
                    <i className="fa fa-fw fa-money-bill-alt" />
                    {
                      ` ${item.get('name')}`
                    }
                  </h4>
                  <div className="invoice-card__header--strong">
                    {
                      Accounting.formatMoney(item.get('charge'))
                    }
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }
}

InvoiceView.propTypes = {
  invoice:  PropTypes.instanceOf(Immutable.Map).isRequired
};

export default InvoiceView;
