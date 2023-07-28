import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Card, Section, Button } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import InteractivePlate from 'main/components/InteractivePlate';
import ContainerDetails from 'main/inventory/inventory/ContainerDetails';
import RunInstructions from 'main/components/RunInstructions';
import ContainerStore from 'main/stores/ContainerStore';
import InboundShipmentSuccessModal from 'main/pages/ShipmentsPage/components/InboundShipmentSuccessModal';
import ModalActions from 'main/actions/ModalActions';
import ShipmentActions from 'main/actions/ShipmentActions';

import './RunRef.scss';

class RunRef extends React.Component {
  static get contextTypes() {
    return { router: PropTypes.object };
  }

  constructor() {
    super();
    this.onNavigateDataref = this.onNavigateDataref.bind(this);
    this.onNavigateRef = this.onNavigateRef.bind(this);
  }

  getChildContext() {
    return {
      onNavigateRef: this.onNavigateRef,
      onNavigateDataref: this.onNavigateDataref
    };
  }

  onNavigateRef(refName) {
    const runId = this.props.run.get('id');
    const projectId = this.props.run.getIn(['project', 'id']);
    const { runView, runStatus } = this.props;

    this.context.router.history.push(runView ? Urls.runspage_ref(runId, refName, runView, runStatus)
      : Urls.run_ref(projectId, runId, refName));
  }

  onNavigateDataref(dataRef) {
    const runId = this.props.run.get('id');
    const projectId = this.props.run.getIn(['project', 'id']);
    const { runView, runStatus } = this.props;

    this.context.router.history.push(runView ? Urls.runspage_datum(runId, dataRef, runView, runStatus)
      : Urls.run_datum(projectId, runId, dataRef));
  }

  onNavigateToContainer(containerId) {
    this.context.router.history.push(Urls.container(containerId));
  }

  viewShipment(shipmentId, modalId) {
    ShipmentActions.loadContainers(shipmentId)
      .done(() =>
        ModalActions.open(modalId));
  }

  render() {
    const { shipment } = this.props;
    const isLoading = !this.props.aliquots.count() && this.props.fetchingContainer;
    const shipmentId = shipment && shipment.get('id');
    const MODAL_ID = `${InboundShipmentSuccessModal.MODAL_ID}_${shipmentId}`;
    return (
      <div className="run-ref-details">
        <If
          condition={
            this.props.shipment &&
            (this.props.container != undefined
              ? this.props.container.get('status')
              : undefined) === 'inbound'
          }
        >
          <div className="alert alert-warning">
            <strong>Waiting on shipment: </strong>
            <Button
              type="primary"
              link
              onClick={() => this.viewShipment(shipmentId, MODAL_ID)}
            >
              View Shipment
            </Button>
            <InboundShipmentSuccessModal
              modalId={MODAL_ID}
              closeOnClickOut={false}
              shipment={shipment}
              onNavigateToContainer={this.onNavigateToContainer}
              containers={ContainerStore.getAllByShipment(shipmentId)}
            />
          </div>
        </If>
        <Card>
          <div className="run-ref-details__card-content row">
            <If condition={this.props.aliquots}>
              <div className="run-ref-details__plate col-xs-12 col-md-8">
                <Section title="Container Contents">
                  <InteractivePlate
                    containerType={this.props.containerType}
                    aliquots={this.props.aliquots}
                    loading={isLoading}
                  />
                </Section>
              </div>
            </If>
            <If condition={!isLoading}>
              <div className="run-ref-details__container-details col-xs-12 col-md-4">
                <Section title="Container Details">
                  <ContainerDetails
                    container={this.props.container}
                    resource={this.props.resource}
                    runRef={this.props.runRef}
                    containerType={this.props.containerType}
                    runView={this.props.runView}
                  />
                </Section>
              </div>
            </If>
          </div>
        </Card>
        <If condition={this.props.showAppearsIn}>
          <Section title="Appears In">
            <div className="run-ref-details__instructions tx-stack__block tx-stack__block--xxs">
              <RunInstructions
                run={this.props.run}
                filterByRef={this.props.runRef.get('name')}
              />
            </div>
          </Section>
        </If>
      </div>
    );
  }
}

RunRef.childContextTypes = {
  onNavigateRef: PropTypes.func,
  onNavigateDataref: PropTypes.func
};

RunRef.defaultProps = {
  showAppearsIn: true
};

RunRef.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  runRef: PropTypes.instanceOf(Immutable.Map).isRequired,
  container: PropTypes.instanceOf(Immutable.Map),
  containerType: PropTypes.instanceOf(Immutable.Map),
  shipment: PropTypes.instanceOf(Immutable.Map),
  aliquots: PropTypes.instanceOf(Immutable.List),
  resource: PropTypes.instanceOf(Immutable.Map),
  showAppearsIn: PropTypes.bool,
  fetchingContainer: PropTypes.bool,
  runView: PropTypes.string,
  runStatus: PropTypes.string
};

export default RunRef;
