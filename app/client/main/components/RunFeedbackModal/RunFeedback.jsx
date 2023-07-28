import PropTypes from 'prop-types';
import React     from 'react';

import { TextArea, InputsController, Label, Select } from '@transcriptic/amino';

class RunFeedback extends React.Component {

  static get propTypes() {
    return {
      onFieldChange: PropTypes.func.isRequired,
      success: PropTypes.bool,
      successNotes: PropTypes.string,
      editable: PropTypes.bool.isRequired,
      runStatus: PropTypes.string
    };
  }

  render() {

    let resultValue;

    if (this.props.runStatus === 'aborted' || this.props.runStatus === 'canceled' || !this.props.success) {
      resultValue = 'failure';
    } else if (this.props.success === true) {
      resultValue = 'success';
    }

    return (
      <div className="run-feedback">
        <InputsController
          inputChangeCallback={this.props.onFieldChange}
          defaultState={{
            result: resultValue,
            outcome: this.props.successNotes
          }}
        >
          <section className="row">
            <div className="col-sm-4 tx-stack tx-stack--xxxs">
              <h4>
                { this.props.editable ? 'Was this run successful?' : 'Run Outcome' }
              </h4>
              <Choose>
                <When condition={this.props.editable && !(this.props.runStatus === 'aborted' || this.props.runStatus === 'canceled')}>
                  <Select
                    slim
                    name="result"
                    options={[
                      {
                        value: 'success',
                        name: 'Success'
                      },
                      {
                        value: 'failure',
                        name: 'Failure'
                      }
                    ]}
                    placeholder="Select run outcome..."
                  />
                </When>
                <Otherwise>
                  <Choose>
                    <When condition={this.props.success}>
                      <Label title="Success" type="success" />
                    </When>
                    <Otherwise>
                      <Label title="Failure" type="danger" />
                    </Otherwise>
                  </Choose>
                </Otherwise>
              </Choose>
            </div>
          </section>
          <section className="row">
            <div className="col-sm-12 tx-stack tx-stack--xxxs">
              <h4>
                { this.props.editable ? 'What factors contributed this run\'s outcome?' : 'Outcome Analysis' }
              </h4>
              <If condition={this.props.editable}>
                <p className="run-feedback__descriptor">
                  Provide relevant information that led to this run’s classification. Reference any instructions,
                  containers or aliquots by ID if possible.
                </p>
              </If>
              <Choose>
                <When condition={this.props.editable}>
                  <TextArea
                    placeholder="Run analysis..."
                    name="outcome"
                    value={this.props.successNotes}
                  />
                </When>
                <Otherwise>
                  {this.props.successNotes.split('\n').map((paragraph, i) => {
                    return <p key={i}>{paragraph}</p>;
                  })}
                </Otherwise>
              </Choose>
            </div>
          </section>
        </InputsController>
      </div>
    );
  }
}

export default RunFeedback;
