import React from 'react';
import Immutable from 'immutable';
import Chroma from 'chroma-js';
import PropTypes from 'prop-types';
import _ from 'lodash';
import memoize from 'memoize-one';

import {
  Button,
  Plate,
  Tube,
  Legend,
  TextInput,
  Toggle,
  LabeledInput,
  InputsController,
  Styles,
  ImmutablePureComponent,
  Spinner
} from '@transcriptic/amino';

import ContainerTypeHelper from 'main/helpers/ContainerType';

import PlateViewTypeToggle from './PlateViewTypeToggle';

import './InteractivePlate.scss';

function PlateRangeOverride(props) {
  return (
    <InputsController
      defaultState={props.defaultState}
      inputChangeCallback={props.inputChangeCallback}
    >
      <div className="interactive-plate__scale-override">
        <div className="interactive-plate__override-toggle">
          <LabeledInput label="Override Scale">
            <Toggle name="plate-reader-allow-override" />
          </LabeledInput>
        </div>
        <If condition={props.showOverrideUI}>
          <div className="interactive-plate__override-inputs">
            <LabeledInput label="Minimum" tip="The colorscale will start at this new lower bound.">
              <TextInput type="number" name="plate-reader-min-override" />
            </LabeledInput>
            <LabeledInput label="Maximum" tip="The colorscald will end at this new upper bound.">
              <TextInput type="number" name="plate-reader-max-override" />
            </LabeledInput>
            <Button
              type="primary"
              size="small"
              height="short"
              disabled={isNaN(parseFloat(props.minOverride)) && isNaN(parseFloat(props.maxOverride))}
              onClick={props.onConfirmOverride}
            >Override
            </Button>
          </div>
        </If>
      </div>
    </InputsController>
  );
}

PlateRangeOverride.propTypes = {
  defaultState: PropTypes.instanceOf(Object),
  inputChangeCallback: PropTypes.func,
  showOverrideUI: PropTypes.bool,
  minOverride: PropTypes.string,
  maxOverride: PropTypes.string,
  onConfirmOverride: PropTypes.func
};

// A wrapper for the plate component that provides a tool tip display when hovering
// over a well.
//
// By default, the tooltip will use the human well index as the title (i.e. 'B3')
// and the aliquot volume as the data. This can be customized by passing getTitle
// and getData functions, which will be called with the well index.
class InteractivePlate extends ImmutablePureComponent {

  static formatData(data) {
    // The plus sign drops any "extra" zeroes at the end. i.e 1.500 -> 1.5
    return (+parseFloat(data).toFixed(3)).toString();
  }

  static get propTypes() {
    return {
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
      aliquots:      PropTypes.instanceOf(Immutable.List),
      loading:       PropTypes.bool,
      children:      PropTypes.element,

      // a map of well index -> { selected, volume, hasError }
      wellMap: PropTypes.instanceOf(Immutable.Map),

      // convenience prop for when we have aliquots and no wellMap to be able
      // to select a well index.  Probably should make wellMap the only way
      // to configure a plate and add static convenience methods.
      selectedIndex: PropTypes.number,

      // the following two fuctions are called with the well index on hover. they
      // allow customization of the tooltip title and data, respectively.
      getWellTitle: PropTypes.func,
      getWellData:  PropTypes.func,
      // This is either a Chroma JS scheme (RdYlGn, Spectral, etc) or an array of colors ([#000, #fff])
      colorScale: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string
      ]),
      initialDomain: PropTypes.arrayOf(PropTypes.number),
      units: PropTypes.arrayOf(PropTypes.string),

      // will only all onWellClick callback if container selected.
      emptyWellsClickable: PropTypes.bool,
      onWellClick: PropTypes.func,
      onColClick: PropTypes.func,
      onRowClick: PropTypes.func,
      onSelectAllClick: PropTypes.func,
      showSelectAll: PropTypes.bool,
      allowOverride: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);

    this.getWellTitle = this.getWellTitle.bind(this);
    this.getWellData  = this.getWellData.bind(this);
    this.onWellClick  = this.onWellClick.bind(this);
    this.getWellVolume = this.getWellVolume.bind(this);
    this.aliquotForIndex = this.aliquotForIndex.bind(this);
    this.getDefaultDomain = this.getDefaultDomain.bind(this);

    this.memoizedComputeColorScale = memoize(this.computeColorScale).bind(this);
    this.memoizedAssignColors = memoize(this.assignColors).bind(this);
    this.memoizedWellMapFromAliquots = memoize(this.wellMapFromAliquots).bind(this);

    this.state = {
      activeView: 'plate',
      colorScale: this.memoizedComputeColorScale(this.props.initialDomain, this.props.containerType, this.props.colorScale, props),
      massColorScale: this.memoizedComputeColorScale(this.props.initialDomain, this.props.containerType, this.props.colorScale, props, false),
      minOverride: '',
      maxOverride: '',
      showOverrideUI: false
    };
  }

  componentDidUpdate(prevProps) {
    const { initialDomain, containerType, colorScale } = this.props;
    if (!_.isEqual(prevProps.initialDomain, initialDomain) ||
        !_.isEqual(prevProps.containerType, containerType) ||
        !_.isEqual(prevProps.colorScale, colorScale)) {
      this.setState({
        showOverrideUI: false,
        minOverride: undefined,
        maxOverride: undefined,
        colorScale: this.memoizedComputeColorScale(this.props.initialDomain, this.props.containerType, this.props.colorScale, prevProps),
        massColorScale: this.memoizedComputeColorScale(this.props.initialDomain, this.props.containerType, this.props.colorScale, prevProps, false)
      });
    }
  }

  computeColorScale(initialDomain, containerType, colorScale, props, isVolume = true) {
    return Chroma.scale(colorScale || props.colorScale).domain(
      initialDomain || this.getDefaultDomain(containerType, isVolume, props)
    );
  }

  getDefaultDomain(containerType, isVolume, props) {
    const well_volume = containerType.get('well_volume_ul');

    if (props.initialDomain) {
      return props.initialDomain;
    } else if (well_volume) {
      const maxVolume = parseFloat(well_volume);
      const maxVolumeOrMass = isVolume ? maxVolume : 2 * maxVolume;
      return [maxVolumeOrMass, 0];
    }
    return undefined;
  }

  get containerTypeHelper() {
    return new ContainerTypeHelper({
      col_count: this.props.containerType.get('col_count')
    });
  }

  onWellClick(wellIndex, e) {
    if (wellIndex == undefined) return;

    if (this.props.emptyWellsClickable) {
      this.props.onWellClick(wellIndex, e);
    } else {
      const robotIndex = this.containerTypeHelper.robotWell(wellIndex);
      const aliquot    = this.props.aliquots.find(a => a.get('well_idx') === robotIndex);

      if (aliquot == undefined) return;

      // it is a valid well, call callback.
      this.props.onWellClick(wellIndex, e);
    }
  }

  getWellTitle(wellIndex) {
    if (this.props.getWellTitle) {
      return this.props.getWellTitle.apply(this, [wellIndex]);
    }
    const aliquot = this.aliquotForIndex(wellIndex);
    const name = aliquot ? aliquot.get('name') : undefined;
    if (name) return name;
    return this.containerTypeHelper.humanWell(wellIndex);
  }

  getAliquotVolume(aliquot) {
    return aliquot ? parseFloat(aliquot.get('volume_ul')) : undefined;
  }

  getAliquotMass(aliquot) {
    return aliquot ? parseFloat(aliquot.get('mass_mg')) : undefined;
  }

  getWellVolumeOrMass(wellIndex) {
    const aliquot = this.aliquotForIndex(wellIndex);
    return this.getAliquotVolume(aliquot) || this.getAliquotMass(aliquot);
  }

  getWellVolume(wellIndex) {
    const aliquot = this.aliquotForIndex(wellIndex);
    return this.getAliquotVolume(aliquot);
  }

  getWellMass(wellIndex) {
    const aliquot = this.aliquotForIndex(wellIndex);
    return this.getAliquotMass(aliquot);
  }

  getWellData(wellIndex) {
    if (this.props.getWellData) {
      return this.props.getWellData.apply(this, [wellIndex]);
    }
    const volumeOrMassUnit = wellIndex === undefined || this.getWellVolume(wellIndex) || !this.getWellVolumeOrMass(wellIndex) ? this.props.units[0] : this.props.units[1];
    return `${this.getWellVolumeOrMass(wellIndex).toString()} ${volumeOrMassUnit}`;
  }

  aliquotForIndex(wellIndex) {
    if (this.props.aliquots) {
      return this.props.aliquots.find(aq => aq.get('well_idx') === wellIndex);
    } else {
      return this.props.wellMap.get(wellIndex);
    }
  }

  wellMapFromAliquots(aliquots) {
    if (!aliquots) return undefined;
    return aliquots.toMap().mapEntries(([, aliquot]) => {
      const aliquotVolume = aliquot.get('volume_ul');
      const aliquotMass = aliquot.get('mass_mg');
      const hasMass = !isNaN(parseFloat(aliquotMass)) && (parseFloat(aliquotMass) !== 0);
      const hasVolume = !isNaN(parseFloat(aliquotVolume)) && (parseFloat(aliquotVolume) !== 0);
      return [aliquot.get('well_idx'), Immutable.Map({ hasVolume: hasMass || hasVolume, selected: false })];
    });
  }

  assignColors(wellMap) {
    return wellMap.map((wellInfo, index) => {

      let wellInfoPrime = wellInfo;
      const wellData = this.props.getWellData ? this.props.getWellData.apply(this, [index]) : this.getWellVolumeOrMass(index);
      const parsedWellData = parseFloat(wellData);
      if (!isNaN(parsedWellData) && wellInfo.get('hasVolume') && !wellInfo.get('color')) {

        const wellColor = this.getWellVolume(index) ? this.state.colorScale(parsedWellData).hex() : this.state.massColorScale(parsedWellData).hex();
        wellInfoPrime = wellInfoPrime.set('color', wellColor);

        // If getWellData wasn't provided as a prop, the wellData is either volume or mass
        // In this case, we want to render that are above or below the
        // allowed volume or mass respectively for the container as Red, instead of along the Blue gradient.
        if (!this.props.getWellData) {
          const maxVolume = this.props.containerType.get('well_volume_ul');
          // Mass limit should be 2x density of water if the max volume exists for a container type
          const maxMass = maxVolume * 2;
          if ((wellData < 0) ||
          (this.getWellVolume(index) &&  (wellData > maxVolume)) ||
          (this.getWellMass(index) &&  (wellData > maxMass))) {
            wellInfoPrime = wellInfoPrime.set('color', Styles.Colors.red);
          }
        }
      }

      return wellInfoPrime;
    });
  }

  renderScale(wellCount, scaleFullHeight) {
    const { selectedIndex, containerType, units } = this.props;
    const wellIndex = containerType.get('is_tube') ? 0 : selectedIndex;

    const volumeOrMassUnit = wellIndex === undefined || this.getWellVolume(wellIndex) || !this.getWellVolumeOrMass(wellIndex) ? units[0] : units[1];
    return (
      <Legend
        className="interactive-plate__legend"
        indicatorVal={(wellCount === 1) ? this.getWellVolumeOrMass(wellIndex) : undefined}
        colorScale={(wellIndex === undefined || this.getWellVolume(wellIndex)) ? this.state.colorScale : this.state.massColorScale}
        units={volumeOrMassUnit}
        scaleFullHeight={scaleFullHeight}
      />
    );
  }

  render() {
    const { selectedIndex, containerType } = this.props;

    // If a map isn't provided, create one now for volume, as a default option
    let wellMap = this.props.wellMap || this.memoizedWellMapFromAliquots(this.props.aliquots);
    wellMap = this.memoizedAssignColors(wellMap);
    if (selectedIndex != undefined) {
      wellMap = wellMap.setIn([selectedIndex, 'selected'], true);
    }

    const cols      = containerType.get('col_count');
    const wellCount = containerType.get('well_count');
    const rows      = wellCount / cols;

    const defaultState = {
      'plate-reader-allow-override': 'off',
      'plate-reader-min-override': undefined,
      'plate-reader-max-override': undefined
    };

    const recomputeColorScale = (colorScale, minOverride, maxOverride) => {
      const defaultDomain = this.getDefaultDomain(this.props.containerType, this.props.selectedIndex);

      if (!defaultDomain) {
        return undefined;
      }

      const minOverrideN = parseFloat(minOverride);
      const maxOverrideN = parseFloat(maxOverride);

      const domainStart = (!isNaN(minOverrideN)) ?
        minOverrideN :
        _.last(defaultDomain);

      const domainEnd = (!isNaN(maxOverrideN)) ?
        maxOverrideN :
        _.first(defaultDomain);

      return colorScale.domain([domainEnd, domainStart]);
    };

    const aliquotVolume = this.getWellVolume(0);
    const maxVolume = parseFloat(containerType.get('well_volume_ul'));

    const maxVolumeOrMass = aliquotVolume ? maxVolume : 2 * maxVolume;
    const currentVolumeOrMass = this.getWellVolumeOrMass(0);

    const getWellInfo = (index) => {
      return {
        title: this.getWellTitle(index),
        body: this.getWellData(index)
      };
    };

    return (
      <div className="interactive-plate">
        <div className="interactive-plate__controls">
          <If condition={wellCount > 1}>
            <PlateViewTypeToggle
              activeView={this.state.activeView}
              setView={(viewType) => { this.setState({ activeView: viewType }); }}
            />
          </If>
          <If condition={this.props.allowOverride}>
            <PlateRangeOverride
              showOverrideUI={this.state.showOverrideUI}
              defaultState={defaultState}
              minOverride={this.state.minOverride || ''}
              maxOverride={this.state.maxOverride || ''}
              onConfirmOverride={() => {
                this.setState((currentState) => {
                  return {
                    colorScale: recomputeColorScale(
                      currentState.colorScale,
                      this.state.minOverride,
                      this.state.maxOverride
                    )
                  };
                });
              }}
              inputChangeCallback={(state) => {
                const showOverrideUI = state['plate-reader-allow-override'] === 'on';
                const togglingOn     = showOverrideUI && !this.state.showOverrideUI;
                const togglingOff    = !showOverrideUI && this.state.showOverrideUI;
                const newMin         = state['plate-reader-min-override'];
                const newMax         = state['plate-reader-max-override'];

                let colorScale;
                if (togglingOn) {
                  colorScale = recomputeColorScale(this.state.colorScale, newMin, newMax);
                } else if (togglingOff) {
                  colorScale = this.state.colorScale.domain(this.props.initialDomain);
                } else {
                  colorScale = this.state.colorScale;
                }

                this.setState({
                  minOverride: newMin,
                  maxOverride: newMax,
                  showOverrideUI,
                  colorScale
                });
              }}
            />
          </If>
        </div>
        {this.props.loading ? <Spinner /> : (
          <div
            className={`interactive-plate__visualization
            ${containerType.get('is_tube') ? 'interactive-plate__tube-container' : undefined}`}
          >
            {containerType.get('is_tube') ? (
              <div className="interactive-plate__tube">
                <Tube
                  vol={currentVolumeOrMass}
                  maxVol={maxVolumeOrMass}
                  wellItem={wellMap.get(0, Immutable.Map())}
                  onTubeClick={this.props.onWellClick && this.onWellClick}
                  containerType={containerType.get('id')}
                >
                  {this.renderScale(wellCount)}
                </Tube>
              </div>
            ) : (
              <Plate
                rows={rows}
                cols={cols}
                wellMap={wellMap}
                getWellInfo={getWellInfo}
                onWellClick={this.props.onWellClick && this.onWellClick}
                showSelectAll={this.props.showSelectAll}
                onRowClick={this.props.onRowClick}
                onColClick={this.props.onColClick}
                onSelectAllClick={this.props.onSelectAllClick}
                isTile={this.state.activeView === 'map'}
                width="auto"
              >
                {this.renderScale(wellCount)}
              </Plate>
            )}
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}

InteractivePlate.defaultProps = {
  emptyWellsClickable: true,
  units: ['µl', 'mg'],
  colorScale: ['009aea', 'b2e5ff'],
  allowOverride: false
};

export default InteractivePlate;
