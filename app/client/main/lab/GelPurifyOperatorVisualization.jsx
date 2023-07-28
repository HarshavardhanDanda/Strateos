import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';
import ColorUtils  from 'main/util/ColorUtils';

// MATRICES should be updated when we onboard new gels
// timeToReference and timeToWell are based on a linear fit
// of minimum times recommedned by the manufacturers
const MATRICES = {
  'size_select(8,2%)': {
    commonName: 'Size Select 8, 2%',
    ladderLaneIndexes: [4],
    timeToReference(x) {
      return (0.0133 * x) + 8.7659;
    },
    timeToWell(x) {
      return (0.0021 * x) + 0.543;
    },
    numSampleLanes: 8
  },

  'size_select(8,0.8%)': {
    commonName: 'Clone Well 8, 0.8%',
    ladderLaneIndexes: [4],
    timeToReference(x) {
      return (0.0031 * x) + 14.525;
    },
    timeToWell(x) {
      return (0.0002 * x) + 0.9268;
    },
    numSampleLanes: 8
  }
};

const LADDERS = {
  ladder1: {
    fragmentSizes: [100, 250, 500, 1000, 2000],
    commonName: '5 µL Ladder1'
  },

  ladder2: {
    fragmentSizes: [500, 1000, 2000, 4000, 10000],
    commonName: '12.5 µL Ladder2'
  }
};

const MATRIX_PROP_TYPE = PropTypes.shape({
  commonName: PropTypes.string.isRequired,
  ladderLaneIndexes: PropTypes.array.isRequired,
  timeToReference: PropTypes.func.isRequired,
  timeToWell: PropTypes.func.isRequired,
  numSampleLanes: PropTypes.number.isRequired
});

const LADDER_PROP_TYPE = PropTypes.shape({
  fragmentSizes: PropTypes.array.isRequired,
  commonName: PropTypes.string.isRequired
});

const findExtractMinMaxBands = (extracts) => {
  let extract;
  const minBands = (() => {
    const result = [];
    for (extract of Array.from(extracts)) {
      result.push(extract.band_size_range.min_bp);
    }
    return result;
  })();
  const minBand = _.min(minBands);

  const maxBands = (() => {
    const result1 = [];
    for (extract of Array.from(extracts)) {
      result1.push(extract.band_size_range.max_bp);
    }
    return result1;
  })();
  const maxBand = _.max(maxBands);

  return [minBand, maxBand];
};

function GelPurifyOperatorVisualization(props) {
  const gelPurifyInstruction = props.instruction.get('operation');

  const matrix = MATRICES[gelPurifyInstruction.get('matrix')];
  const ladder = LADDERS[gelPurifyInstruction.get('ladder')];
  const extracts = gelPurifyInstruction.get('extract');

  // Samples lanes plus ladder lanes
  const numLanes = matrix.numSampleLanes + matrix.ladderLaneIndexes.length;

  // Number of lanes plus the 1 pixel spacing for the dotted border
  const laneWidth = 100;
  const laneSpacing = 1;
  const totalWidth = (numLanes * laneWidth) + ((numLanes - 1) * laneSpacing);

  return (
    <div className="gel-purify" style={{ width: `${totalWidth + 17}px` }}>
      <GelPurifySummary
        extracts={extracts}
        ladder={ladder}
        matrix={matrix}
        volume={gelPurifyInstruction.get('volume')}
      />
      <GelPurifyHeader
        extracts={extracts}
        ladderLaneIndexes={matrix.ladderLaneIndexes}
        numLanes={numLanes}
        objects={gelPurifyInstruction.get('objects')}
        run={props.run}
      />
      <GelPurifyBody
        extracts={extracts}
        height={props.bodyHeight ? props.bodyHeight : 1000}
        ladder={ladder}
        matrix={matrix}
        numLanes={numLanes}
        run={props.run}
      />
    </div>
  );
}

GelPurifyOperatorVisualization.propTypes = {
  instruction: PropTypes.instanceOf(Immutable.Map).isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  bodyHeight: PropTypes.number
};

function GelPurifySummary(props) {
  const [minBand, maxBand] = Array.from(findExtractMinMaxBands(props.extracts));
  const minTime = props.matrix.timeToReference(minBand).toFixed(0);
  const maxTime = props.matrix.timeToReference(maxBand).toFixed(0);

  return (
    <div className="gel-purify-summary">
      <dl>
        <dt>Matrix</dt>
        <dd>
          {props.matrix.commonName}
        </dd><dt>Ladder</dt>
        <dd>
          {props.ladder.commonName}
        </dd><dt>Sample Volume</dt>
        <dd>
          <Unit value={props.volume} />
        </dd><dt>Total Extracts</dt>
        <dd>
          {props.extracts.length}
        </dd><dt>Extract Range</dt>
        <dd>
          {`${minBand} - ${maxBand} bp`}
        </dd><dt>Approximate Timing</dt>
        <dd>
          {`${minTime} - ${maxTime} min`}
        </dd>
      </dl>
    </div>
  );
}

GelPurifySummary.propTypes = {
  matrix: MATRIX_PROP_TYPE.isRequired,
  ladder: LADDER_PROP_TYPE.isRequired,
  volume: PropTypes.string.isRequired,
  extracts: PropTypes.arrayOf(PropTypes.object).isRequired
};

function GelPurifyHeader(props) {
  const laneToNumExtracts = _.countBy(props.extracts, 'lane');
  const footers = _.map(_.values(laneToNumExtracts), count => `Ext: ${count}`);
  let sampleLane = -1;
  const renderSampleLane = () => {
    sampleLane += 1;

    return (
      <div>
        <span className="numbering">{sampleLane}</span>
        <span className="source">
          <Choose>
            <When condition={props.objects.get(sampleLane)}>
              <WellTag refName={props.objects.get(sampleLane)} run={props.run} />
            </When>
            <Otherwise />
          </Choose>
        </span>
        <span
          className="footer"
        >
          <Choose>
            <When condition={footers[sampleLane]}>
              {footers[sampleLane]}
            </When>
            <Otherwise />
          </Choose>
        </span>
      </div>
    );
  };

  return (
    <div className="headers">
      {
        _.times(props.numLanes, (i) => {
          return (
            <div className="lane" key={i}>
              <Choose>
                <When condition={Array.from(props.ladderLaneIndexes).includes(i)}>
                  <div>
                    <span className="numbering">M</span>
                    <span className="source ladder">LADDER</span>
                    <span className="footer">Time</span>
                  </div>
                </When>
                <Otherwise>
                  {renderSampleLane()}
                </Otherwise>
              </Choose>
            </div>
          );
        })
      }
    </div>
  );
}

GelPurifyHeader.propTypes = {
  extracts: PropTypes.arrayOf(PropTypes.object).isRequired,
  ladderLaneIndexes: PropTypes.arrayOf(PropTypes.number).isRequired,
  numLanes: PropTypes.number.isRequired,
  objects: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

function GelPurifyBody(props) {
  const laneGroupedExtractsArray = (extracts) => {
    const groupedExtractsArray = [];
    const object = _.groupBy(extracts, 'lane');
    Object.keys(object).forEach((lane) => {
      const groupedExtracts = object[lane];
      groupedExtractsArray[parseInt(lane, 10)] = groupedExtracts;
    });

    return groupedExtractsArray;
  };

  const [minBand, maxBand] = Array.from(findExtractMinMaxBands(props.extracts));
  const minGelBand = _.min([minBand, _.first(props.ladder.fragmentSizes)]);
  const maxGelBand = _.max([maxBand, _.last(props.ladder.fragmentSizes)]);

  const groupedExtractsArray = laneGroupedExtractsArray(props.extracts);

  const padding = 50;
  const ppb = (props.height - padding) / (maxGelBand - minGelBand);
  let sampleLane = -1;

  return (
    <div
      className="grid"
      style={{
        height: `${props.height}px`
      }}
    >
      {
        _.times(props.numLanes, (i) => {
          if (Array.from(props.matrix.ladderLaneIndexes).includes(i)) {
            return (
              <GelPurifyLadderLane
                key={i}
                timeToReference={props.matrix.timeToReference}
                ladderFragmentSizes={props.ladder.fragmentSizes}
                maxBand={maxGelBand}
                ppb={ppb}
              />
            );
          } else {
            sampleLane += 1;
            return (
              <GelPurifySampleLane
                key={i}
                extracts={groupedExtractsArray[sampleLane] ? groupedExtractsArray[sampleLane] : []}
                timeToReference={props.matrix.timeToReference}
                maxBand={maxGelBand}
                ppb={ppb}
                run={props.run}
              />
            );
          }
        })
      }
    </div>
  );
}

GelPurifyBody.propTypes = {
  matrix: MATRIX_PROP_TYPE.isRequired,
  ladder: LADDER_PROP_TYPE.isRequired,
  height: PropTypes.number.isRequired,
  extracts: PropTypes.arrayOf(PropTypes.object).isRequired,
  numLanes: PropTypes.number.isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

function GelPurifySampleLane(props) {
  return (
    <div className="lane">
      {
        props.extracts.map((extract, i) => {
          const bandStart = extract.band_size_range.min_bp;
          const bandStop = extract.band_size_range.max_bp;
          const minRefTime = props.timeToReference(bandStart).toFixed(0);
          const containerName = extract.destination.split('/')[0];

          return (
            <span
              className="extraction"
              key={i}
              style={{
                top: `${Math.floor((props.maxBand - bandStop) * props.ppb)}px`,
                height: `${Math.floor((bandStop - bandStart) * props.ppb)}px`,
                backgroundColor: ColorUtils.colorForRef(containerName, props.run.get('refs'))
              }}
            >
              <GelPurifySampleEntry
                destination={extract.destination}
                bandStart={bandStart}
                bandStop={bandStop}
                minRefTime={minRefTime}
                run={props.run}
              />
            </span>
          );
        })
      }
    </div>
  );
}

GelPurifySampleLane.propTypes = {
  timeToReference: PropTypes.func.isRequired,
  extracts: PropTypes.arrayOf(PropTypes.object).isRequired,
  ppb: PropTypes.number.isRequired,
  maxBand: PropTypes.number.isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

function GelPurifySampleEntry(props) {
  const containerName = props.destination.split('/')[0];

  return (
    <span>
      <span
        className="extraction-target"
        style={{
          backgroundColor: ColorUtils.colorForRef(containerName, props.run.get('refs'))
        }}
      >
        <WellTag refName={props.destination} run={props.run} />
      </span>
      <ul
        className="extraction-details"
      >
        <li>
          {`${props.bandStart}-${props.bandStop} bp`}
        </li>
        <li>
          {`${props.minRefTime} min`}
        </li>
      </ul>
    </span>
  );
}

GelPurifySampleEntry.propTypes = {
  destination: PropTypes.string.isRequired,
  bandStart: PropTypes.number.isRequired,
  bandStop: PropTypes.number.isRequired,
  minRefTime: PropTypes.string.isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

function GelPurifyLadderLane(props) {
  return (
    <div className="lane">
      {
        props.ladderFragmentSizes.map((fragmentSize, i) => {
          const minRefTime = props.timeToReference(fragmentSize).toFixed(0);
          return (
            <span
              className="extraction"
              key={i}
              style={{
                top: `${Math.floor((props.maxBand - fragmentSize) * props.ppb)}px`
              }}
            >
              <GelPurifyFragmentEntry fragmentSize={fragmentSize} minRefTime={minRefTime} />
            </span>
          );
        })
      }
    </div>
  );
}

GelPurifyLadderLane.propTypes = {
  timeToReference: PropTypes.func.isRequired,
  ladderFragmentSizes: PropTypes.arrayOf(PropTypes.number).isRequired,
  ppb: PropTypes.number.isRequired,
  maxBand: PropTypes.number.isRequired
};

function GelPurifyFragmentEntry(props) {
  return (
    <span>
      <span className="extraction-target">{`${props.fragmentSize} bp`}</span>
      <ul className="extraction-details">
        <li>
          {`${props.minRefTime} min`}
        </li>
      </ul>
    </span>
  );
}

GelPurifyFragmentEntry.propTypes = {
  fragmentSize: PropTypes.number.isRequired,
  minRefTime: PropTypes.string.isRequired
};

export default GelPurifyOperatorVisualization;
