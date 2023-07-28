import React, { useEffect, useRef } from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { inflect } from 'inflection';
import Moment from 'moment';
import FeatureConstants from '@strateos/features';
import { ActionMenu, MoleculeViewer, SearchDateFilter, SearchField, SearchFilter, SearchFilterBar, SearchRangeFilter,
  SearchFilterWrapper, ControlBox, Button, RadioGroup, Radio, Toggle } from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';
import { HazardOptions, ContainerStatusOptions } from 'main/pages/SharedFiltersValues';
import FeatureStore from 'main/stores/FeatureStore';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import SessionStore from 'main/stores/SessionStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import LocationStore from 'main/stores/LocationStore';
import SearchFilterProperties from 'main/components/SearchFilterProperties/SearchFilterProperties';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import CompoundSearch from 'main/pages/CompoundsPage/CompoundsSimilaritySearch';
import { getNumericRangeText } from 'main/util/MeasurementUtil';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LocationSelectorModal from 'main/models/LocationSelectorModal/LocationSelectorModal';
import BulkSearchLookupModal from './BulkSearchLookupModal';
import OrganizationTypeAhead from './OrganizationFilter';

import './ContainerSearchFilters.scss';

const BULK_SEARCH_FIELDS = [
  { text: 'Search Barcode', name: 'barcode', value: 'barcode', icon: 'fa-thin fa-barcode' },
  { text: 'Search ID', name: 'id', value: 'id', icon: 'fa-thin fa-input-numeric' },
  { text: 'Search Name', name: 'name', value: 'label', icon: 'fa-thin fa-input-text' }
];

function ContainerSearchFilters({
  searchOptions,
  onSearchFilterChange,
  showStatusFilter,
  orientation,
  testMode,
  showOrgFilter,
  drawStructure,
  onSearchSmileChange,
  onSearchInputChange,
  onSearchFilterReset,
  onSelectionAcrossPagesChange,
  defaultFilters
}) {
  const [properties, setProperties] = React.useState({});
  const [aliquotCustomProperties, setAliquotCustomProperties] = React.useState({});
  const [createdAfter, setCreatedAfter] = React.useState(
    searchOptions.get('createdAfter') ? Moment(searchOptions.get('createdAfter')).toDate() : null);
  const [createdBefore, setCreatedBefore] = React.useState(
    searchOptions.get('createdBefore') ? Moment(searchOptions.get('createdBefore')).toDate() : null);
  const [deepLocationEnabled, setDeepLocationEnabled] = React.useState(false);
  const [bulkSearchField, setBulkSearchField] = React.useState({ name: '', value: '' });
  const hasLabPermissions = FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINERS_IN_LAB);
  const hasCompoundPermissions = FeatureStore.hasFeature(FeatureConstants.VIEW_COMPOUNDS)
    || FeatureStore.hasFeature(FeatureConstants.VIEW_LAB_COMPOUNDS);
  const organization = searchOptions.get('organization_id') ? OrganizationStore.getById(searchOptions.get('organization_id')) : undefined;

  const refSearchOptions = useRef(searchOptions);
  useEffect(() => {
    refSearchOptions.current = searchOptions;
  }, [searchOptions]);

  // the firstMount is present here to persist the values even when it's returned from the container page.
  const firstMount = React.useRef(false);
  useEffect(() => {
    firstMount.current = true;
  }, []);

  useEffect(() => {
    const orgId = orgFilterForContextualProperties();
    if (orgId) {
      ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'Container').then(resp => {
        resp.searchProperties = { ...searchOptions.get('searchCustomProperties').toJS() };
        if (resp) {
          setProperties(resp);
        }
      });
      ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'Aliquot').then(resp => {
        resp.searchProperties = { ...searchOptions.get('searchAliquotCustomProperties').toJS() };
        if (resp) {
          setAliquotCustomProperties(resp);
        }
      });
    }

    if (!firstMount.current) {
      onSearchFilterChange(Immutable.fromJS({ ...searchOptions.toJS(), searchAliquotCustomProperties: { }, searchCustomProperties: { } }), testMode);
    }
    firstMount.current = false;

  }, [searchOptions.get('organization_id')]);

  useEffect(() => {
    const createdAfterCached = searchOptions.get('createdAfter');
    const createdBeforeCached = searchOptions.get('createdBefore');
    if (!createdAfterCached && !createdBeforeCached) {
      setCreatedAfter(null);
      setCreatedBefore(null);
    }
  }, [searchOptions.get('createdAfter'), searchOptions.get('createdBefore')]);

  const onSelectOption = (option) => {
    return v => {
      if (option === 'searchSmiles') {
        return onSearchSmileChange(v);
      }
      return onSearchFilterChange(refSearchOptions.current.set(option, v), testMode);
    };
  };

  const onToggleChange = (toggleValue, option, stateAttribute) => {
    const toStateValue = toggleValue === 'on' ? [stateAttribute] : [];
    onSearchFilterChange(refSearchOptions.current.set(option, Immutable.fromJS(toStateValue)), testMode);
  };

  const isLabConsumerOfOrg = () => {
    const labConsumers = LabConsumerStore.getAll();
    return labConsumers.some(element => {
      return element.getIn(['organization', 'id']) === SessionStore.getOrg().get('id');
    });
  };

  const orgFilterForContextualProperties = () => {
    let orgId;
    if (hasLabPermissions && showOrgFilter) {
      orgId = searchOptions.get('organization_id') != 'all' ? searchOptions.get('organization_id') : undefined;
    } else if (isLabConsumerOfOrg()) {
      orgId = SessionStore.getOrg().get('id');
    }
    return orgId;
  };

  const getContainerStatusOptions = () => {
    if (hasLabPermissions) {
      return ContainerStatusOptions;
    } else {
      return ContainerStatusOptions.filter(data => data.queryTerm !== 'consumable');
    }
  };

  const onFilterByBulkSearch = (containerIds) => {
    (containerIds.size) && onSearchFilterChange(searchOptions.update('bulkSearch', (bulkSearch) =>  bulkSearch.push({
      field: bulkSearchField.value,
      container_ids: containerIds
    })));
  };

  const originOptions =  [
    {
      queryTerm: '*',
      display: 'All',
      allOption: true
    },
    {
      queryTerm: 'shipped',
      display: 'Shipment'
    },
    {
      queryTerm: 'generated',
      display: 'Run'
    }
  ];

  const selectedItemsPreviewText = size => `${size} ${inflect('item', size)} selected`;

  const getOriginOptions = () => {
    if (hasLabPermissions) {
      originOptions.push(
        {
          queryTerm: 'materials',
          display: 'Material'
        }
      );
      return originOptions;
    } else {
      return originOptions;
    }
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setCreatedAfter(startDate);
    setCreatedBefore(endDate);
    const updatedOptions = searchOptions.set('createdAfter', startDate).set('createdBefore', endDate);
    return onSearchFilterChange(updatedOptions, testMode);
  };

  const handleLocationSelected = (locationId) => {
    const selectedLocations = searchOptions.get('searchLocation');
    const location = LocationStore.getById(locationId);
    if (location) {
      const locationIdx = selectedLocations.findIndex(location => location.get('id') === locationId);
      if (locationIdx > -1) {
        onSelectOption('searchLocation')(
          selectedLocations.setIn([locationIdx, 'includeDeep'], deepLocationEnabled)
        );
      } else {
        onSelectOption('searchLocation')(
          selectedLocations.push(location.merge({ includeDeep: deepLocationEnabled }))
        );
      }
    }
  };

  const getPropertiesPreview = (properties, customProperties) => {
    const propertyCount = properties.size + customProperties.size;
    return propertyCount > 0 ? `${propertyCount} ${propertyCount > 1 ? 'properties' : 'property'} selected` : 'Any property';
  };

  const renderPropertyPills = (propertyKey, orgSpecProperties) => {
    const isCustomProperty = !!orgSpecProperties;
    const hasOrgDefinitions = Object.keys(orgSpecProperties || {}).length;

    if (isCustomProperty && !hasOrgDefinitions) return [];

    return Object.entries(searchOptions.get(propertyKey).toJS())
      .map(([key, value]) => {
        let label = key;
        if (hasOrgDefinitions) {
          const orgProperty = orgSpecProperties.data.find(data => data.attributes.key === key);
          if (orgProperty) {
            label = orgProperty.attributes.config_definition.label;
          }
        }

        return (
          <ControlBox.Pill
            key={label}
            id={`${propertyKey}-${label}:${value}`}
            value={`${label}: ${value}`}
            onReset={() => {
              const properties = searchOptions.get(propertyKey).delete(key);
              onSelectOption(propertyKey)(properties);
            }}
          />
        );
      });
  };

  const renderContainerPropertiesFilter = () => {
    return (
      <SearchFilterWrapper
        id="container-properties"
        title="Container properties"
        horizontal="vertical"
        previewText={getPropertiesPreview(searchOptions.get('searchContainerProperties'), searchOptions.get('searchCustomProperties'))}
        controlBoxPills={[
          ...renderPropertyPills('searchContainerProperties'),
          ...renderPropertyPills('searchCustomProperties', properties)
        ]}
      >
        <SearchFilterProperties
          currentProperties={searchOptions.get('searchContainerProperties').toJS()}
          onSelectProperties={onSelectOption('searchContainerProperties')}
          showOrgProperties={showOrgProperties}
          orgSpecProperties={properties}
          orgSpecCurrentProperties={searchOptions.get('searchCustomProperties').toJS()}
          orgSpecOnSelectProperties={onSelectOption('searchCustomProperties')}
        />
      </SearchFilterWrapper>
    );
  };

  const renderAliquotPropertiesFilter = () => {
    return (
      <SearchFilterWrapper
        id="aliquot-properties"
        title="Aliquot properties"
        horizontal="vertical"
        previewText={getPropertiesPreview(searchOptions.get('searchAliquotProperties'), searchOptions.get('searchAliquotCustomProperties'))}
        controlBoxPills={[
          ...renderPropertyPills('searchAliquotProperties'),
          ...renderPropertyPills('searchAliquotCustomProperties', aliquotCustomProperties)
        ]}
      >
        <SearchFilterProperties
          currentProperties={searchOptions.get('searchAliquotProperties').toJS()}
          onSelectProperties={onSelectOption('searchAliquotProperties')}
          showOrgProperties={showOrgProperties}
          orgSpecProperties={aliquotCustomProperties}
          orgSpecCurrentProperties={searchOptions.get('searchAliquotCustomProperties').toJS()}
          orgSpecOnSelectProperties={onSelectOption('searchAliquotCustomProperties')}
        />
      </SearchFilterWrapper>
    );
  };

  const renderContainerTypePills = () => {
    let wellCountPill = null;
    if (defaultFilters && defaultFilters.containerTypeWellCount) {
      wellCountPill = <ControlBox.Pill value={`Well count: ${defaultFilters.containerTypeWellCount}`} />;
    }
    const containerTypes = searchOptions.get('searchContainerType', Immutable.List()).toJS();

    return ([
      wellCountPill,
      containerTypes.map(containerType => {
        const selectedContainerType = (containerType === 'plates' || containerType === 'tubes') ? Immutable.fromJS({ name: `All ${_.capitalize(containerType)}` }) : ContainerTypeStore.getById(containerType);

        return (
          <ControlBox.Pill
            key={selectedContainerType && selectedContainerType.get('name')}
            id={selectedContainerType && selectedContainerType.get('name')}
            value={selectedContainerType && selectedContainerType.get('name')}
            onReset={() => {
              const filteredContainerTypes = containerTypes.filter((option) => option !== containerType);
              onSelectOption('searchContainerType')(filteredContainerTypes);
            }}
          />
        );
      })
    ]);
  };

  const bulkSearchPills = () => {
    const bulkContainerSearches = searchOptions.get('bulkSearch', Immutable.List()).toJS();
    return (
      bulkContainerSearches.map((bulkSearch, index) => {
        const containersSize = _.uniq(bulkSearch.container_ids).length;
        const pillDisplayText = `${containersSize} ${inflect('container', containersSize)}`;

        return (
          <ControlBox.Pill
            key={'bulk-search-key' + index}
            id={'bulk-search-' + index}
            value={pillDisplayText}
            onReset={() => {
              onSearchFilterChange(searchOptions.set('bulkSearch', searchOptions.get('bulkSearch').remove(index)));
            }}
          />
        );
      })
    );
  };

  const renderLocationPills = () => {
    const locations = searchOptions.get('searchLocation');

    if (locations.size > 5) {
      return (
        <ControlBox.Pill
          id="container-location-many"
          value="Many locations"
          onReset={() => onSelectOption('searchLocation')(Immutable.List())}
        />
      );
    }

    return (
      locations.map((location) => {
        return (
          <ControlBox.Pill
            key={location.get('id')}
            id={location.get('id')}
            value={location.get('name') + (location.get('includeDeep') ? ' + All nested' : '')}
            onReset={() => {
              onSelectOption('searchLocation')(
                searchOptions.get('searchLocation').filter((loc) => loc.get('id') !== location.get('id'))
              );
            }}
          />
        );
      }).toJS()
    );
  };
  const smiles = searchOptions.get('searchSmiles', '');
  const showOrgProperties = !!orgFilterForContextualProperties();

  const categories = [
    { name: 'All', value: 'all' },
    { name: 'ID', value: 'id' },
    { name: 'Name', value: 'label' },
    { name: 'Barcode', value: 'barcode' },
  ];

  const getPlaceholder = () => {
    const selectedField = searchOptions.get('searchField');
    if (selectedField && selectedField !== 'all') {
      const selectedCategory = _.find(categories, cat => cat.value === selectedField);
      return `Search by ${selectedCategory.name}`;
    } else {
      return 'Search by ID, Name or Barcode';
    }
  };

  const shouldDisplayAllTypeOptions = () => {
    if (defaultFilters && defaultFilters.containerTypeWellCount) {
      return false;
    }
    return true;
  };

  return (
    <SearchFilterBar
      orientation={orientation}
      onReset={() => {
        onSearchFilterReset();
      }
    }
    >
      <SearchFilterWrapper
        id="search"
        title="Search"
        alwaysOpen
        orientation="horizontal"
        controlBoxPills={(
          <ControlBox.Pill
            id="container-search"
            value={searchOptions.get('searchInput')}
            onReset={() => onSearchInputChange('')}
          />
        )}
      >
        <SearchField
          onChange={e => onSearchInputChange(e.target.value)}
          value={searchOptions.get('searchInput')}
          placeholder={getPlaceholder()}
          searchType=""
          showCategories
          categories={categories}
          nameCategories="search-category"
          currCategory={searchOptions.get('searchField')}
          onCategoryChange={e => searchOptions.get('searchField') !== e.target.value && onSelectOption('searchField')(e.target.value)}
        />
      </SearchFilterWrapper>
      {hasCompoundPermissions && (
        <SearchFilterWrapper
          id="structure"
          title="Structure"
          alwaysOpen
          controlBoxPills={smiles && (
            <ControlBox.Pill
              id="container-structure"
              value={smiles}
              onReset={() => onSelectOption('searchSmiles')('')}
            />
          )}
        >
          { smiles ? (
            <div className="container-filters__molecule-viewer">
              <MoleculeViewer
                setFocus
                editable
                size="small"
                SMILES={smiles}
                onChange={onSelectOption('searchSmiles')}
                onExpand={drawStructure}
              />
            </div>
          )
            : (
              <CompoundSearch
                onSearchSimilarityChange={onSelectOption('searchSmiles')}
                drawStructure={drawStructure}
              />
            )}
        </SearchFilterWrapper>
      )}
      <SearchFilterWrapper
        id="refine-search"
        title="Refine search"
        previewText={selectedItemsPreviewText(searchOptions.get('unusedContainers').size + searchOptions.get('generatedContainers').size)}
        controlBoxPills={([
          searchOptions.get('unusedContainers').size > 0 && (
            <ControlBox.Pill
              id="unused-containers"
              value="Show unused"
              onReset={() => onToggleChange('off', 'unusedContainers', 'showUnusedContainers')}
            />
          ),
          searchOptions.get('generatedContainers').size > 0 && (
            <ControlBox.Pill
              id="generated-containers"
              value="Hide pending"
              onReset={() => onToggleChange('off', 'generatedContainers', 'hidePendingContainers')}
            />
          )
        ])}
      >
        <Toggle
          name="unused-containers"
          label="Show only unused containers"
          value={searchOptions.get('unusedContainers').size === 0 ? 'off' : 'on'}
          onChange={event => onToggleChange(event.target.value, 'unusedContainers', 'showUnusedContainers')}
        />
        <Toggle
          name="generated-containers"
          label="Hide all pending containers"
          value={searchOptions.get('generatedContainers').size === 0 ? 'off' : 'on'}
          onChange={event => onToggleChange(event.target.value, 'generatedContainers', 'hidePendingContainers')}
        />
      </SearchFilterWrapper>
      <SearchFilterWrapper
        id="buik-search"
        title="Bulk Search"
        alwaysOpen
        controlBoxPills={bulkSearchPills()}
      >
        <BulkSearchLookupModal
          onApplyFilter={onFilterByBulkSearch}
          searchField={bulkSearchField}
          searchOptions={searchOptions}
        />
        <ActionMenu
          kabob={false}
          horizontal
          options={BULK_SEARCH_FIELDS.map((field) => ({
            text: field.text,
            icon: field.icon,
            onClick: () => {
              setBulkSearchField(_.pick(field, ['name', 'value']));
              ModalActions.open(BulkSearchLookupModal.MODAL_ID);
            },
          }))}
        >
          <Button
            type="secondary"
            size="medium"
            height="short"
            icon="fa-thin fa-caret-down"
            iconPlacement="right"
          >
            Bulk container search
          </Button>
        </ActionMenu>
      </SearchFilterWrapper>
      {(hasLabPermissions && showOrgFilter) && (
        <SearchFilterWrapper
          id="organization"
          title="Organization"
          previewText={organization ? organization.get('name') : 'Any organization'}
          controlBoxPills={organization && (
          <ControlBox.Pill
            id="container-organization"
            value={organization.get('name')}
            onReset={() => onSelectOption('organization_id')()}
          />
          )}
        >
          <OrganizationTypeAhead
            onOrganizationChange={onSelectOption('organization_id')}
            organizationSelected={searchOptions.get('organization_id')}
          />
        </SearchFilterWrapper>
      )}
      <SearchDateFilter
        id="date-created"
        title="Date created"
        date={createdAfter}
        endDate={createdBefore}
        onSelect={handleDateChange}
        isRangeSelector
      />
      {showStatusFilter && (
        <SearchFilter
          id="status"
          title="Status"
          options={getContainerStatusOptions()}
          currentSelection={searchOptions.get('searchStatus')}
          onSelectOption={onSelectOption('searchStatus')}
        />
      )}
      <SearchFilterWrapper
        id="container-type"
        title="Container type"
        previewText={searchOptions.get('searchContainerType') && selectedItemsPreviewText(searchOptions.get('searchContainerType').size)}
        controlBoxPills={renderContainerTypePills()}
      >
        <ContainerTypeSelector
          isMultiSelect
          value={searchOptions.get('searchContainerType', Immutable.List()).toJS()}
          isSearchEnabled
          isDisplayTypeOptions={shouldDisplayAllTypeOptions()}
          onChange={(e) => {
            onSearchFilterChange(searchOptions.set('searchContainerType', e.target.value), testMode);
          }}
          includeRetiredContainerTypes
          wellCount={defaultFilters && defaultFilters.containerTypeWellCount}
        />
      </SearchFilterWrapper>
      <SearchFilter
        id="aliquot-volume"
        title="Aliquot volume"
        options={[
          {
            queryTerm: '*',
            display: 'Any volume',
            allOption: true
          },
          {
            queryTerm: { lt: 15 },
            display: <span>&lt; 15&micro;L</span>
          },
          {
            queryTerm: { gt: 14, lt: 101 },
            display: <span>15&micro;L - 100&micro;L</span>
          },
          {
            queryTerm: { gt: 99, lt: 1001 },
            display: <span>100&micro;L - 1000&micro;L</span>
          },
          {
            queryTerm: { gt: 1000 },
            display: <span>&gt; 1000&micro;L</span>
          }
        ]}
        currentSelection={
          searchOptions.get('searchVolume') === '*' ?
            searchOptions.get('searchVolume') :
            searchOptions.get('searchVolume', Immutable.Map()).toJS()
        }
        onSelectOption={onSelectOption('searchVolume')}
      />
      <SearchFilter
        id="origin"
        title="Origin"
        options={getOriginOptions()}
        currentSelection={searchOptions.get('searchGeneration')}
        onSelectOption={onSelectOption('searchGeneration')}
      />
      <SearchFilter
        id="storage-condition"
        title="Storage condition"
        options={[
          {
            queryTerm: 'all',
            display: 'All storage',
            allOption: true
          },
          {
            queryTerm: 'ambient',
            display: 'Ambient (22 ± 2 °C)'
          },
          {
            queryTerm: 'cold_4',
            display: '4 °C (± 1 °C)'
          },
          {
            queryTerm: 'cold_20',
            display: '–20 °C (± 1 °C)'
          },
          {
            queryTerm: 'cold_80',
            display: '-80 °C (± 1 °C)'
          },
          {
            queryTerm: 'cold_196',
            display: '-196 °C (± 1 °C)'
          }
        ]}
        currentSelection={searchOptions.get(
          'searchStorageCondition'
        )}
        onSelectOption={onSelectOption('searchStorageCondition')}
      />
      <SearchFilter
        id="creator"
        title="Creator"
        options={[
          {
            queryTerm: 'all',
            display: 'All',
            allOption: true
          },
          {
            queryTerm: 'me',
            display: 'Only me'
          }
        ]}
        currentSelection={searchOptions.get('createdBy')}
        onSelectOption={onSelectOption('createdBy')}
      />
      {renderContainerPropertiesFilter()}
      {renderAliquotPropertiesFilter()}
      {hasLabPermissions && (
        <SearchFilterWrapper
          id="locations"
          title="Locations"
          previewText={
            searchOptions.get('searchLocation').size ?
              selectedItemsPreviewText(searchOptions.get('searchLocation').size) :
              'All locations'
          }
          controlBoxPills={renderLocationPills()}
        >
          <div className="tx-stack tx-stack--sm">
            <Button
              height="short"
              onClick={() => {
                ModalActions.open(LocationSelectorModal.MODAL_ID);
              }}
            >
              {searchOptions.get('searchLocation').size ? 'Add location' : 'Select location'}
            </Button>
            <RadioGroup
              name="search-location-include-deep-toggle"
              value={deepLocationEnabled ? 'enable' : 'disable'}
              onChange={(event) => {
                setDeepLocationEnabled(event.target.value === 'enable');
                onSelectionAcrossPagesChange(false, 0, true);
              }}
            >
              <Radio label="Selected location only" id="disable" value="disable" name="disable" onChange={() => {}} />
              <Radio label="Selected location and all nested locations" id="enable" value="enable" name="enable" onChange={() => {}} />
            </RadioGroup>
            <LocationSelectorModal
              isSelectDeep={deepLocationEnabled}
              onLocationSelected={handleLocationSelected}
            />
          </div>
        </SearchFilterWrapper>
      )}
      {hasLabPermissions && (
        <SearchFilter
          id="hazards"
          title="Hazard"
          name="ContainerHazard"
          options={HazardOptions}
          currentSelection={searchOptions.get('searchHazard', Immutable.List()).toJS()}
          onSelectOption={onSelectOption('searchHazard')}
          isMultiSelect
        />
      )}
      {hasLabPermissions && (
        <SearchRangeFilter
          id="empty-mass"
          title="Empty mass"
          searchOptions={searchOptions.get('searchEmptyMass', Immutable.Map({ min: '', max: '' })).toJS()}
          onSearchInputChange={onSelectOption('searchEmptyMass')}
          lowerBoundPlaceholder="Min"
          upperBoundPlaceholder="Max"
          previewText={getNumericRangeText(
            searchOptions.get('searchEmptyMass', Immutable.Map({ min: '', max: '' })).toJS()
          )}
          renderControlBoxPill={(range) => `Empty mass: ${range}`}
        />
      )}

    </SearchFilterBar>
  );
}

ContainerSearchFilters.propTypes = {
  onSearchFilterChange: PropTypes.func.isRequired,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  showStatusFilter: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  testMode: PropTypes.bool,
  showOrgFilter: PropTypes.bool,
  drawStructure: PropTypes.func,
  onSearchSmileChange: PropTypes.func,
  onSelectionAcrossPagesChange: PropTypes.func
};

export default ContainerSearchFilters;
