import React     from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _         from 'lodash';

import { Card, Spinner } from '@transcriptic/amino';

import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import ContainerActions   from 'main/actions/ContainerActions';
import AliquotActions     from 'main/actions/AliquotActions';
import ContainerStore     from 'main/stores/ContainerStore';
import AliquotStore       from 'main/stores/AliquotStore';
import ProvisionSpecStore from 'main/stores/ProvisionSpecStore';
import ajax               from 'main/util/ajax';
import ImmutableUtil      from 'main/util/ImmutableUtil';
import JsonAPIIngestor    from 'main/api/JsonAPIIngestor';
import ResourceActions    from 'main/actions/ResourceActions';
import { hasInformaticsOfProvisionMixture } from 'main/util/InstructionUtil.js';
import ProvisionUtil      from './ProvisionUtil';

import HeaderRow from './HeaderRow';
import CardRow from './CardRow';
import './ProvisionCard.scss';

class ProvisionCard extends React.Component {
  static get propTypes() {
    return {
      instruction: PropTypes.instanceOf(Immutable.Map),
      provisionSpec: PropTypes.instanceOf(Immutable.Map),
      provisionSpecContainerIds: PropTypes.instanceOf(Immutable.Iterable),
      containersLoaded: PropTypes.bool,
      provisionSpecContainers: PropTypes.instanceOf(Immutable.Iterable),
      refsByName: PropTypes.instanceOf(Immutable.Map).isRequired, // refName -> ref
      provisionInstructions: PropTypes.instanceOf(Immutable.Iterable).isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      loaded: true
    };
    this.debounceFetch = _.debounce(this.fetch, 400).bind(this);
  }

  componentWillMount() {
    this.debounceFetch();
  }

  fetch() {
    this.loadContainers();
    this.loadResourcesOfProvisionMixtureInstructions();
  }

  loadResourcesOfProvisionMixtureInstructions() {
    const provisionMixtureInstructions = this.props.provisionInstructions.toJS()
      .filter(
        (instruction) => hasInformaticsOfProvisionMixture(instruction));

    const resourceIds = provisionMixtureInstructions.map(instruction => instruction.operation.resource_id);

    if (!_.isEmpty(resourceIds)) {
      ResourceActions.loadMany(resourceIds);
    }
  }

  loadContainers() {
    const ids = this.props.provisionSpecContainerIds;
    if (!ids || ids.isEmpty()) {
      return;
    }

    ContainerActions.loadManyContainers(ids.toJS())
      .done((container) => {
        if (!_.isEmpty(container.data)) {
          const { containers } = JsonAPIIngestor.ingest(container);
          const aliquots = containers.map(c =>
            AliquotActions.loadForContainer(c.id)
          );
          return ajax.when(...aliquots).done(() => this.setState({ loaded: true }));
        } else {
          this.setState({ loaded: false });
        }
      });
  }

  getMeasurementMode() {
    return this.props.instruction.getIn(['operation', 'measurement_mode'], 'volume');
  }

  chartData() {
    if (this.props.provisionSpec && this.props.containersLoaded) {
      return new ProvisionUtil({
        refsByName: this.props.refsByName.toJS(),
        sourceContainers: ImmutableUtil.indexBy(this.props.provisionSpecContainers, 'id').toJS(),
        provisionSpec: this.props.provisionSpec.toJS(),
        measurementMode: this.getMeasurementMode()
      }).charts;
    } else {
      return new ProvisionUtil({
        refsByName: this.props.refsByName.toJS(),
        instruction: this.props.instruction.toJS(),
        measurementMode: this.getMeasurementMode()
      }).charts;
    }
  }

  render() {
    const chartData = this.chartData();
    const lihaGraphWidth = this.rowNode ? this.rowNode.clientWidth / 2 : undefined;
    const nodeWidth = lihaGraphWidth / 4;

    return (
      <If condition={this.state.loaded}>
        <div className="provision-card">
          <HeaderRow
            instructionId={this.props.instruction.get('id')}
            complete={!!this.props.instruction.get('completed_at')}
          />
          <Card className="provision-card__card" status={this.props.provisionSpec ? 'positive' : 'neutral'}>
            <div
              className="provision-card__card-rows"
              ref={(node) => { this.rowNode = node; }}
            >
              <Choose>
                <When condition={this.props.provisionSpec && !this.props.containersLoaded}>
                  <Spinner />
                </When>
                <Otherwise>
                  {chartData.map((chartDatum, i) => {
                    let rowContainers = Immutable.List();
                    if (this.props.provisionSpecContainers) {
                      rowContainers = this.props.provisionSpecContainers.filter(container =>
                        Object.keys(chartDatum.sources).includes(container.get('id'))
                      );
                    }

                    return (
                      <CardRow
                        key={i}
                        chartData={chartDatum}
                        lihaGraphWidth={lihaGraphWidth}
                        nodeWidth={nodeWidth}
                        unprovisioned={!this.props.provisionSpec}
                        containers={rowContainers}
                        measurementMode={this.getMeasurementMode()}
                        instruction={this.props.instruction.toJS()}
                        provisionInstructions={this.props.provisionInstructions}
                      />
                    );
                  })}
                </Otherwise>
              </Choose>
            </div>
          </Card>
        </div>
      </If>
    );
  }
}

const setAliquotFields = (containerParam) => {
  const aliquots = AliquotStore.getByContainer(containerParam.get('id'));
  const volume_ul = aliquots.getIn([0, 'volume_ul']);
  const mass_mg = aliquots.getIn([0, 'mass_mg']);
  const aliquot_created_at = aliquots.getIn([0, 'created_at']);

  let container = containerParam.set('volume_ul', volume_ul);
  container = container.set('mass_mg', mass_mg);
  return container.set('aliquot_created_at', aliquot_created_at);
};

const getStateFromStores = ({ instruction }) => {
  const provisionSpec = ProvisionSpecStore.findByInstruction(instruction.get('id'));

  if (!provisionSpec) return {};

  const provisionSpecContainerIds = provisionSpec
    .get('transfers')
    .map(transfer => transfer.get('from'))
    .toSet() || Immutable.Set();

  const containers = ContainerStore.getByIds(provisionSpecContainerIds);
  // const containers = ['1', '2', '3'];
  const provisionSpecContainers = Immutable.List(containers.map(c => setAliquotFields(c)));
  const containersLoaded = provisionSpecContainers.count() &&
    provisionSpecContainers.getIn([0, 'aliquot_created_at']);

  return { provisionSpec, provisionSpecContainerIds, provisionSpecContainers, containersLoaded };
};

const ConnectedProvisionCard = ConnectToStoresHOC(ProvisionCard, getStateFromStores);

export default ConnectedProvisionCard;
