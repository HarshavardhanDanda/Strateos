import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import { ActionMenu, Card, KeyValueList, Divider } from '@transcriptic/amino';
import ResourceActions from 'main/actions/ResourceActions';
import ModalActions from 'main/actions/ModalActions';
import AddResourceModal from 'main/pages/ResourcesPage/modals/AddResourceModal';
import './ResourceCard.scss';
import { ResourcesPageSearchActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';

function sensitivityIcon(sensitivity) {
  switch (sensitivity) {
    case 'Temperature':
      return <i className="far fa-temperature-low" />;
    case 'Light':
      return <i className="far fa-lightbulb-on" />;
    case 'Air':
      return <i className="far fa-wind" />;
    case 'Humidity':
      return <i className="far fa-dewpoint" />;
  }
}

function resourceNameIcon(resourceName) {
  switch (resourceName) {
    case 'Reagent':
      return <i className="far fa-flask" />;
    case 'ChemicalStructure':
      return <i className="aminor-hexagon-double" />;
    case 'NucleicAcid':
      return <i className="far fa-dna" />;
    case 'Protein':
      return <i className="far fa-project-diagram" />;
    case 'Cell':
      return <i className="far fa-disease" />;
    case 'Virus':
      return <i className="far fa-viruses" />;
  }
}
class ResourceInfo extends React.Component {
  static get propTypes() {
    return {
      resource: PropTypes.instanceOf(Immutable.Map)
    };
  }

  render() {
    const resourceName = this.props.resource.get('name');
    const sensitivities = this.props.resource.get('sensitivities');
    const materialComponents = this.props.resource.get('material_components');
    return (
      <div>
        <div className="resource-card__card-name">
          <div className="resource-card__resource-name-icon">
            {resourceNameIcon(this.props.resource.get('kind'))}
          </div>
          <Choose>
            <When condition={resourceName != undefined}>
              <div className="resource-card__resource-name">
                {resourceName}
              </div>
            </When>
            <Otherwise>(No Name)</Otherwise>
          </Choose>
        </div>
        <dl className="resource-card__container">
          <div>
            <KeyValueList
              entries={[
                {
                  key: 'ID',
                  value: this.props.resource.get('id')
                },
                {
                  key: 'STORAGE',
                  value: this.props.resource.get('storage_condition')
                }
              ]}
            />
          </div>
          <div className="resource-card__kind">
            <KeyValueList
              entries={[
                {
                  key: 'KIND',
                  value: this.props.resource.get('kind')
                },

                {
                  key: 'SENSITIVITIES',
                  value: sensitivities.map((sensitivity, index) => {
                    return (
                      <span
                        className="resource-card__sensitivity"
                        key={`${sensitivity}-${index}`}
                      >
                        {sensitivityIcon(sensitivity)}
                      </span>
                    );
                  })
                }
              ]}
            />
          </div>
        </dl>
        <Divider isDark />
        <Choose>
          <When condition={!materialComponents.size}>
            <p className="tx-type--secondary">
              Not used in any Kits.
            </p>
          </When>
          <Otherwise>
            <KeyValueList entries={[{ key: 'FOUND IN', value: materialComponents.size + ' Kit' }]} />
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

class ResourceCard extends React.Component {
  static get propTypes() {
    return {
      resource: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  onClickAction(name) {
    switch (name) {
      case 'Delete':
        ResourceActions.delete(this.props.resource.get('id')).done(_.debounce(this.onRemove, 400));
        break;
      case 'Edit':
        ModalActions.openWithData(
          AddResourceModal.MODAL_ID,
          { resource: this.props.resource }
        );
        break;
      default:
        break;
    }
  }

  onRemove() {
    ResourcesPageSearchActions.onReSearch();
  }

  onResourceCardClick(resource) {
    ModalActions.openWithData(AddResourceModal.MODAL_ID, { resource, readOnly: true });
  }

  render() {
    return (
      <div className="col-md-4">
        <Card
          className="resource-card__card"
          onClick={() => {
            this.onResourceCardClick(this.props.resource);
          }}
        >
          <ResourceInfo
            resource={this.props.resource}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="resource-card__actions-container"
          >
            <ActionMenu
              isTiny
              onClick={(e) => e.stopPropagation()}
              title="Resource Actions"
              options={[
                {
                  text: 'Edit',
                  icon: 'fa fa-edit',
                  onClick: () => {
                    this.onClickAction('Edit');
                  }
                },
                {
                  text: 'Delete',
                  icon: 'fa fa-trash',
                  onClick: () => {
                    this.onClickAction('Delete');
                  }
                }
              ]}
            />
          </div>
        </Card>
      </div>
    );
  }
}

export default ResourceCard;
