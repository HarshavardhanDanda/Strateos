import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import humanize from 'underscore.string/humanize';

import { ContainerTag } from 'main/components/InstructionTags/index';
import Unit from 'main/components/unit';

import { ExpandableCard } from '@transcriptic/amino';

class MagneticTransferSubOperation extends React.PureComponent {
  displayAsContainer(param) {
    return param === 'object';
  }

  displayAsUnit(value) {
    return typeof value === 'string';
  }

  displayAsString(value) {
    return typeof value === 'boolean' || typeof value === 'number';
  }

  parseSubOpValue(param, value, ref) {
    if (this.displayAsContainer(param)) {
      return <ContainerTag refName={ref} run={this.props.run} />;
    } else if (this.displayAsString(value)) {
      return value.toString();
    } else if (this.displayAsUnit(value)) {
      return <Unit value={value} />;
    } else if (value == undefined) {
      return 'none';
    } else {
      return value;
    }
  }

  expandableCardHead() {
    return (
      <div className="op">
        <h4>
          {this.props.subOpName}
        </h4>
        <span
          onClick={(e) => {
            // The instruction header catches click events and expands/collapses
            // the instruction panel.  We don't want this to happen when the user
            // clicks on a container tag in the instruction card header.
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ContainerTag
            refName={this.props.subOpParams.object}
            run={this.props.run}
          />
        </span>
      </div>
    );
  }

  expandableCardBody() {
    return (
      <table className="params">
        <tbody>
          {_.map(this.props.subOpParams, (value, param) => (
            <tr>
              <td>
                {humanize(param)}
              </td>
              <td>
                {this.parseSubOpValue(
                  param,
                  value,
                  this.props.subOpParams.object
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    return (
      <ExpandableCard
        className="instruction-card"
        cardHead={this.expandableCardHead()}
        cardBody={this.expandableCardBody()}
      />
    );
  }
}

MagneticTransferSubOperation.displayName = 'MagneticTransferSubOp';

MagneticTransferSubOperation.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  subOpParams: PropTypes.object.isRequired,
  subOpName: PropTypes.string.isRequired
};

class MagneticTransferOp extends React.PureComponent {
  displaySubOps() {
    const { groups } = this.props.instruction.operation;

    return groups.map((group, i) => {
      return (
        <tr key={`table-row-${i}`} className="magnetic-transfer">
          <td
            key={i} // eslint-disable-line react/no-array-index-key
          >
            {`Group ${i + 1}`}
            <td>
              {group.map((subOp, j) => {
                const subOpName = _.keys(subOp)[0];
                const subOpParams = _.values(subOp)[0];

                return (
                  <MagneticTransferSubOperation
                    key={`${subOpName}-${j}`}
                    run={this.props.run}
                    subOpName={subOpName}
                    subOpParams={subOpParams}
                  />
                );
              })}
            </td>
          </td>
        </tr>
      );
    });
  }

  render() {
    const op = this.props.instruction.operation;

    return (
      <div>
        <table className="params magnetic-transfer">
          <tbody>
            <tr className="magnetic-transfer">
              <td>Magnetic head</td>
              <td>
                {op.magnetic_head}
              </td>
            </tr>
            {this.displaySubOps()}
          </tbody>
        </table>
      </div>
    );
  }
}

MagneticTransferOp.displayName = 'MagneticTransferOp';

MagneticTransferOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default MagneticTransferOp;
