import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Section } from '@transcriptic/amino';
import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

// TODO Convert to ul.params
class FlowAnalyzeOp extends React.PureComponent {

  static get propTypes() {
    return {
      run: PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.object.isRequired
    };
  }

  render() {
    const op         = this.props.instruction.operation;
    const channels   = _.omit(op.channels, 'colors');
    const { colors } = op.channels;

    return (
      <div className="flow-analyze">
        <Section title="Controls">
          <table>
            <thead><tr><td>Name</td><td>Low</td><td>High</td></tr></thead>
            <tbody>
              {_.keys(channels).map((name) => {
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    <td><Unit value={channels[name].voltage_range.low} /></td>
                    <td><Unit value={channels[name].voltage_range.high} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
        <Section title="Colors">
          <Choose>
            <When condition={colors != undefined}>
              <table>
                <thead>
                  <tr>
                    <td>Name</td><td>Excitation</td><td>Emission</td>
                    <td>Low</td><td>High</td>
                  </tr>
                </thead>
                <tbody>
                  <If condition={colors != undefined}>
                    {colors.map((color) => {
                      return (
                        <tr key={color.name}>
                          <td>{color.name}</td>
                          <td><Unit value={color.excitation_wavelength} /></td>
                          <td><Unit value={color.emission_wavelength} /></td>
                          <td><Unit value={color.voltage_range.low} /></td>
                          <td><Unit value={color.voltage_range.high} /></td>
                        </tr>
                      );
                    })}
                  </If>
                </tbody>
              </table>
            </When>
            <Otherwise>NO COLORS</Otherwise>
          </Choose>
        </Section>
        <Section title="Negative Controls">
          <table>
            <thead>
              <tr><td>Channels</td><td>Well</td><td>Volume</td></tr>
            </thead>
            <tbody>
              {op.negative_controls.map((control) => {
                return (
                  <tr key={control.well}>
                    <td>{`[${control.channel.join(', ')}]`}</td>
                    <td>
                      <WellTag refName={control.well} run={this.props.run} />
                    </td>
                    <td><Unit value={control.volume} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
        <Section title="Positive Controls">
          <Choose>
            <When condition={op.positive_controls != undefined}>
              <table>
                <thead>
                  <tr>
                    <td>Channels</td><td>Well</td><td>Volume</td>
                    <td>Min Bleeds</td>
                  </tr>
                </thead>
                <tbody>
                  <If condition={op.positive_controls != undefined}>
                    {op.positive_controls.map((control) => {
                      return (
                        <tr key={control.well}>
                          <td>{`[${control.channel.join(', ')}]`}</td>
                          <td>
                            <WellTag
                              refName={control.well}
                              run={this.props.run}
                            />
                          </td>
                          <td><Unit value={control.volume} /></td>
                          <If condition={control.minimize_bleed != undefined}>
                            <td>
                              {control.minimize_bleed.map((mbleed, bleedIndex) => {
                                return (
                                  // eslint-disable-next-line react/no-array-index-key
                                  <div key={bleedIndex}>
                                    <div>{`from: ${mbleed.from}`}</div>
                                    <div>{`to: [${mbleed.to.join(', ')}]`}</div>
                                  </div>
                                );
                              })}
                            </td>
                          </If>
                        </tr>
                      );
                    })}
                  </If>
                </tbody>
              </table>
            </When>
            <Otherwise>NO POSITIVE CONTROLS</Otherwise>
          </Choose>
        </Section>
        <Section title="Samples">
          <table>
            <thead><tr><td>Well</td><td>Volume</td></tr></thead>
            <tbody>
              {op.samples.map((sample) => {
                return (
                  <tr key={sample.well}>
                    <td>
                      <WellTag refName={sample.well} run={this.props.run} />
                    </td>
                    <td><Unit value={sample.volume} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      </div>
    );
  }
}

export default FlowAnalyzeOp;
