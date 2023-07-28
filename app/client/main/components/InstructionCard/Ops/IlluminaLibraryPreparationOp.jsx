import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { Param } from '@transcriptic/amino';
import { WellTag } from 'main/components/InstructionTags/index';

class IlluminaLibraryPreparationOp extends React.PureComponent {
  formatSourceQuality(source) {
    const mtype = source.source_quality.measurement_type;
    const mvalue = source.source_quality.measurement_value;

    return `${mtype}: ${mvalue}`;
  }

  formatSizeSelection(sizeSelection) {
    switch (sizeSelection) {
      case 'small':
        return 'small (150-350 bp)';
      case 'medium':
        return 'medium (250-450 bp)';
      case 'large':
        return 'large (350-700 bp)';
      case 'none':
        return 'none (150 bp)';
      default:
        return 'UNKNOWN';
    }
  }

  render() {
    const op = this.props.instruction.operation;

    return (
      <ul className="params">
        <Param label="Source material" value={op.source_material} />
        <Param label="Fragmentation" value={op.fragmentation_status} />
        <Param label="Organism" value={op.source_organism} />
        <Param
          label="Sources"
          value={(
            <table className="illumina-library-prep-details">
              <thead>
                <tr>
                  <th>Object</th>
                  <th>Concentration</th>
                  <th>Volume</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {op.sources.map((source, i) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      <td>
                        <WellTag refName={source.object} run={this.props.run} />
                      </td>
                      <td>
                        {source.source_concentration}
                      </td>
                      <td>
                        {source.source_volume}
                      </td>
                      <td>
                        {this.formatSourceQuality(source)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        />
        <Param label="Experiment Type" value={op.experiment_type} />
        <Param label="Strandedness" value={op.strandedness} />
        <Param label="Library Indices" value={op.library_indices} />
        <Param
          label="Size Selection"
          value={this.formatSizeSelection(op.size_selection)}
        />
      </ul>
    );
  }
}

IlluminaLibraryPreparationOp.displayName = 'IlluminaLibraryPreparationOp';

IlluminaLibraryPreparationOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default IlluminaLibraryPreparationOp;
