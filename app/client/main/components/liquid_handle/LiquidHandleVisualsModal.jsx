import Classnames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import { toScalar } from 'main/util/unit';
import { WellTag } from 'main/components/InstructionTags/index';
import { FullscreenModal } from 'main/components/Modal';
import { Tooltip } from '@transcriptic/amino';

class LiquidHandleVisualsModal extends React.Component {
  convertVolumeToNumber(volume) {
    return toScalar(
      volume || '0:microliter',
      'microliter'
    );
  }

  transportPosition(currentTipVolume, transportVolume) {
    if (transportVolume >= 0) {
      return -currentTipVolume;
    } else {
      return transportVolume - currentTipVolume;
    }
  }

  maxTipVolume() {
    let maxTipVolume = 0;
    let currentTipVolume = 0;

    this.props.instruction.operation.locations.forEach((location) => {
      if (location.transports) {
        location.transports.forEach((transport) => {
          const liquidClass =
            transport.mode_params
              ? transport.mode_params.liquid_class
              : undefined;
          if (liquidClass !== 'air') {
            currentTipVolume += this.convertVolumeToNumber(transport.volume);
          }
          // aspirates are negative values
          if (currentTipVolume < maxTipVolume) {
            maxTipVolume = currentTipVolume;
          }
        });
      }
    });

    return -maxTipVolume;
  } // aspirates are negative values

  containsNonZeroTransport(transports) {
    const nonZeroTranportIndex = transports.findIndex((transport) => {
      return this.convertVolumeToNumber(transport.volume) !== 0;
    });

    return nonZeroTranportIndex !== -1;
  }

  render() {
    const { locations } = this.props.instruction.operation;
    let currentTipVolume = 0;

    return (
      <FullscreenModal
        modalId={`LIQUID_HANDLE_VISUALS_MODAL_${this.props.instruction.id}`}
        title="Liquid Handle Visuals"
      >
        <div className="liha-visuals-pane">
          <div className="volume-labels">
            <div className="volume-label-max">{`${this.maxTipVolume()}\u00B5L`}</div>
            <div className="volume-label-zero">
              {'0µL'}
            </div>
          </div>
          {locations.map((location, i) => {
            if (!location.transports) {
              return undefined;
            }
            if (!this.containsNonZeroTransport(location.transports)) {
              return false;
            }
            if (!location.location) {
              return undefined;
            }

            return (
              <div
                className="liha-location"
                key={`location${i}`} // eslint-disable-line react/no-array-index-key
              >
                {location.transports.map((transport, j) => {
                  const liquidClass =
                    transport.mode_params
                      ? transport.mode_params.liquid_class
                      : undefined;
                  const transportVolume = this.convertVolumeToNumber(
                    transport.volume
                  );

                  if (transportVolume !== 0) {
                    if (liquidClass !== 'air') {
                      currentTipVolume += transportVolume;
                    }

                    return (
                      <LihaTransport
                        key={`location${i}transport${j}`} // eslint-disable-line react/no-array-index-key
                        id={`location${i}transport${j}`}
                        transportVolume={transportVolume}
                        transportPosition={this.transportPosition(
                          currentTipVolume,
                          transportVolume
                        )}
                        scaleRatio={Math.max(
                          Math.abs(this.maxTipVolume()) / 300,
                          1
                        )}
                        liquidClass={liquidClass}
                      />
                    );
                  }

                  return undefined;
                })}
                <WellTag refName={location.location} run={this.props.run} />
              </div>
            );
          })}
          <Legend
            colorMap={{
              air: 'lightblue',
              liquid: 'black'
            }}
          />
        </div>
      </FullscreenModal>
    );
  }
}

LiquidHandleVisualsModal.propTypes = {
  run: PropTypes.object.isRequired,
  instruction: PropTypes.object.isRequired
};

function Legend({ colorMap }) {
  return (
    <div className="legend">
      {
        Object.keys(colorMap).map((name) => {
          const color = colorMap[name];
          return (
            <div className="legend-unit" key={name}>
              <div
                className="color"
                style={{
                  backgroundColor: color
                }}
              />
              <span>{` ${name}`}</span>
            </div>
          );
        })
      }
    </div>
  );
}

Legend.propTypes = {
  colorMap: PropTypes.object.isRequired
};

function LihaTransport({ transportVolume, transportPosition, scaleRatio, liquidClass }) {
  const roundedTransportVolume = Number(transportVolume).toFixed(
    2
  );

  const renderTransportArrow = () => {
    if (transportVolume < 0) {
      return (
        <div
          className={Classnames({
            air: liquidClass === 'air',
            arrow: true,
            'arrow-up': true
          })}
        />
      );
    } else if (transportVolume > 0) {
      return (
        <div
          className={Classnames({
            air: liquidClass === 'air',
            arrow: true,
            'arrow-down': true
          })}
        />
      );
    }

    return <div />;
  };

  return (
    <div className="transport-wrapper">
      <Tooltip placement="top" title={`${roundedTransportVolume}\u00B5L`}>
        <a
          className={Classnames({
            air: liquidClass === 'air',
            transport: true
          })}
          style={{
            height: `${Math.abs(
              transportVolume / scaleRatio
            )}px`,
            marginBottom: `${transportPosition /
              scaleRatio}px`
          }}
        >
          {renderTransportArrow()}
        </a>
      </Tooltip>
    </div>
  );
}

LihaTransport.propTypes = {
  transportVolume: PropTypes.number.isRequired,
  transportPosition: PropTypes.number.isRequired,
  scaleRatio: PropTypes.number.isRequired,
  liquidClass: PropTypes.string
};

export default LiquidHandleVisualsModal;
