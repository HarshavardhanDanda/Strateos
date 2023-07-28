import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { SearchFilter, SearchFilterBar, SearchFilterWrapper, SearchField, ControlBox } from '@transcriptic/amino';

class ResourcesSearchFilters extends React.Component {
  onSelectOption(field) {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = this.props;
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  render() {
    const { searchOptions, orientation } = this.props;

    return (
      <SearchFilterBar orientation={orientation} onReset={_ => this.props.onSearchFilterReset()}>
        <SearchFilterWrapper
          id="search"
          title="Search"
          alwaysOpen
          controlBoxPills={(
            <ControlBox.Pill
              id="resource-search"
              value={searchOptions.get('searchInput')}
              onReset={() => this.props.onSearchInputChange('')}
            />
          )}
        >
          <SearchField
            onChange={e => this.props.onSearchInputChange(e.target.value)}
            value={searchOptions.get('searchInput')}
            searchType=""
          />
        </SearchFilterWrapper>
        <If condition={this.props.showKindFilter}>
          <SearchFilter
            id="kind"
            title="Kind"
            options={[
              {
                queryTerm: 'all',
                display: 'All types',
                allOption: true
              },
              {
                queryTerm: 'ChemicalStructure',
                display: 'Chemical structure'
              },
              {
                queryTerm: 'Reagent',
                display: 'Reagent'
              },
              {
                queryTerm: 'Protein',
                display: 'Protein'
              },
              {
                queryTerm: 'Virus',
                display: 'Virus'
              },
              {
                queryTerm: 'NucleicAcid',
                display: 'Nucleic acid'
              },
              {
                queryTerm: 'Cell',
                display: 'Cell'
              }
            ]}
            currentSelection={searchOptions.get('searchKind')}
            onSelectOption={this.onSelectOption('searchKind')}
            wide
          />
        </If>
        <SearchFilter
          id="storage"
          title="Storage"
          options={[
            {
              queryTerm: 'all',
              display: 'All conditions',
              allOption: true
            },
            {
              queryTerm: 'ambient',
              display: 'Ambient'
            },
            {
              queryTerm: 'cold_4',
              display: 'Cold_4'
            },
            {
              queryTerm: 'cold_20',
              display: 'Cold_20'
            },
            {
              queryTerm: 'cold_80',
              display: 'Cold_80'
            }
          ]}
          currentSelection={searchOptions.get(
            'searchStorageCondition'
          )}
          onSelectOption={this.onSelectOption('searchStorageCondition')}
          wide
        />
      </SearchFilterBar>
    );
  }
}

ResourcesSearchFilters.propTypes = {
  onSearchFilterChange: PropTypes.func,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  showKindFilter: PropTypes.bool
};

ResourcesSearchFilters.defaultProps = {
  orientation: 'vertical',
  showKindFilter: true
};

export default ResourcesSearchFilters;
