import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { WellTag } from 'main/components/InstructionTags/index';
import Unit        from 'main/components/unit';

import TransferGroupSummary from './TransferGroupSummary';

import './TransferGroup.scss';

function TransferGroupRow(props) {
  return (
    <div className="transfer-group-row">
      <div className="transfer-group-row__from transfer-group-row__container">
        <If condition={props.transfer.mix_before}>
          <span>
            {`Mix ${props.transfer.mix_before.repetitions} X `}
            <Unit value={props.transfer.mix_before.volume} />
            {'& '}
          </span>
        </If>
        <WellTag refName={props.transfer.from} run={props.run} instructionSequenceNo={props.instructionSequenceNo} />
      </div>
      <i className="fa fa-long-arrow-alt-right" />
      <div className="transfer-group-row__target-well transfer-group-row__container">
        <WellTag refName={props.transfer.to} run={props.run} instructionSequenceNo={props.instructionSequenceNo} />
      </div>
      <div className="transfer-group-row__volume-label">
        <Unit value={props.transfer.volume} />
        <If condition={props.transfer.mix_after}>
          <span>
            {` & mix ${props.transfer.mix_after.repetitions} X `}
            <Unit value={props.transfer.mix_after.volume} />
          </span>
        </If>
      </div>
    </div>
  );
}

TransferGroupRow.propTypes = {
  transfer: PropTypes.instanceOf(Object),
  run: PropTypes.instanceOf(Object)
};

class TransferGroup extends React.Component {
  renderSummary() {
    return (
      <TransferGroupSummary
        transferGroup={this.props.body}
        run={this.props.run}
      />
    );
  }

  renderFullDetails() {
    return (
      <div className="row-group transfer-group">
        {this.props.body.map((transfer, i) => {
          return (
            <TransferGroupRow key={i} transfer={transfer} run={this.props.run} instructionSequenceNo={this.props.instructionSequenceNo} />
          );
        })}
      </div>
    );
  }

  render() {
    if (this.props.body.length > 500) {
      return this.renderSummary();
    } else {
      return this.renderFullDetails();
    }
  }
}

TransferGroup.propTypes = {
  body: PropTypes.array.isRequired,
  run: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default TransferGroup;
