import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import Urls      from 'main/util/urls';

import { History, HistoryEvent } from 'main/components/history';
import { Loading }   from 'main/components/page';
import { Pagination } from '@transcriptic/amino';
import ContainerTypeHelper       from 'main/helpers/ContainerType';
import ImmutableUtil             from 'main/util/ImmutableUtil';

import AliquotAPI           from 'main/api/AliquotAPI';
import AliquotEffectAPI     from 'main/api/AliquotEffectAPI';
import ResourceAPI          from 'main/api/ResourceAPI';
import AliquotEffectStore   from 'main/stores/AliquotEffectStore';
import AliquotStore         from 'main/stores/AliquotStore';
import ContainerStore       from 'main/stores/ContainerStore';
import ContainerTypeStore   from 'main/stores/ContainerTypeStore';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import InstructionStore     from 'main/stores/InstructionStore';
import ResourceStore        from 'main/stores/ResourceStore';
import SessionStore         from 'main/stores/SessionStore';
import ConnectToStoresHOC   from 'main/containers/ConnectToStoresHOC';

const getQuantity = (props) => {
  if (props.event.effect_data.volume_ul) {
    return `${props.event.effect_data.volume_ul} µL`;
  }
  return `${props.event.effect_data.mass_mg} mg`;
};

// TODO Make root view
/* eslint-disable react/no-multi-comp */
class AliquotHistory extends React.Component {

  static get propTypes() {
    return {
      aliquot: PropTypes.instanceOf(Immutable.Map).isRequired,
      atEffectId: PropTypes.string
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      page: 1,
      pageCount: 1,
      pageSize: 10,
      aliquotEffectIds: undefined
    };
  }

  componentWillMount() {
    ContainerTypeActions.loadAll();
  }

  componentDidMount() {
    this.fetchAliquotHistory(this.props.aliquot)
      .done(() => this.setState({ loading: false }));
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.aliquot.get('id') !== this.props.aliquot.get('id')) {
      this.setState(
        { page: 1, pageCount: 1 },
        () => this.fetchAliquotHistory(this.props.aliquot)
      );
    } else if (prevState.page !== this.state.page) {
      this.fetchAliquotHistory(this.props.aliquot);
    }
  }

  fetchAliquotHistory(aq) {
    const request = {
      page: this.state.page,
      limit: this.state.pageSize,
      sortBy: ['-created_at'],
      includes: ['generating_instruction'],
      filters: {
        affected_container_id: aq.get('container_id'),
        affected_well_idx: aq.get('well_idx')
      }
    };

    // Fetch aliquot effects
    const promise = AliquotEffectAPI.index(request);

    // Set state
    promise.done((payload) => {
      const ids = payload.data.map(e => e.id);

      return this.setState({
        aliquotEffectIds: Immutable.fromJS(ids),
        pageCount: Math.ceil(payload.meta.record_count / this.state.pageSize)
      });
    });

    // Fetch resources
    promise.done(() => ResourceAPI.getMany(this.resourceIds()));

    // Fetch aliquots
    promise.done(() => {
      AliquotAPI.getManyByContainerAndIndex(
        this.relevantAliquots(),
        { includes: ['resource', 'container', 'container.container_type'] }
      );
    });

    return promise;
  }

  aliquotEffects() {
    return AliquotEffectStore.getByIds(this.state.aliquotEffectIds || Immutable.List());
  }

  resourceIds() {
    let ids = Immutable.Set();

    this.aliquotEffects().forEach((effect) => {
      const instruction = InstructionStore.getById(effect.get('generating_instruction_id'));
      const resourceId = instruction != undefined ? instruction.getIn(['operation', 'resource_id']) : undefined;

      if (resourceId) {
        ids = ids.add(resourceId);
      }
    });

    return ids.toJS();
  }

  // Either source of destination aliquots in a liquid in or out transfer.
  // Immutable List of [containerId, wellIndex] pairs.
  relevantAliquots() {
    let aliquots = this.aliquotEffects().map((effect) => {
      const effectType = effect.get('effect_type');
      const data       = effect.get('effect_data');

      switch (effectType) {
        case 'liquid_transfer_in':
        case 'solid_transfer_in':
          return [
            data.getIn(['source', 'container_id']),
            data.getIn(['source', 'well_idx'])
          ];
        case 'liquid_transfer_out':
        case 'solid_transfer_out':
          return [
            data.getIn(['destination', 'container_id']),
            data.getIn(['destination', 'well_idx'])
          ];
        default:
          return [];
      }
    });

    // remove null aliquots
    aliquots = aliquots.filter(a => a[0] != undefined && a[1] != undefined);

    // uniq based on containerId and wellIndex
    return ImmutableUtil.uniqBy(aliquots, a => `${a[0]}_${a[1]}`);
  }

  render() {
    if (this.state.loading) {
      return <Loading />;
    }

    const sortedEffects = this.aliquotEffects().sortBy(a => a.get('created_at')).reverse();

    /* eslint-disable max-len */
    const events = sortedEffects.toJS().map((e) => {
      return (
        <div key={e.id} className={this.props.atEffectId === e.id ? 'highlight' : undefined}>
          {(() => {
            switch (e.effect_type) {
              case 'solid_transfer_in':
              case 'liquid_transfer_in': {
                const containerId   = (e.effect_data.source != undefined) ? e.effect_data.source.container_id : undefined;
                const wellIdx       = (e.effect_data.source != undefined) ? e.effect_data.source.well_idx : undefined;
                const aliquot       = AliquotStore.getByContainerAndWellIdx(containerId, wellIdx);
                const container     = ContainerStore.getById(containerId);
                const containerType = ContainerTypeStore.getById(container != undefined ? container.get('container_type_id') : undefined);
                const resource      = ResourceStore.getById(aliquot != undefined ? aliquot.get('resource_id') : undefined);
                const instruction   = InstructionStore.getById(e.generating_instruction_id);

                return (
                  <TransferInEvent
                    event={e}
                    instruction={instruction ? instruction.toJS() : instruction}
                    sourceAliquot={aliquot != undefined ? aliquot.toJS() : undefined}
                    sourceContainer={container != undefined ? container.toJS() : undefined}
                    sourceContainerType={containerType != undefined ? containerType.toJS() : undefined}
                    sourceResource={resource != undefined ? resource.toJS() : undefined}
                  />
                );
              }
              case 'solid_transfer_out':
              case 'liquid_transfer_out': {
                const containerId   = e.effect_data.destination != undefined ? e.effect_data.destination.container_id : undefined;
                const wellIdx       = e.effect_data.destination != undefined ? e.effect_data.destination.well_idx : undefined;
                const aliquot       = AliquotStore.getByContainerAndWellIdx(containerId, wellIdx);
                const container     = ContainerStore.getById(containerId);
                const containerType = ContainerTypeStore.getById(container != undefined ? container.get('container_type_id') : undefined);
                const instruction   = InstructionStore.getById(e.generating_instruction_id);

                return (
                  <TransferOutEvent
                    event={e}
                    instruction={instruction ? instruction.toJS() : instruction}
                    destAliquot={aliquot != undefined ? aliquot.toJS() : undefined}
                    destContainer={container != undefined ? container.toJS() : undefined}
                    destContainerType={containerType != undefined ? containerType.toJS() : undefined}
                  />
                );
              }
              case 'instruction':
                return (
                  <GenericInstructionEvent
                    event={e}
                    instruction={InstructionStore.getById(e.generating_instruction_id).toJS()}
                  />
                );
              case 'liquid_sensing':
                return <LiquidSensingEvent event={e} />;
              case 'manual_adjustment':
                return <ManualAdjustmentEvent event={e} />;
              case 'measured_mass':
                return <MeasuredMassEvent event={e} />;
              default:
                return (
                  <HistoryEvent icon={<i className="fa fa-question" />}>
                    <div>
                      Unknown Event: <span className="monospace">{e.effect_type}</span>
                    </div><pre>{JSON.stringify(e.effect_data, undefined, 2)}</pre>
                    <EventMetadata event={e} />
                  </HistoryEvent>
                );
            }
          })()}
        </div>
      );
    });

    /* eslint-enable max-len */
    return (
      <div>
        <History>
          { events }
          <If condition={this.state.page >= this.state.pageCount}>
            <HistoryEvent icon={<i className="fa fa-asterisk" />}>
              <span style={{ color: 'lightgrey' }}>
                {`Created ${Moment(this.props.aliquot.get('created_at')).format('lll')}`}
              </span>
            </HistoryEvent>
          </If>
        </History>
        <If condition={this.state.pageCount > 1}>
          <Pagination
            page={this.state.page}
            pageWidth={10}
            numPages={this.state.pageCount}
            onPageChange={page => this.setState({ page })}
          />
        </If>
      </div>
    );
  }
}

class EventMetadata extends React.Component {
  static get propTypes() {
    return {
      event: PropTypes.object.isRequired
    };
  }

  render() {
    const e   = this.props.event;
    const run = (e.generating_instruction) ? e.generating_instruction.run : undefined;

    return (
      <div className="desc">
        <span title={Moment(e.created_at).format()}>
          { Moment(e.created_at).fromNow() }
        </span>
        <If condition={run}>
          <span>
            &nbsp;in&nbsp;
            <a href={Urls.deref(run.id)}>
              { run.title || run.id }
            </a>
          </span>
        </If>
      </div>
    );
  }
}

class TransferInEvent extends React.Component {

  static get propTypes() {
    return {
      event:               PropTypes.object.isRequired,
      instruction:         PropTypes.object,
      sourceAliquot:       PropTypes.object,
      sourceResource:      PropTypes.object,
      sourceContainer:     PropTypes.object,
      sourceContainerType: PropTypes.object
    };
  }

  pipetteName() {
    if (this.props.event.effect_data.volume_ul) {
      return 'Pipetted';
    }
    return 'Received';
  }

  renderAdminSourceContainerLink() {
    const sourceId            = this.props.sourceContainer.id;
    const sourceAdminUrl      = Urls.container(sourceId);
    const sourceLabel         = this.props.sourceContainer.label || sourceId;
    const sourceWellIdx       = this.props.sourceAliquot.well_idx;
    const sourceTypeId        = this.props.sourceContainer.container_type_id;
    const sourceContainerType = ContainerTypeStore.getById(sourceTypeId);
    if (!sourceContainerType) return undefined;

    const helper = new ContainerTypeHelper({
      col_count: sourceContainerType.get('col_count')
    });
    const humanSourceWell = helper.humanWell(sourceWellIdx);

    return (
      <span>
        <a href={sourceAdminUrl}>{sourceLabel}</a>
        <span> ({humanSourceWell})</span>
      </span>
    );
  }

  render() {
    const e    = this.props.event;
    const data = e.effect_data;

    let operation;
    if (this.props.instruction && this.props.instruction.operation) {
      operation = this.props.instruction.operation;
    } else {
      operation = { op: 'unknown' };
    }

    return (
      <HistoryEvent icon={<i className="fa fa-arrow-left" />}>
        <div>
          <Choose>
            <When condition={operation.op === 'dispense'}>
              Dispensed
            </When>
            <When condition={operation.op === 'stamp'}>
              Stamped
            </When>
            <When condition={operation.op === 'provision'}>
              Provisioned
            </When>
            <Otherwise>
              {this.pipetteName()}
            </Otherwise>
          </Choose>

          {` ${getQuantity(this.props)} `}

          {(() => {
            if (this.props.sourceAliquot && this.props.sourceContainer && this.props.sourceContainerType) {
              if (data.source && data.source.is_stock) {
                let sourceName;
                if (this.props.sourceResource) {
                  sourceName = this.props.sourceResource.name || '(none)';
                }

                return (
                  <span>
                    <span>{` of ${sourceName} `}</span>
                    <If condition={this.props.sourceAliquot.lot_no != undefined}>
                      <span style={{ color: 'lightgrey' }}>
                        {` (LOT# ${this.props.sourceAliquot.lot_no}) `}
                      </span>
                    </If>
                    <If condition={SessionStore.isAdmin()}>
                      <span> {this.renderAdminSourceContainerLink()} </span>
                    </If>
                  </span>
                );
              } else {
                return (
                  <span>
                    from&nbsp;
                    <AliquotLink
                      aliquot={Immutable.fromJS(this.props.sourceAliquot)}
                      container={Immutable.fromJS(this.props.sourceContainer)}
                      containerType={Immutable.fromJS(this.props.sourceContainerType)}
                      atEffect={data.source.at_effect_id}
                    />
                  </span>
                );
              }
            } else if (operation.resource_id != undefined || operation.reagent != undefined) {
              const resource     = ResourceStore.getById(operation.resource_id);
              const resourceName = resource ? (resource.get('name') || operation.resource_id) : operation.resource_id;

              return (
                <span>
                  of&nbsp;
                  <span className="monospace">{resourceName || operation.reagent}</span>
                </span>
              );
            } else {
              return undefined;
            }
          })()}
        </div>
        <EventMetadata event={e} />
      </HistoryEvent>
    );
  }
}

class TransferOutEvent extends React.Component {

  static get propTypes() {
    return {
      event: PropTypes.object.isRequired,
      instruction: PropTypes.object,
      destAliquot: PropTypes.object,
      destContainer: PropTypes.object,
      destContainerType: PropTypes.object
    };
  }

  pipetteMessage(operation) {
    if (this.props.event.effect_data.volume_ul) {
      return `Pipetted ${getQuantity(this.props)} out for ${operation.op}`;
    }
    return operation.op === 'pipette' ?
      `Transferred ${getQuantity(this.props)} out` : `Transferred ${getQuantity(this.props)} out for ${operation.op}`;
  }

  pipetteName() {
    if (this.props.event.effect_data.volume_ul) {
      return 'Pipetted';
    }
    return 'Transferred';
  }

  render() {
    let operation;

    if (this.props.instruction && this.props.instruction.operation) {
      operation = this.props.instruction.operation;
    } else {
      operation = { op: 'unknown' };
    }

    return (
      <HistoryEvent icon={<i className="fa fa-arrow-right" />}>
        <div>
          <Choose>
            <When condition={this.props.destAliquot && this.props.destContainer && this.props.destContainerType}>
              <Choose>
                <When condition={operation.op === 'dispense'}>
                  {[
                    <span key="dispense_dest_heading">{`Dispensed ${getQuantity(this.props)} to `}</span>,
                    <AliquotLink
                      key="aliquot_link"
                      aliquot={Immutable.fromJS(this.props.destAliquot)}
                      container={Immutable.fromJS(this.props.destContainer)}
                      containerType={Immutable.fromJS(this.props.destContainerType)}
                    />
                  ]}
                </When>
                <Otherwise>
                  {[
                    <span key="pipette_dest_heading">{`${this.pipetteName()} ${getQuantity(this.props)} to `}</span>,
                    <AliquotLink
                      key="aliquot_link"
                      aliquot={Immutable.fromJS(this.props.destAliquot)}
                      container={Immutable.fromJS(this.props.destContainer)}
                      containerType={Immutable.fromJS(this.props.destContainerType)}
                    />
                  ]}
                </Otherwise>
              </Choose>
            </When>
            <When condition={operation.op === 'spin' && operation.flow_direction === 'outward'}>
              {`Discarded ${getQuantity(this.props)} by outward spin operation`}
            </When>
            <Otherwise>
              {this.pipetteMessage(operation)}
            </Otherwise>
          </Choose>
        </div>
        <EventMetadata event={this.props.event} />
      </HistoryEvent>
    );
  }
}

class GenericInstructionEvent extends React.Component {

  static get propTypes() {
    return {
      event: PropTypes.object.isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const e = this.props.event;

    let operation;

    if (this.props.instruction && this.props.instruction.operation) {
      operation = this.props.instruction.operation;
    } else {
      operation = { op: 'unknown' };
    }

    return (
      <HistoryEvent icon={<i className="fa fa-cog" />}>
        { (() => {
          switch (operation.op) {
            case 'incubate':
              return <div>{ `Incubated at ${operation.where} for ${operation.duration}` }</div>;
            case 'seal':
              return <div>Sealed</div>;
            case 'unseal':
              return <div>Unsealed</div>;
            case 'cover':
              return <div>Covered</div>;
            default:
              return <div><span className="monospace">{ operation.op }</span> instruction</div>;
          }
        })() }
        <EventMetadata event={e} />
      </HistoryEvent>
    );
  }
}

class LiquidSensingEvent extends React.Component {

  static get propTypes() {
    return {
      event: PropTypes.object.isRequired
    };
  }

  render() {
    const { effect_data } = this.props.event;

    return (
      <HistoryEvent icon={<i className="fa fa-eyedropper" />}>
        { (() => {
          if (effect_data.adjusted_volume_ul != undefined) {
            return (
              <div>
                {`Sensed and adjusted volume to ${effect_data.calibrated_volume_ul.toFixed(2)} µL`}
              </div>
            );
          } else {
            return (
              <div>
                {`Sensed volume as ${effect_data.calibrated_volume_ul.toFixed(2)} µL`}
              </div>
            );
          }
        })() }
        <EventMetadata event={this.props.event} />
      </HistoryEvent>
    );
  }
}

class MeasuredMassEvent extends React.Component {

  static get propTypes() {
    return {
      event: PropTypes.object.isRequired
    };
  }

  render() {
    const { effect_data } = this.props.event;

    return (
      <HistoryEvent icon={<i className="fa fa-cog" />}>
        <div>
          {`Updated aliquot mass to ${effect_data.mass_mg} mg`}
        </div>
        <EventMetadata event={this.props.event} />
      </HistoryEvent>
    );
  }
}

class ManualAdjustmentEvent extends React.Component {

  static get propTypes() {
    return {
      event: PropTypes.shape({
        id:                        PropTypes.string.isRequired,
        affected_container_id:     PropTypes.string.isRequired,
        affected_well_idx:         PropTypes.number.isRequired,
        created_at:                PropTypes.string.isRequired,
        effect_type:               PropTypes.string.isRequired,
        generating_instruction_id: PropTypes.string,
        updated_at:                PropTypes.string.isRequired,
        effect_data:               PropTypes.object.isRequired
      }).isRequired
    };
  }

  getAdjustedQuantityMessage(effect) {
    if (effect.adjusted_mass_mg) {
      return `Manually adjusted mass to ${effect.adjusted_mass_mg} mg`;
    }
    return `Manually adjusted volume to ${effect.adjusted_volume_ul} µL`;
  }

  render() {
    const { effect_data } = this.props.event;

    return (
      <HistoryEvent icon={<i className="fa fa-user" />}>
        <div>
          {this.getAdjustedQuantityMessage(effect_data)}
        </div>
        <EventMetadata event={this.props.event} />
      </HistoryEvent>
    );
  }
}

class AliquotLink extends React.Component {

  static get propTypes() {
    return {
      aliquot: PropTypes.instanceOf(Immutable.Map).isRequired,
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
      atEffect: PropTypes.string
    };
  }

  url(containerId, wellRef) {
    const query = (this.props.atEffect) ? `?at_effect=${encodeURIComponent(this.props.atEffect)}` : '';

    if (Urls.org != undefined) {
      return Urls.aliquot(containerId, wellRef) + query;
    } else {
      return `/containers/${containerId}/${wellRef}${query}`;
    }
  }

  render() {
    const { container, aliquot, containerType } = this.props;

    const name          = aliquot.get('name');
    const containerName = container.get('label') || container.get('id');
    const ctypeHelper   = new ContainerTypeHelper({ col_count: containerType.get('col_count') });
    const wellRef       = ctypeHelper.humanWell(aliquot.get('well_idx'));

    const desc = `${containerName} / ${wellRef}`;
    const url  = this.url(this.props.aliquot.get('container_id'), wellRef);

    return (
      <span>
        <a href={url}>
          {`${name || desc}`}
        </a>
        <If condition={name}>
          <span style={{ color: 'lightgrey' }}>
            {` (${desc})`}
          </span>
        </If>
      </span>
    );
  }
}

export default ConnectToStoresHOC(AliquotHistory, () => {});
