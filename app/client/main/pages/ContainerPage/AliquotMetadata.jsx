import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import AliquotAPI                                   from 'main/api/AliquotAPI';
import ResourceAPI                                  from 'main/api/ResourceAPI';
import { SearchChoosingProperty } from 'main/components/properties';
import EditableProperty from 'main/components/EditableProperty';
import ContainerTypeHelper                          from 'main/helpers/ContainerType';
import ResourceStore                                from 'main/stores/ResourceStore';
import { AliquotResourcesQueryEngine }              from 'main/inventory/util/QueryEngines';
import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';

import { AddInplace, TableLayout } from '@transcriptic/amino';
import './AliquotMetadata.scss';
import { readableHazards } from 'main/util/Hazards';
import FeatureConstants from '@strateos/features';
import FeatureStore     from 'main/stores/FeatureStore';

class AliquotMetadata extends React.Component {

  static get propTypes() {
    return {
      aliquot:       PropTypes.instanceOf(Immutable.Map).isRequired,
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
      editable: PropTypes.bool,
      updateResource: PropTypes.func,
      updateAliquotData: PropTypes.func // This is required to fetch the updated aliquot data and update the UI when used inside the InventorySelectorModal
    };
  }

  static get defaultProps() {
    return {
      editable: true
    };
  }

  constructor() {
    super();

    this.state = {
      adding: false,
      editing: false
    };

    _.bindAll(
      this,
      'onSetResource',
      'onSetProperty',
      'onRemoveProperty'
    );
  }

  onSetResource(r) {
    this.setState({
      editing: false
    });

    const resource_id = r ? r.id : null; // eslint-disable-line no-null/no-null

    AliquotAPI.update(this.props.aliquot.get('id'), {
      resource_id
    }).done(() => {
      this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
      this.props.updateResource && this.props.updateResource();
    });

    // the SearchChoosingProperty doesn't load the resources into the store
    // so we fetch here as means to load into the store.
    if (resource_id != undefined) {
      ResourceAPI.get(resource_id);
    }
  }

  onSetProperty({ key, value }, originalKey) {
    this.setState({
      adding: false,
      editing: false
    });

    const addData = { [key]: value };

    // delete the original key if we have replaced it.
    let deleteData;
    if (originalKey && originalKey !== key)  {
      deleteData = [originalKey];
    } else {
      deleteData = [];
    }

    AliquotAPI.modifyProperties(this.props.aliquot.get('id'), addData, deleteData)
      .done(() => {
        this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
      });
  }

  onRemoveProperty(key) {
    this.setState({});

    const addData    = {};
    const deleteData = [key];

    return AliquotAPI.modifyProperties(this.props.aliquot.get('id'), addData, deleteData)
      .done(() => {
        this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
      });
  }

  humanWellIndex() {
    if (!this.props.aliquot) {
      return 'Unknown';
    }

    const helper    = new ContainerTypeHelper({ col_count: this.props.containerType.get('col_count') });
    const wellIndex = this.props.aliquot.get('well_idx');

    return helper.humanWell(wellIndex);
  }

  isAdmin() {
    return Transcriptic.current_user.system_admin;
  }

  hasEditProperty() {
    const lab_id = this.props.container.getIn(['lab', 'id']);
    const editable = FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, lab_id);
    return editable;
  }

  searchData() {
    return {
      containerId: this.props.container.get('id')
    };
  }

  render() {
    const resource   = ResourceStore.getById(this.props.aliquot.get('resource_id'));
    const properties = this.props.aliquot.get('properties') || Immutable.Map();
    const { Block, Header, Body, Footer, Row, HeaderCell, BodyCell } = TableLayout;
    const mass = this.props.aliquot.get('mass_mg');
    return (
      <Block className="aliquot-metadata" toggleRowColor>
        <Header>
          <Row>
            <HeaderCell>
              <div className="aliquot-metadata__main_div">
                <div className="aliquot-metadata__sub_div">Property</div>
                <div className="aliquot-metadata__sub_div">Value</div>
              </div>
            </HeaderCell>
          </Row>
        </Header>
        <Body>
          <Row>
            <BodyCell>
              <div className="aliquot-metadata__main_div">
                <div className="aliquot-metadata__sub_div">Well Index</div>
                <div className="aliquot-metadata__sub_div">{this.humanWellIndex()}</div>
              </div>
            </BodyCell>
          </Row>
          <Row>
            <BodyCell>
              <div className="aliquot-metadata__main_div">
                <div className="aliquot-metadata__sub_div">ID</div>
                <div className="aliquot-metadata__sub_div">{this.props.aliquot.get('id')}</div>
              </div>
            </BodyCell>
          </Row>
          <Row>
            <BodyCell multiline>
              <EditableProperty
                editable={this.props.editable}
                name="Name"
                value={this.props.aliquot.get('name')}
                fullWidth
                nameEditable={false}
                illegalChars={['/']}
                onSave={(value) => {
                  AliquotAPI.update(this.props.aliquot.get('id'), {
                    name: value
                  }).done(() => {
                    this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
                  });
                }}
              />
            </BodyCell>
          </Row>
          <Row>
            <BodyCell>
              {(this.isAdmin() || this.hasEditProperty()) ?
                (
                  <EditableProperty
                    name="Volume"
                    value={this.props.aliquot.get('volume_ul')}
                    suffix={'µL'}
                    fullWidth
                    nameEditable={false}
                    onSave={(value) => {
                      this.setState({ editing: false });
                      const v = value + ':microliter';
                      const maxVolume = this.props.containerType.get('well_volume_ul');
                      const volumeError = PlateCreateLogic.volumeError(v, maxVolume);
                      if (!volumeError) {
                        AliquotAPI.update(this.props.aliquot.get('id'), {
                          volume_ul: _.toNumber(value)
                        }).done(() => {
                          this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
                        });
                      }
                    }}
                  />
                )
                : (
                  <div className="aliquot-metadata__main_div">
                    <div className="aliquot-metadata__sub_div">Volume</div>
                    <div className="aliquot-metadata__sub_div">{ this.props.aliquot.get('volume_ul') } µL</div>
                  </div>
                )
              }
            </BodyCell>
          </Row>
          <Row>
            <BodyCell>
              {(this.isAdmin() || this.hasEditProperty()) ?
                (
                  <EditableProperty
                    name="Aliquot Mass"
                    value={mass}
                    suffix={'mg'}
                    fullWidth
                    nameEditable={false}
                    onSave={(value) => {
                      this.setState({ editing: false });
                      const m = value + ':milligram';
                      const maxVolume = this.props.containerType.get('well_volume_ul');
                      const massError = PlateCreateLogic.massError(m, maxVolume);
                      if (!massError) {
                        AliquotAPI.update(this.props.aliquot.get('id'), {
                          mass_mg: _.toNumber(value)
                        }).done(() => {
                          this.props.updateAliquotData && this.props.updateAliquotData(this.props.aliquot.get('well_idx'));
                        });
                      }
                    }}
                  />
                )
                :
                (
                  <div className="aliquot-metadata__main_div">
                    <div className="aliquot-metadata__sub_div">Aliquot Mass</div>
                    <div className="aliquot-metadata__sub_div">{ mass ? `${mass} mg` : 'N/A'}</div>
                  </div>
                )
              }
            </BodyCell>
          </Row>
          <Row>
            <BodyCell>
              <SearchChoosingProperty
                name="Resource"
                value={resource ? (resource.get('name') || '') : ''}
                engine={AliquotResourcesQueryEngine}
                onEdit={() => this.setState({ editing: true })}
                onCancel={() => this.setState({ editing: false })}
                onSave={this.onSetResource}
                editable={!this.state.editing && this.props.editable && this.hasEditProperty()}
                searchData={this.searchData()}
              />
            </BodyCell>
          </Row>
          <Row>
            <BodyCell>
              <div className="aliquot-metadata__main_div">
                <div className="aliquot-metadata__sub_div">Hazard</div>
                <div className="aliquot-metadata__sub_div">
                  {readableHazards(this.props.aliquot.get('hazards', []))}
                </div>
              </div>
            </BodyCell>
          </Row>
          {properties.entrySeq().map(([k, v]) => {
            return (
              <Row key={k}>
                <BodyCell multiline>
                  <EditableProperty
                    editable={this.props.editable}
                    keyName={k}
                    name={k}
                    value={v}
                    fullWidth
                    nameEditable
                    onSave={({ key, value }) => this.onSetProperty({ key, value }, k)}
                    onDelete={() => this.onRemoveProperty(k)}
                  />
                </BodyCell>
              </Row>
            );
          })}
        </Body>
        <If condition={this.props.editable}>
          <Footer>
            <BodyCell>
              <AddInplace onAdd={this.onSetProperty} />
            </BodyCell>
          </Footer>
        </If>
      </Block>
    );
  }
}

export default AliquotMetadata;
