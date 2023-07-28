import Accounting from 'accounting';
import PropTypes  from 'prop-types';
import React      from 'react';

import PriceTree from 'main/components/PriceTree';

class OrderSummary extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      showBreakdown: false
    };
  }

  total() {
    return this.props.quote.items.reduce(
      (m, item) => m + (item.cost * item.quantity),
      0
    );
  }

  renderSummaryRow(item) {
    return (
      <tr key={item.title}>
        <td className="order-summary__cell  order-summary__item-name">
          {`${item.quantity !== 1 ? item.quantity : ''} ${item.title}`}
        </td>
        <td className="order-summary__cell  order-summary__item-cost">
          {Accounting.formatMoney(item.cost * item.quantity)}
        </td>
      </tr>
    );
  }

  render() {
    return (
      <div className="order-summary">
        <h4 className="order-summary__title">Order Summary</h4>
        <Choose>
          <When condition={this.state.showBreakdown}>
            <div className="order-summary__description">
              <PriceTree node={this.props.quote.breakdown} />
            </div>
          </When>
          <Otherwise>
            <table className="order-summary__rows">
              {this.props.quote.items.map((item) => {
                return this.renderSummaryRow(item);
              })}
            </table>
          </Otherwise>
        </Choose>
        <If condition={this.props.quote.breakdown}>
          <div className="order-summary__description">
            <a
              onClick={() =>
                this.setState({
                  showBreakdown: !this.state.showBreakdown
                })}
            >
              <Choose>
                <When condition={this.state.showBreakdown}>Hide Breakdown</When>
                <Otherwise>Show Breakdown</Otherwise>
              </Choose>
            </a>
          </div>
        </If>
        <TotalsFooter
          totalLabel={this.props.totalLabel}
          total={this.total()}
        />
      </div>
    );
  }
}

OrderSummary.propTypes = {
  quote: PropTypes.object.isRequired,
  totalLabel: PropTypes.string
};

function TotalsFooter({ total, totalLabel }) {
  return (
    <div className="order-summary__totals">
      <table className="order-summary__rows">
        <tbody>
          <tr className="order-summary__total">
            <td className="order-summary__cell  order-summary__item-name">
              {totalLabel}
            </td>
            <td className="order-summary__cell  order-summary__item-cost">
              {Accounting.formatMoney(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

TotalsFooter.defaultProps = {
  totalLabel: 'Total'
};

TotalsFooter.propTypes = {
  totalLabel: PropTypes.string,
  total: PropTypes.number.isRequired
};

export default OrderSummary;
