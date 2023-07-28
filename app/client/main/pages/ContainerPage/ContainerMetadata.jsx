import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  TableLayout,
  InputsController,
  InplaceInput,
  TextInput,
  AddInplace,
} from '@transcriptic/amino';

import './ContainerMetadata.scss';

import * as ContainerRow from '../../inventory/ContainerProperties';
import ContainerType from '../../components/ContainerType';
import String from '../../util/String';
import ContainerActions from '../../actions/ContainerActions';
import NotificationActions from '../../actions/NotificationActions';

class ContainerMetadata extends React.Component {
  static get propTypes() {
    return {
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor(props) {
    super(props);

    const containerProperties = props.container.get('properties');
    const properties = (!containerProperties || containerProperties.size === 0) ? {} : containerProperties.toObject();

    this.state = {
      properties: properties,
      editedKey: undefined,
      editedValue: undefined,
    };
    this.onCancelEdit = this.onCancelEdit.bind(this);
    this.update = this.update.bind(this);
    this.onSaveEdit = this.onSaveEdit.bind(this);
    this.onDeleteProps = this.onDeleteProps.bind(this);
    this.onAddProps = this.onAddProps.bind(this);
    this.renderMetadata = this.renderMetadata.bind(this);
  }

  onCancelEdit() {
    return Promise.resolve(
      this.setState({
        properties: this.state.properties
      })
    );
  }

  update(properties) {
    return Promise.resolve(
      /** pending JIRA 5029 to decide which api to use */
      ContainerActions.update(this.props.container.get('id'), { properties })
        .done(() => {
          this.setState({
            properties,
            editedKey: undefined,
            editedValue: undefined,
          });
          NotificationActions.createNotification({ text: 'Updates have been saved.' });
        })
        .fail((...e) => {
          NotificationActions.handleError(...e);
        })
    );
  }

  onSaveEdit(key, value, index, additionalItems) {
    additionalItems[index] = [this.state.editedKey || key, this.state.editedValue || value];
    const properties = _.fromPairs(additionalItems);
    return this.update(properties);
  }

  onDeleteProps(key) {
    const properties = this.state.properties;
    delete properties[key];
    return this.update(properties);
  }

  onAddProps({ key, value }) {
    const properties = {
      ...this.state.properties,
      [key]: value,
    };
    return this.update(properties);
  }

  renderMetadata(column) {
    const { container, containerType } = this.props;

    if (column === 'Container type') {
      return (
        <ContainerType containerTypeId={containerType.get('id')} />
      );
    } else if (column === 'Catalog no.' || column === 'Vendor') {
      return ContainerRow[String.upperCamelCase(column)](containerType);
    } else if (column === 'Current mass' && !containerType.get('is_tube')) {
      return '-';
    } else {
      return ContainerRow[String.upperCamelCase(column)](container);
    }
  }

  renderItem({ key, value }) {
    return (
      <div className="container-metadata__core-property">
        <div className="container-metadata__core-property__item">{key}</div>
        <div className="container-metadata__core-property__item">{value}</div>
      </div>
    );
  }

  render() {
    const columns = [
      'Catalog no.',
      'ID',
      'Barcode',
      'Suggested barcode',
      'Current location',
      'Storage temp',
      'Hazard',
      'Container type',
      'Current mass',
      'Empty container mass',
      'Created by',
      'Vendor'
    ];
    const { Block, Header, Body, Footer, Row, HeaderCell, BodyCell } = TableLayout;
    const additionalItems = _.isEmpty(this.state.properties) ? [] : _.toPairs(this.state.properties);

    return (
      <div className="container-metadata">
        <Block toggleRowColor>
          <Header>
            <Row>
              <HeaderCell>
                {this.renderItem({ key: 'Property', value: 'Value' })}
              </HeaderCell>
            </Row>
          </Header>
          <Body>
            {
              columns.map(column => (
                <Row key={column}>
                  <BodyCell>
                    {this.renderItem({ key: column, value: this.renderMetadata(column) })}
                  </BodyCell>
                </Row>
              ))
            }
            {
              _.map(additionalItems, (prop, index, additionalItems) => {

                const key = prop[0];
                const value = Array.isArray(prop[1]) ? prop[1].join(', ') : prop[1];

                return (
                  <Row key={key}>
                    <BodyCell className="metadata-cell-multiline">
                      <InputsController
                        inputChangeCallback={() => { }}
                      >
                        <InplaceInput
                          fullWidth
                          onCancel={this.onCancelEdit}
                          onSave={() => this.onSaveEdit(key, value, index, additionalItems)}
                          onEdit={() => {}}
                          onDelete={() => this.onDeleteProps(key)}
                          content={[
                            {
                              id: `${key}-${value}`,
                              viewComponent: key,
                              editComponent: <TextInput value={key} name={key} onChange={(e) => this.setState({ editedKey: e.target.value })} />,
                            },
                            {
                              id: `${value}-${key}`,
                              viewComponent: value,
                              editComponent: <TextInput value={value} name={value} onChange={(e) => this.setState({ editedValue: e.target.value })} />,
                            },
                          ]}
                          buttonType="info"
                        />
                      </InputsController>
                    </BodyCell>
                  </Row>
                );
              })
            }
          </Body>
          <Footer>
            <BodyCell>
              <AddInplace onAdd={this.onAddProps} />
            </BodyCell>
          </Footer>
        </Block>
      </div>
    );
  }
}

export default ContainerMetadata;
