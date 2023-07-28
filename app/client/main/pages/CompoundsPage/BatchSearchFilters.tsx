import React, { useRef } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import { CreatorOptions } from 'main/pages/SharedFiltersValues';
import { formatValue, getValueAndUnit } from 'main/util/unit.js';
import { SearchFilterBar, SearchFilterWrapper, SearchField,
  SearchFilter, ControlBox, MoleculeViewer, SearchRangeFilter } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import SimilaritySearch from './CompoundsSimilaritySearch';
import StructureSearchModal from './StructureSearchModal';
import './BatchSearchFilters.scss';
import SynthesisTypeAhead from './SynthesisTypeAhead';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchOptions: Immutable.Map<string, any>,
  onSearchFilterChange?: Function,
  onSearchInputChange?: Function,
  onSearchFilterReset?: Function,
  onSearchSimilarityChange?: Function
}

function BatchSearchFilters(props:Props) {
  const { searchOptions, onSearchSimilarityChange } = props;

  const propsRef = useRef(null);
  propsRef.current = props;

  const onSelectOption = (field) => {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = propsRef.current;
      if (field === 'searchSimilarity') return onSearchSimilarityChange(value);
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  };

  const categories = [
    { name: 'All', value: 'all' },
    { name: 'ID', value: 'id' },
    { name: 'Name', value: 'name' }
  ];
  const smiles = searchOptions.get('searchSimilarity');

  const canManageBatch = FeatureStore.hasFeature(
    FeatureConstants.MANAGE_BATCHES_IN_LAB
  );

  const getPlaceholder = ()  => {
    const selectedField = searchOptions.get('searchField');
    if (selectedField && selectedField !== 'all') {
      const selectedCategory =  _.find(categories, cat => cat.value === selectedField);
      return `Search by ${selectedCategory.name}`;
    }
    return 'Search By ID or Name';
  };

  const displayPreviewText = (filterType: 'searchPurity' | 'searchMassYield') => {
    const { min, max } = searchOptions.get(filterType);
    const minValue = getValueAndUnit(min)[0];
    const maxValue = getValueAndUnit(max)[0];
    let value = 'Any';
    if (minValue && maxValue) {
      value = `${formatValue(min)}-${formatValue(max)}`;
    } else if (minValue) {
      value = `>= ${formatValue(min)}`;
    } else if (maxValue) {
      value = `<= ${formatValue(max)}`;
    }
    return value;
  };

  return (
    <SearchFilterBar orientation="vertical" onReset={_ => props.onSearchFilterReset()}>
      <SearchFilterWrapper
        id="search"
        title="Search"
        alwaysOpen
        controlBoxPills={(
          <ControlBox.Pill
            id="batch-search"
            value={searchOptions.get('searchInput')}
            onReset={() => props.onSearchInputChange('')}
          />
          )}
      >
        <SearchField
          onChange={e => props.onSearchInputChange(e.target.value)}
          showCategories
          value={searchOptions.get('searchInput')}
          categories={categories}
          placeholder={getPlaceholder()}
          searchType=""
          reset={() => props.onSearchInputChange('')}
          nameCategories="search-category"
          currCategory={searchOptions.get('searchField')}
          onCategoryChange={(e, searchField) => onSelectOption('searchField')(searchField.value)}
        />
      </SearchFilterWrapper>
      {
        canManageBatch && (
          <SearchFilter
            id="creator"
            title="Creator"
            options={CreatorOptions}
            currentSelection={searchOptions.get('searchCreator', 'all')}
            onSelectOption={onSelectOption('searchCreator')}
            wide
          />
        )
      }
      <StructureSearchModal
        SMILES={searchOptions.get('searchSimilarity')}
        onSave={value => onSearchSimilarityChange(value)}
      />
      <SearchFilterWrapper
        id="structure-similarity"
        title="Structure similarity"
        alwaysOpen
        controlBoxPills={smiles && (
          <ControlBox.Pill
            id="structure-similarity"
            value={smiles}
            onReset={() => onSelectOption('searchSimilarity')('')}
          />
        )}
      >
        { smiles ? (
          <div className="batch-filters__molecule-viewer">
            <MoleculeViewer
              setFocus
              editable
              size="small"
              SMILES={smiles}
              onChange={onSelectOption('searchSimilarity')}
              onExpand={() => ModalActions.open(StructureSearchModal.MODAL_ID)}
            />
          </div>
        )
          : (
            <SimilaritySearch
              onSearchSimilarityChange={onSelectOption('searchSimilarity')}
              drawStructure={() => ModalActions.open(StructureSearchModal.MODAL_ID)}
            />
          )}
      </SearchFilterWrapper>
      <SearchFilterWrapper
        id="synthesis-program"
        title="Synthesis Program"
        previewText={searchOptions.get('synthesisProgram').name || 'Any'}
        controlBoxPills={(
          <ControlBox.Pill
            id="batch-synthesis-program"
            value={searchOptions.get('synthesisProgram').name}
            onReset={() => {
              onSelectOption('synthesisProgram')({ id: '', name: '' });
            }}
          />
          )}
      >
        <SynthesisTypeAhead
          onChange={onSelectOption('synthesisProgram')}
          synthesisIdSelected={searchOptions.get('synthesisProgram').id}
          entityType={'synthesis-program'}
        />
      </SearchFilterWrapper>
      <SearchFilterWrapper
        id="synthesis-request"
        title="Synthesis request"
        previewText={searchOptions.get('synthesisRequest').name || 'Any'}
        controlBoxPills={(
          <ControlBox.Pill
            id="batch-synthesis-request"
            value={searchOptions.get('synthesisRequest').name}
            onReset={() => {
              onSelectOption('synthesisRequest')({ id: '', name: '' });
            }
            }
          />
          )}
      >
        <SynthesisTypeAhead
          onChange={onSelectOption('synthesisRequest')}
          synthesisIdSelected={searchOptions.get('synthesisRequest').id}
          entityType={'synthesis-request'}
        />
      </SearchFilterWrapper>
      <SearchRangeFilter
        id="batch-purity"
        title="Purity"
        searchOptions={searchOptions.get('searchPurity', { min: '', max: '', hasError: false })}
        onSearchInputChange={onSelectOption('searchPurity')}
        previewText={displayPreviewText('searchPurity')}
        disableTitleFormat
        renderControlBoxPill={(range) => range && `Purity: ${range}`}
        dimension="symbol"
        symbol="%"
        min={0}
        max={100}
      />
      <SearchRangeFilter
        id="mass-yield"
        title="mass yield"
        searchOptions={searchOptions.get('searchMassYield', { min: '', max: '', hasError: false })}
        onSearchInputChange={onSelectOption('searchMassYield')}
        previewText={displayPreviewText('searchMassYield')}
        renderControlBoxPill={(range) => range && `MassYield: ${range}`}
        min={'0:milligram'}
        dimension="mass"
        defaultUnit="milligram"
      />
    </SearchFilterBar>
  );
}

export default BatchSearchFilters;
