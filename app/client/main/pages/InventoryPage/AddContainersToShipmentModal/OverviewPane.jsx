import classNames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Divider, StatusPill } from '@transcriptic/amino';

import ShippingCartActions                     from 'main/actions/ShippingCartActions';
import { MultiStepModalPane, clonedPropNames } from 'main/components/Modal';

import SortableContainerTable from './SortableContainerTable';

import './OverviewPane.scss';

class OverviewPane extends React.Component {
  static get propTypes() {
    return {
      validContainers:  PropTypes.oneOfType([PropTypes.arrayOf(Immutable.Map), PropTypes.instanceOf(Immutable.List)]).isRequired,
      invalidContainers: PropTypes.oneOfType([PropTypes.arrayOf(Immutable.Map), PropTypes.instanceOf(Immutable.List)]).isRequired,
      dataReady:         PropTypes.bool.isRequired,

      // containerId -> errorString
      alertTexts: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onAddToShipment = this.onAddToShipment.bind(this);
  }

  onAddToShipment(onNavigateNext) {
    ShippingCartActions.addAll(this.props.validContainers);
    onNavigateNext();
  }

  render() {
    const { validContainers, invalidContainers, dataReady } = this.props;

    return (
      <MultiStepModalPane
        key="overview"
        btnClass="btn-md"
        nextBtnName="Add Valid Containers"
        nextBtnDisabled={validContainers.length === 0}
        nextBtnDisabledText="No Shippable Containers"
        showBackButton={false}
        showNextButton={dataReady && validContainers.length > 0}
        waitingOnResponse={!dataReady}
        beforeNavigateNext={this.onAddToShipment}
        classNames={{ 'add-containers-to-shipment-modal-overview': true }}
        {..._.pick(this.props, clonedPropNames)}
      >
        {!dataReady ? (
          <div className="tx-inline overview-header">
            <i className={classNames('fa', 'fa-circle-notch', 'fa-spin', 'tx-inline__item--xxs')} />
            <h2 className="title tx-type--secondary tx-type--heavy">
              Validating Shipment Request
            </h2>
          </div>
        ) : (
          <div className="tx-stack">

            {/* Overview */}
            <div className="tx-stack__block--xxlg overview-header">
              <h2 className="title">
                {`${validContainers.length + invalidContainers.length}
                    containers have been reviewed for shipping eligibilty`}
              </h2>
            </div>

            {/* Valid containers */}
            {!_.isEmpty(validContainers) && (
            <React.Fragment>
              <Divider size="small">
                <StatusPill type="success" text="Valid" icon="fa-check" />
              </Divider>
              <SortableContainerTable containers={validContainers} />
            </React.Fragment>
            )}

            {/* Invalid containers */}
            {!_.isEmpty(invalidContainers) && (
            <React.Fragment>
              <Divider size="small">
                <StatusPill type="danger" text="Invalid" icon="fa-exclamation" />
              </Divider>
              <SortableContainerTable
                containers={invalidContainers}
                alertTexts={this.props.alertTexts}
              />
            </React.Fragment>
            )}
          </div>
        )}
      </MultiStepModalPane>
    );
  }
}

export default OverviewPane;
