import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import Accounting                    from 'accounting';
import RunActions                    from 'main/actions/RunActions';
import { TabLayout }                 from 'main/components/TabLayout';
import ConnectToStores               from 'main/containers/ConnectToStoresHOC';
import assembleFullJSON              from 'main/helpers/RunPage/assembleFullJSON';
import loadStatus, { runIsFullJSON } from 'main/helpers/RunPage/loadStatus';
import RunStore                      from 'main/stores/RunStore';

import { PageLoading, Card, ZeroState } from '@transcriptic/amino';

class QuoteView extends React.Component {
  constructor() {
    super();

    this.state = {
      statusCode: undefined
    };
  }

  componentWillMount() {
    const { run, match } = this.props;
    const { runId } = match.params;
    const { projectId } = this.props;
    const { runLoaded } = loadStatus(run);
    if (!runLoaded) {
      this.fetchAndSaveData({ shouldFetchRun: !runLoaded });
    }

    if (!runLoaded || !run.get('quote')) {
      RunActions.loadQuote(projectId, runId);
    }
  }

  onStatusCodeChange(newStatusCode) {
    this.setState({ statusCode: newStatusCode });
  }

  fetchAndSaveData({ shouldFetchRun }) {
    if (shouldFetchRun) this.fetchRun();
  }

  fetchRun() {
    const { runId } = this.props.match.params;
    const { projectId } = this.props;
    return RunActions.loadMinimal(projectId, runId)
      .fail(err => this.onStatusCodeChange(err.status));
  }

  renderNoQuotesAvailable() {
    return <ZeroState  title="No quote available" />;
  }

  renderTotalCost(lineItems) {
    const net = lineItems.reduce((acc, lineItem) => acc + lineItem.total_cost, 0);
    return (
      <div className="row summary-row">
        <div className="col-xs-8" />
        <div className="col-xs-4">
          <div className="price-notices">
            <div className="total-price">
              {'Total: '}
              <span className="dollars">
                {Accounting.formatMoney(net)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderLineItems(lineItems) {
    return (
      <div className="col-md-12">
        {lineItems.map(item => (
          <div className="row quote-line-item" key={item.title}>
            <div className="col-xs-8">
              <h3>{item.title}</h3>
              <p>
                <If condition={item.components != undefined}>
                  {item.components.join(', ')}
                </If>
              </p>
            </div>
            <div className="col-xs-4 price">
              <div>
                <span>
                  {Accounting.formatMoney(item.total_cost)}
                </span>
              </div>
              <small>
                {
                  `${item.quantity} × ${Accounting.formatMoney(item.cost_each)} each`
                }
              </small>
            </div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { run, lineItems } = this.props;
    const { runLoaded } = loadStatus(run);

    if (!runLoaded || !run.get('quote')) {
      return <PageLoading />;
    }

    if (!lineItems && !run.get('has_quote?')) {
      return this.renderNoQuotesAvailable();
    }

    return (
      <TabLayout>
        <Card>
          <div className="run-quote">
            <div className="row quote-data">
              { this.renderLineItems(lineItems) }
              { this.renderTotalCost(lineItems) }
            </div>
          </div>
        </Card>
      </TabLayout>
    );
  }
}

QuoteView.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map),
  lineItems: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      components: PropTypes.arrayOf(PropTypes.string),
      quantity: PropTypes.number.isRequired,
      cost_each: PropTypes.number.isRequired,
      total_cost: PropTypes.number.isRequired
    })
  ),
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string,
      runId: PropTypes.string
    })
  })
};

const getDataFromStores = (props) => {
  const { runId } = props.match.params;
  const run = RunStore.getById(runId);
  const projectId = props.match.params.projectId || (run && run.get('project_id'));

  let fullJSON;

  if (runIsFullJSON(run)) {
    fullJSON = run;
  } else {
    fullJSON = assembleFullJSON({ run });
  }

  let lineItems;

  if (fullJSON && fullJSON.get('has_quote?') && fullJSON.get('quote')) {
    lineItems = fullJSON.getIn(['quote', 'items']).map((item) => {
      const cost_each = parseFloat(item.get('cost')) || 0;
      const total_cost = cost_each * parseInt(item.get('quantity'), 10) || 0;

      return item.set('cost_each', cost_each).set('total_cost', total_cost);
    });
    lineItems = lineItems.toJS();
  }

  return { run: fullJSON, lineItems, projectId };
};

const ConnectedQuoteView = ConnectToStores(QuoteView, getDataFromStores);

ConnectedQuoteView.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.string,
      runId: PropTypes.string
    })
  })
};

export default ConnectedQuoteView;
