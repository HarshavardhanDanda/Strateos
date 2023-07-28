import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  SearchFilter,
  MoleculeViewer,
  SearchFilterBar,
  SearchRangeFilter,
  SearchFilterWrapper,
  ControlBox,
  SearchField
} from '@transcriptic/amino';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import OrganizationTypeAhead from 'main/pages/InventoryPage/OrganizationFilter';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import SearchFilterCustomProperties from 'main/components/SearchFilterCustomProperties/SearchFilterCustomProperties';
import SessionStore from 'main/stores/SessionStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import { getNumericRangeText } from 'main/util/MeasurementUtil';
import {
  ContainerStatusOptions,
  CreatorOptions,
  SourceOptions,
  HazardOptions
} from '../SharedFiltersValues';

import SimilaritySearch from './CompoundsSimilaritySearch';
import CompoundsTagInput from './CompoundsTagInput';
import './CompoundSearchFilters.scss';

class CompoundSearchFilters extends React.Component {
  constructor(props) {
    super();
    this.state = {
      properties: {}
    };
    const hasLabPermissions = FeatureStore.hasFeature(FeatureConstants.VIEW_LAB_COMPOUNDS);
    if (((hasLabPermissions && props.searchOptions.get('organization_id')) || !hasLabPermissions)) {
      ContextualCustomPropertiesConfigActions.loadConfig(props.searchOptions.get('organization_id') || (SessionStore.getOrg() && SessionStore.getOrg().get('id')), 'CompoundLink').then(resp => {
        resp.searchProperties = { ...this.props.searchOptions.get('searchProperties') };
        if (resp) {
          this.setState({ properties: resp });
        }
      });
    }

  }

  componentDidUpdate(prevProps) {

    if ((this.props.searchOptions.get('organization_id') !== prevProps.searchOptions.get('organization_id'))) {
      ContextualCustomPropertiesConfigActions.loadConfig(this.props.searchOptions.get('organization_id') || SessionStore.getOrg().get('id'), 'CompoundLink').then(resp => {
        resp.searchProperties = { ...this.props.searchOptions.get('searchProperties') };
        if (resp) {
          this.setState({ properties: resp });
        }
      });
      this.props.onSearchFilterChange(this.props.searchOptions.set('searchProperties', { }));
    }

  }

  onSelectOption(field) {
    return ((value) => {
      const { searchOptions, onSearchSimilarityChange, onSearchFilterChange } = this.props;

      if (field === 'searchSimilarity') return onSearchSimilarityChange(value);
      if (field === 'searchLabel') {
        const labels = _.cloneDeep(searchOptions.get('searchLabel'));
        if (labels.indexOf(value) === -1) labels.push(value);
        return onSearchFilterChange(searchOptions.set(field, labels));
      }
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  getCustomPropertiesPreview() {
    const { searchOptions } = this.props;
    const propertyCount = Object.keys(searchOptions.get('searchProperties', {})).length;
    return propertyCount > 0 ? `${propertyCount} ${propertyCount > 1 ? 'properties' : 'property'} selected` : 'Any property';
  }

  getCustomPropertiesControlPills() {
    const customProperties = this.props.searchOptions.get('searchProperties', {});
    const hasOrgDefinitions = Object.keys(this.state.properties).length;

    if (!hasOrgDefinitions) return;

    return (
      Object.entries(customProperties)
        .map(([key, value]) => {
          let label = key;
          const orgProperty = this.state.properties.data.find(data => data.attributes.key === key);

          if (orgProperty) {
            label = orgProperty.attributes.config_definition.label;
          }

          return (
            <ControlBox.Pill
              key={label}
              id={`custom-properties-${label}:${value}`}
              value={`${label}: ${value}`}
              onReset={() => {
                const { [key]: _deletedProperty, ...properties } = customProperties;
                this.onSelectOption('searchProperties')(properties);
              }}
            />
          );
        })
    );
  }

  render() {
    const { searchOptions, onSearchFilterChange, drawStructure, placeholder, disableOrgFilter } = this.props;
    const hasLabPermissions = FeatureStore.hasFeature(FeatureConstants.VIEW_LAB_COMPOUNDS);
    const labelCount = searchOptions.get('searchLabel', []).length;
    const organization = searchOptions.get('organization_id') ? OrganizationStore.getById(searchOptions.get('organization_id')) : undefined;

    const onLabelRemove = tag => {
      let labels = searchOptions.get('searchLabel');
      labels = labels.filter(label => label !== tag);
      return onSearchFilterChange(searchOptions.set('searchLabel', labels));
    };

    const smiles = searchOptions.get('searchSimilarity');
    const categories = [
      { name: 'All', value: 'all' },
      { name: 'Name', value: 'name' },
      { name: 'Reference Id', value: 'reference_id' },
      { name: 'ID', value: 'id' },
      { name: 'CAS Number', value: 'cas_number' },
      { name: 'External System ID', value: 'external_system_id' },
      { name: 'Library', value: 'library' },
    ];

    const getPlaceholder = ()  => {
      const selectedField = searchOptions.get('searchField');
      if (selectedField && selectedField !== 'all') {
        const selectedCategory =  _.find(categories, cat => cat.value === selectedField);
        return `Search by ${selectedCategory.name}`;
      }
      return placeholder;
    };

    return (
      <div className="compound-filters">
        <SearchFilterBar orientation="vertical" onReset={_ => this.props.onSearchFilterReset()}>
          <SearchFilterWrapper
            id="search"
            title="Search"
            alwaysOpen
            controlBoxPills={(
              <ControlBox.Pill
                id="compound-search"
                value={searchOptions.get('searchInput')}
                onReset={() => this.props.onSearchInputChange('')}
              />
            )}
          >
            <SearchField
              name="search-field"
              showCategories
              value={searchOptions.get('searchInput')}
              placeholder={getPlaceholder()}
              categories={categories.filter(cat => (cat.name === 'Library' ? FeatureStore.hasFeature(FeatureConstants.VIEW_LIBRARIES) : true))}
              reset={() => this.props.onSearchInputChange('')}
              nameCategories="search-category"
              currCategory={searchOptions.get('searchField')}
              onCategoryChange={e => this.onSelectOption('searchField')(e.target.value)}
              onChange={e => this.props.onSearchInputChange(e.target.value)}
            />
          </SearchFilterWrapper>
          <SearchFilterWrapper
            id="structure-similarity"
            title="Structure similarity"
            alwaysOpen
            controlBoxPills={smiles && (
              <ControlBox.Pill
                id="structure-similarity"
                value={smiles}
                onReset={() => this.onSelectOption('searchSimilarity')('')}
              />
            )}
          >
            { smiles ? (
              <div className="compound-filters__molecule-viewer">
                <MoleculeViewer
                  setFocus
                  editable
                  size="small"
                  SMILES={smiles}
                  onChange={this.onSelectOption('searchSimilarity')}
                  onExpand={drawStructure}
                />
              </div>
            )
              : (
                <SimilaritySearch
                  onSearchSimilarityChange={this.onSelectOption('searchSimilarity')}
                  drawStructure={drawStructure}
                />
              )}
          </SearchFilterWrapper>
          { hasLabPermissions && !disableOrgFilter && (
          <SearchFilterWrapper
            id="organization"
            title="Organization"
            previewText={organization ? organization.get('name') : 'Any organization'}
            controlBoxPills={organization && (
              <ControlBox.Pill
                id="compound-organization"
                value={organization.get('name')}
                onReset={() => this.onSelectOption('organization_id')()}
              />
            )}
          >
            <OrganizationTypeAhead
              organizationSelected={searchOptions.get('organization_id')}
              onOrganizationChange={this.onSelectOption('organization_id')}
            />
          </SearchFilterWrapper>
          )}
          <SearchRangeFilter
            id="weight"
            title="Weight"
            searchOptions={searchOptions.get('searchWeight', { min: '', max: '' })}
            onSearchInputChange={this.onSelectOption('searchWeight')}
            previewText={getNumericRangeText(searchOptions.get('searchWeight'))}
            renderControlBoxPill={(range) => `Weight: ${range}`}
          />
          <SearchRangeFilter
            id="tpsa"
            title="TPSA"
            searchOptions={searchOptions.get('searchTPSA', { min: '', max: '' })}
            onSearchInputChange={this.onSelectOption('searchTPSA')}
            previewText={getNumericRangeText(searchOptions.get('searchTPSA'))}
            disableTitleFormat
            renderControlBoxPill={(range) => `TPSA: ${range}`}
          />
          <SearchRangeFilter
            id="clogp"
            title="C LOGP"
            searchOptions={searchOptions.get('searchCLOGP', { min: '', max: '' })}
            onSearchInputChange={this.onSelectOption('searchCLOGP')}
            previewText={getNumericRangeText(searchOptions.get('searchCLOGP'))}
            disableTitleFormat
            renderControlBoxPill={(range) => `cLogP: ${range}`}
          />
          <SearchFilterWrapper
            id="labels"
            title="Labels"
            previewText={labelCount > 0 ? `${labelCount} ${labelCount > 1 ? 'labels' : 'label'} selected` : 'Any label'}
            controlBoxPills={
              searchOptions.get('searchLabel', []).map((label) => (
                <ControlBox.Pill
                  key={label}
                  id={`compound-labels-${label}`}
                  value={label}
                  onReset={() => onLabelRemove(label)}
                />
              ))
            }
          >
            <CompoundsTagInput
              onCreate={this.onSelectOption('searchLabel')}
              onRemove={tag => onLabelRemove(tag)}
              tags={searchOptions.get('searchLabel', [])}
            />
          </SearchFilterWrapper>
          <SearchFilter
            id="container-status"
            title="Container status"
            options={ContainerStatusOptions}
            currentSelection={searchOptions.get('searchContainerStatus', 'all')}
            onSelectOption={this.onSelectOption('searchContainerStatus')}
            wide
          />
          <SearchFilter
            id="creator"
            title="Creator"
            options={CreatorOptions}
            currentSelection={searchOptions.get('searchCreator', 'me')}
            onSelectOption={this.onSelectOption('searchCreator')}
            wide
          />
          { this.props.showSource && (
            <SearchFilter
              id="source"
              title="Source"
              options={SourceOptions}
              currentSelection={searchOptions.get('searchSource', 'all')}
              onSelectOption={this.onSelectOption('searchSource')}
              wide
            />
          )}
          <SearchFilter
            id="hazard"
            name="CompoundHazard"
            title="Hazard"
            options={HazardOptions}
            currentSelection={searchOptions.get('searchHazard', [])}
            onSelectOption={this.onSelectOption('searchHazard')}
            isMultiSelect
            wide
          />
          {(((hasLabPermissions && searchOptions.get('organization_id')) || !hasLabPermissions) && (
            <SearchFilterWrapper
              id="custom-properties"
              title="Custom properties"
              previewText={this.getCustomPropertiesPreview()}
              controlBoxPills={this.getCustomPropertiesControlPills()}
            >
              <SearchFilterCustomProperties
                properties={this.state.properties}
                currentProperties={searchOptions.get('searchProperties')}
                onSelectProperties={this.onSelectOption('searchProperties')}
              />
            </SearchFilterWrapper>
          ))}
        </SearchFilterBar>
      </div>
    );
  }
}

CompoundSearchFilters.propTypes = {
  searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
  drawStructure: PropTypes.func,
  onSearchSimilarityChange: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  showSource: PropTypes.bool,
  disableOrgFilter: PropTypes.bool
};

CompoundSearchFilters.defaultProps = {
  showSource: true
};

export default CompoundSearchFilters;
