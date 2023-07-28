import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { WellTag } from 'main/components/InstructionTags/index';

// TODO Convert to ul.params
class AutopickOp extends React.PureComponent {
  render() {
    const op = this.props.instruction.operation;

    return (
      <div className="autopick">
        <table className="params">
          <thead>
            <tr>
              <td>Wells</td>
            </tr>
          </thead>
          <tbody>
            <Choose>
              <When condition={op.groups != undefined}>
                {op.groups.map((g, i) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      <td className="from">
                        {g.from.map((well) => {
                          return (
                            <div key={well}>
                              <WellTag refName={well} run={this.props.run} />
                            </div>
                          );
                        })}
                      </td>
                      <td className="arrow">⟶ </td>
                      <td className="to">
                        {g.to.map((well) => {
                          return (
                            <div key={well}>
                              <WellTag refName={well} run={this.props.run} />
                            </div>
                          );
                        })}
                      </td>
                      <td className="min-abort">
                        <strong>
                          {'Min Abort '}
                          <span>
                            <Choose>
                              <When condition={g.min_abort != undefined}>
                                {g.min_abort}
                              </When>
                              <Otherwise>
                                {0}
                              </Otherwise>
                            </Choose>
                          </span>
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </When>
              <Otherwise>
                <tr>
                  <td className="from">
                    <WellTag refName={op.from} run={this.props.run} />
                  </td>
                  <td className="arrow">⟶ </td>
                  <td className="to">
                    {op.to.map((well) => {
                      return (
                        <div key={well}>
                          <WellTag refName={well} run={this.props.run} />
                        </div>
                      );
                    })}
                  </td>
                </tr>
              </Otherwise>
            </Choose>
          </tbody>
        </table>
        <table className="params">
          <tbody>
            <If condition={op.min_colony_count != undefined}>
              <tr>
                <td>Min Colony Count</td>,
                <td>{op.min_colony_count}</td>
              </tr>
            </If>
            <If condition={op.criteria != undefined}>
              <tr>
                <td>Criteria</td>
                <td>
                  <table className="params">
                    <tbody>
                      {_.map(op.criteria, (v, k) => {
                        return (
                          <tr key={k}>
                            <td>
                              {k}:
                            </td>
                            <td>
                              {v}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </td>
              </tr>
            </If>
          </tbody>
        </table>
      </div>
    );
  }
}

AutopickOp.displayName = 'AutopickOp';

AutopickOp.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  instruction: PropTypes.object.isRequired
};

export default AutopickOp;
