import React     from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { Link }  from 'react-router-dom';

import { Unit, Utilities, Button } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import { LiHaChartShape } from 'main/proptypes';
import LiHaGraph          from 'main/components/LiHaGraph';
import LocationPath       from 'main/components/LocationPath';

import { getQuantity, getQuantityInDefaultUnits } from 'main/util/MeasurementUtil';
import LocationStore from 'main/stores/LocationStore';
import './ProvisionCardSpacing.scss';
import MixtureStore from 'main/stores/MixtureStore';
import MixtureActions from 'main/actions/MixtureActions';
import ModalActions from 'main/actions/ModalActions';
import { hasInformaticsOfProvisionMixture } from 'main/util/InstructionUtil.js';
import MixtureModal from './MixtureModal';

const { ManualLiHaDisplayScale } = Utilities.Units;

class CardRow extends React.Component {

  static get propTypes() {
    return {
      unprovisioned: PropTypes.bool,
      chartData: LiHaChartShape,
      lihaGraphWidth: PropTypes.number,
      nodeWidth: PropTypes.number,
      containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      measurementMode: PropTypes.oneOf(['volume', 'mass']),
      instruction: PropTypes.instanceOf(Immutable.Map),
      provisionInstructions: PropTypes.instanceOf(Immutable.Iterable).isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.getMixtureInfo = this.getMixtureInfo.bind(this);
  }

  componentDidMount() {
    if (hasInformaticsOfProvisionMixture(this.props.instruction)) {
      MixtureActions.getMixtureById(this.props.instruction.operation.informatics[0].data.mixture_id);
    }
  }

  getMixtureInfo() {
    if (hasInformaticsOfProvisionMixture(this.props.instruction)) {
      const mixture = MixtureStore.getById(this.props.instruction.operation.informatics[0].data.mixture_id);
      if (mixture) {
        return {
          mixtureId: this.props.instruction.operation.informatics[0].data.mixture_id,
          mixtureName: mixture.get('label')
        };
      }
    }
    return {
      mixtureId: undefined,
      mixtureName: undefined
    };
  }

  renderLocation() {
    const fallback = (
      <p className="tx-type--secondary">
        {this.props.unprovisioned ? 'No provision spec generated' : 'Unknown Location...'}
      </p>
    );
    if (!this.props.containers.count()) return fallback;

    return this.props.containers.map((container) => {
      return (
        <span className="provision-card__sub-row" key={container.get('id')}>
          <Choose>
            <When condition={LocationStore.getById(container.get('location_id'))}>
              <LocationPath
                location={LocationStore.getById(container.get('location_id'))}
                containerId={container.get('id')}
                position={container.getIn(['slot', 'row'])}
                withLinks
              />
            </When>
            <Otherwise>
              {fallback}
            </Otherwise>
          </Choose>
        </span>
      );
    });
  }

  renderBarcode() {
    const fallback = <p>- -</p>;
    if (!this.props.containers.count()) return fallback;

    return this.props.containers.map((container) => {
      return (
        <span className="provision-card__sub-row" key={container.get('id')}>
          <Choose>
            <When condition={container.get('barcode')}>
              <Link to={Urls.container_location(container.get('id'))}>
                <p className="provision-card__link">{container.get('barcode')}</p>
              </Link>
            </When>
            <Otherwise>
              {fallback}
            </Otherwise>
          </Choose>
        </span>
      );
    });
  }

  renderAvailable() {
    const fallback = <p>- -</p>;
    if (!this.props.containers.count()) return fallback;

    return this.props.containers.map((container) => {
      return (
        <span className="provision-card__sub-row" key={container.get('id')}>
          <Choose>
            <When condition={getQuantity(container, this.props.measurementMode)}>
              <Unit
                value={getQuantityInDefaultUnits(container, this.props.measurementMode)}
                shortUnits
                convertForDisplay
                scale={ManualLiHaDisplayScale}
              />
            </When>
            <Otherwise>
              {fallback}
            </Otherwise>
          </Choose>
        </span>
      );
    });
  }

  renderContainerTypeId() {
    const fallback = <p>- -</p>;
    if (!this.props.containers.count()) return fallback;

    return this.props.containers.map((container) => (
      <span className="provision-card__sub-row" key={container.get('id')}>
        { container.get('container_type_id')
          ? <p>{container.get('container_type_id')}</p>
          : fallback
        }
      </span>
    ));
  }

  renderContainerId() {
    const fallback = <p>- -</p>;
    if (!this.props.containers.count()) return fallback;

    return this.props.containers.map((container) => (
      <span className="provision-card__sub-row" key={container.get('id')}>
        { container.get('id') ? (
          <Link to={Urls.container(container.get('id'))}>
            <p className="provision-card__link">{container.get('id')}</p>
          </Link>
        )
          : fallback
        }
      </span>
    ));
  }

  render() {
    const { mixtureId, mixtureName } = this.getMixtureInfo();
    return (
      <div className="card-table-spacing provision-card__card-row">
        <span className="card-table-spacing__location card-table-spacing__column">
          {this.renderLocation()}
        </span>
        <span className="card-table-spacing__barcode card-table-spacing__column">
          {this.renderBarcode()}
        </span>
        <span className="card-table-spacing__container-id card-table-spacing__column">
          {this.renderContainerId()}
        </span>
        <span className="card-table-spacing__container-type-id card-table-spacing__column">
          {this.renderContainerTypeId()}
        </span>
        <span className="card-table-spacing__available card-table-spacing__column">
          {this.renderAvailable()}
        </span>
        <span className="card-table-spacing__chart card-table-spacing__column">
          <LiHaGraph
            data={this.props.chartData}
            width={this.props.lihaGraphWidth}
            sourceNodeWidth={this.props.nodeWidth}
            destNodeWidth={this.props.nodeWidth}
            measurementMode={this.props.measurementMode}
          />
        </span>
        <span className="card-table-spacing__mixture card-table-spacing__column card-table-spacing__mixture-content">
          <span className="provision-card__sub-row">
            <Button
              link
              onClick={() => ModalActions.open(this.props.instruction.id)}
            >{mixtureName}
            </Button>
          </span>
        </span>
        {mixtureName && (
        <MixtureModal
          modalId={this.props.instruction.id}
          provisionInstructions={this.props.provisionInstructions}
          mixtureName={mixtureName}
          mixtureId={mixtureId}
        />
        ) }
      </div>
    );
  }
}

export default CardRow;
