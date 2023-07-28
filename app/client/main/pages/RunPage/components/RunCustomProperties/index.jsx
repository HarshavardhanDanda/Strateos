import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';
import _          from 'lodash';
import { TableLayout } from '@transcriptic/amino';
import EditableProperty from 'main/components/EditableProperty';
import RunAPI from 'main/api/RunAPI';

import './RunCustomProperties.scss';

class RunCustomProperties extends React.Component {

  constructor() {
    super();
    this.renderCustomInput = this.renderCustomInput.bind(this);
    this.state = {
      value: undefined
    };
  }

  renderCustomInput(inputConfig, inputFieldKey) {
    const { customProperties, runId }  = this.props;

    const value = this.state.value || customProperties[inputFieldKey] || inputConfig.default;

    switch (inputConfig.type) {
      case 'choice':
        return (
          <EditableProperty
            value={value}
            showInitialValue
            options={inputConfig.options}
            openInEdit={!customProperties[inputFieldKey]}
            fullWidth
            editable={this.props.editable}
            nameEditable={false}
            keyName={inputFieldKey}
            onSave={(value) => {
              RunAPI.updateCustomProperty(
                runId,
                inputFieldKey,
                value);
              this.setState({ value: value });
            }
            }
          />
        );
      case 'multi-select': {
        return (
          <EditableProperty
            multiSelect
            value={value ? value.split(';') : []}
            showInitialValue
            options={inputConfig.options}
            openInEdit={!customProperties[inputFieldKey]}
            fullWidth
            editable={this.props.editable}
            nameEditable={false}
            keyName={inputFieldKey}
            onSave={(value) => {
              RunAPI.updateCustomProperty(
                runId,
                inputFieldKey,
                `${value.join(';')}`);
              this.setState({ value: `${value.join(';')}` });

            }}
          />
        );
      }
      default:
        return undefined;
    }
  }

  render() {
    const { customInputsConfig } = this.props;
    const { Block, Header, Body, Row, HeaderCell, BodyCell } = TableLayout;

    const { customPropertiesClass } = this.props;
    return (
      <div
        className={classNames({
          'run-properties': !customPropertiesClass
        },
        this.props.customPropertiesClass
        )}
      >
        <Block toggleRowColor>
          <Header>
            <Row>
              <HeaderCell>
                <div className="run-metadata__main_div">
                  <div className="run-metadata__sub_div">Property</div>
                  <div className="run-metadata__sub_div">Value</div>
                </div>
              </HeaderCell>
            </Row>
          </Header>
          <Body>
            {_.map(customInputsConfig, (inputConfig, key) => {
              return (
                <Row key={key}>
                  <BodyCell>
                    <div className="run-metadata__main_div">
                      <div className="run-metadata__sub_div">
                        {inputConfig.label}
                      </div>
                      {this.renderCustomInput(
                        inputConfig,
                        key
                      )}
                    </div>
                  </BodyCell>
                </Row>
              );
            })}
          </Body>
        </Block>
      </div>
    );
  }
}

RunCustomProperties.defaultProps = {
  customInputsConfig: {},
  customProperties: {},
  editable: false
};

RunCustomProperties.propTypes = {
  customProperties: PropTypes.object,
  customInputsConfig: PropTypes.object.isRequired,
  runId: PropTypes.string,
  editable: PropTypes.bool,
  customPropertiesClass: PropTypes.string,
  customPropertyId: PropTypes.string
};

export default RunCustomProperties;
