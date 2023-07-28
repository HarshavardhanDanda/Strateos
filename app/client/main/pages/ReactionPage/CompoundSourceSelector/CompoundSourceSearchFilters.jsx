import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  SearchField, SearchFilter,
  SearchFilterBar, TypeAheadInput, SearchFilterWrapper, ControlBox
} from '@transcriptic/amino';
import Immutable from 'immutable';
import { ContainerSearchDefaults, EMoleculesStateDefaults, MaterialSearchDefaults } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import SupplierActions from 'main/actions/SupplierActions';
import SupplierStore from 'main/stores/SupplierStore';

import './CompoundSourceSearchFilters.scss';

class CompoundSourceSearchFilters extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      supplierQueryText: '',
      supplierSuggestions: [],
      supplierOptions: [],
      flattenedSupplierOptions: [],
      eMoleculeSupplierQueryText: '',
      eMoleculeSupplierSelected: [],
      eMoleculeSupplierOptions: [],
      eMoleculesAllSuppliers: [],
      eMoleculesSupplierSuggestions: []
    };
    this.supplierSuggest = this.supplierSuggest.bind(this);
    this.eMoleculeSupplierSuggest = this.eMoleculeSupplierSuggest.bind(this);
    this.debounceFetchSuppliers = _.debounce(this.fetchSupplierSuggestions, 250).bind(this);
  }

  componentWillMount() {
    this.loadDefaultSuppliers();
  }

  loadDefaultSuppliers() {
    const defaultSuppliers = SupplierStore.getAll().toJS().filter((supplier) => supplier.is_preferred === true);
    const supplierOptions = defaultSuppliers.map((supplier) => {
      return { queryTerm: supplier.name,
        display: supplier.name };
    });
    const flattenedSupplierOptions = defaultSuppliers.map((supplier) => supplier.name);
    this.setState({ supplierOptions: supplierOptions || [], flattenedSupplierOptions: flattenedSupplierOptions || [] }, () => this.getEMoleculeSuppliers());
  }

  supplierSuggest(event) {
    if (event.target === undefined) return;
    const { value } = event.target;
    this.setState({ supplierQueryText: value, supplierSuggestions: [] });
    if (_.isEmpty(value)) {
      this.onSupplierCleared();
    } else {
      this.debounceFetchSuppliers(value);
    }
  }

  fetchSupplierSuggestions(supplierName) {
    if (!supplierName) return;

    SupplierActions.search({ filters: { name: supplierName }, limit: 20 })
      .then(response => {
        const suppliers = response.data.map(supplier => ({ id: supplier.id, name: supplier.attributes.name }));
        this.setState({ supplierSuggestions: suppliers || [] });
      });
  }

  onSupplierSelected(supplierName) {
    const { searchOptions, onSearchFilterChange } = this.props;
    this.onSupplierCleared();
    const supplier = {
      queryTerm: supplierName,
      display: supplierName
    };
    const supplierOptions = this.state.supplierOptions;
    const modifiedSupplierOptions = [supplier].concat(supplierOptions);
    const supplierOptionsArray = supplierOptions.map(supplier => supplier.queryTerm);

    if (!supplierOptionsArray.includes(supplierName)) {
      this.setState({ supplierOptions: modifiedSupplierOptions });
    }

    if (!this.state.flattenedSupplierOptions.includes(supplierName)) {
      this.setState(prevState => ({ flattenedSupplierOptions: [...prevState.flattenedSupplierOptions, supplierName] }),
        () => onSearchFilterChange(searchOptions.set('searchSupplier', this.state.flattenedSupplierOptions)));
    }
  }

  onSupplierCleared() {
    this.setState({
      supplierQueryText: '',
      supplierSuggestions: []
    });
  }

  onSupplierSelection(field) {
    return ((value) => {
      const { searchOptions, onSearchFilterChange } = this.props;
      if (this.props.modalSourceSelection === 'strateos') {
        this.setState({ flattenedSupplierOptions: value });
      } else {
        this.setState({ eMoleculeSupplierSelected: value });
      }
      return onSearchFilterChange(searchOptions.set(field, value));
    });
  }

  eMoleculeSupplierSuggest(event) {
    if (event.target === undefined) return;
    const { value } = event.target;
    this.setState({ eMoleculeSupplierQueryText: value, eMoleculesSupplierSuggestions: [] });
    if (_.isEmpty(value)) {
      this.onEMoleculeSupplierClear();
    } else {
      const suggestions = [];
      this.state.eMoleculesAllSuppliers.forEach((supplier) => {
        const searchValue = this.state.eMoleculeSupplierQueryText.toUpperCase();
        if (supplier.toUpperCase().indexOf(searchValue) >= 0) {
          suggestions.push(supplier);
        }
      });
      this.setState({ eMoleculesSupplierSuggestions: suggestions });
    }
  }

  onEMoleculeSupplierSelected(supplier) {
    const { searchOptions, onSearchFilterChange } = this.props;
    this.onEMoleculeSupplierClear();

    if (!this.state.eMoleculeSupplierOptions.includes(supplier)) {
      this.setState({ eMoleculeSupplierOptions: [supplier, ...this.state.eMoleculeSupplierOptions] });
    }

    if (!this.state.eMoleculeSupplierSelected.includes(supplier)) {
      this.setState({  eMoleculeSupplierSelected: [supplier, ...this.state.eMoleculeSupplierSelected] },
        () => onSearchFilterChange(searchOptions.set('searchEMoleculeSupplier', this.state.eMoleculeSupplierSelected)));
    }
  }

  onEMoleculeSupplierClear() {
    this.setState({
      eMoleculeSupplierQueryText: '',
      eMoleculesSupplierSuggestions: []
    });
  }

  getEMoleculeSuppliers() {
    const { eMoleculesData, eMoleculesSearchType } = this.props;
    const compoundSmiles = this.props.searchOptions.get('compound_smiles');
    const suppliers = new Set();
    const defaultSuppliers = [];
    let eMolecules = null;

    if (eMoleculesData) {
      eMolecules = eMoleculesData.getIn([eMoleculesSearchType, compoundSmiles]);
      eMolecules && eMolecules.flatMap((result) => suppliers.add(result.get('supplierName')));
      this.state.flattenedSupplierOptions.forEach((supplier) => {
        if (suppliers.has(supplier)) {
          defaultSuppliers.push(supplier);
          suppliers.delete(supplier);
        }
      });
    }
    const sortedSuppliers = [...suppliers].sort();
    this.setState({ eMoleculeSupplierOptions: [...defaultSuppliers],
      eMoleculeSupplierSelected: [...defaultSuppliers],
      eMoleculesAllSuppliers: [...defaultSuppliers, ...sortedSuppliers] }, () => {
      this.props.onSearchFilterChange(this.props.searchOptions.set('searchEMoleculeSupplier', defaultSuppliers));
    });
  }

  renderEMoleculeSupplierFilter() {
    const suppliers = this.state.eMoleculeSupplierOptions.map((supplier) => {
      return {
        queryTerm: supplier,
        display: supplier
      };
    });
    return [
      <div className="compound-source-search-filters__search-supplier" key="supplier-type-ahead">
        <TypeAheadInput
          name="supplier-type-ahead"
          value={this.state.eMoleculeSupplierQueryText}
          placeholder="Enter the supplier name"
          suggestions={this.state.eMoleculesSupplierSuggestions}
          onChange={this.eMoleculeSupplierSuggest}
          onSuggestedSelect={selected => { this.onEMoleculeSupplierSelected(selected); }}
          onClear={() => this.onEMoleculeSupplierClear()}
        />
      </div>,
      <SearchFilter
        id="emolecule-suppliers"
        orientation="vertical"
        title="Suppliers"
        key="emolecule-suppliers"
        options={suppliers}
        currentSelection={this.state.eMoleculeSupplierSelected}
        onSelectOption={this.onSupplierSelection('searchEMoleculeSupplier')}
        isMultiSelect
      />
    ];
  }

  render() {
    const { onSearchInputChange, searchOptions, onSearchFilterChange, isLoading, onSourceChange } = this.props;

    const onSelectOption = (value) => {
      let defaultOptions = {};
      if (value === 'user_inventory') {
        defaultOptions = { ...ContainerSearchDefaults };
      } else if (value === 'strateos') {
        defaultOptions = { ...MaterialSearchDefaults };
      } else {
        defaultOptions = { ...EMoleculesStateDefaults };
      }

      const options = {
        ...searchOptions,
        searchSource: value,
        ...defaultOptions
      };

      isLoading();
      onSourceChange(Immutable.fromJS(options));
    };

    const searchInput = (placeHolder = '') => {
      return (
        <SearchFilterWrapper
          id="search"
          title="Search"
          key="search"
          alwaysOpen
          controlBoxPills={(
            <ControlBox.Pill
              id="compound-source-search"
              value={searchOptions.get('searchInput')}
              onReset={() => {
                onSearchInputChange('');
              }}
            />
          )}
        >
          <SearchField
            reset={() => onSearchInputChange('')}
            onChange={(e) => {
              e.stopPropagation();
              onSearchInputChange(e.target.value);
            }}
            value={searchOptions.get('searchInput')}
            placeholder={placeHolder}
            searchType=""
          />
        </SearchFilterWrapper>
      );
    };

    const  getContainerFilters = () => {
      return searchInput('Search container name');
    };

    const  getMaterialFilters = () => {
      return [
        searchInput(),
        <div className="compound-source-search-filters__search-supplier" key="supplier-type-ahead">
          <TypeAheadInput
            name="supplier-type-ahead"
            value={this.state.supplierQueryText}
            placeholder="Enter the supplier name"
            suggestions={this.state.supplierSuggestions.map(supplier => supplier.name)}
            onChange={this.supplierSuggest}
            onSuggestedSelect={selected => { this.onSupplierSelected(selected); }}
            onClear={() => this.onSupplierCleared()}
          />
        </div>,
        <SearchFilter
          id="suppliers"
          orientation="vertical"
          key="suppliers"
          title="Suppliers"
          options={this.state.supplierOptions}
          currentSelection={Immutable.List(this.state.flattenedSupplierOptions).toJS()}
          onSelectOption={this.onSupplierSelection('searchSupplier')}
          isMultiSelect
        />
      ];
    };

    const getEmoleculeFilters = () => {
      return [
        <SearchFilter
          id="emolecules"
          title="Search"
          key="emolecules"
          alwaysOpen
          currentSelection={this.props.eMoleculesSearchType}
          onSelectOption={(value) => {
            isLoading();
            onSearchFilterChange(searchOptions.set('eMoleculesSearchType', value));
          }}
          options={[
            {
              queryTerm: 'EXACT',
              display: 'Exact structure'
            },
            {
              queryTerm: 'ALTERNATE',
              display: 'Alternate forms'
            }
          ]}
        />,
        this.renderEMoleculeSupplierFilter()
      ];
    };

    return (
      <div className="compound-source-search-filters">
        <SearchFilterBar orientation="vertical">
          <SearchFilter
            id="source"
            title="Source"
            options={[
              {
                queryTerm: 'user_inventory',
                display: 'User inventory'
              },
              {
                queryTerm: 'strateos',
                display: 'Strateos'
              },
              {
                queryTerm: 'e_molecules',
                display: 'eMolecules'
              }
            ]}
            currentSelection={this.props.modalSourceSelection}
            onSelectOption={onSelectOption}
            wide
            alwaysOpen
          />
          {this.props.modalSourceSelection === 'user_inventory' && getContainerFilters()}
          {this.props.modalSourceSelection === 'strateos' && getMaterialFilters()}
          {this.props.modalSourceSelection === 'e_molecules' && getEmoleculeFilters()}
        </SearchFilterBar>
      </div>
    );
  }
}

CompoundSourceSearchFilters.propTypes = {
  onSearchInputChange: PropTypes.func,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  onSearchFilterChange: PropTypes.func,
  placeholder: PropTypes.string,
  modalSourceSelection: PropTypes.string.isRequired,
  eMoleculesSearchType: PropTypes.string,
  isLoading: PropTypes.func.isRequired,
  onSourceChange: PropTypes.func.isRequired
};

export default CompoundSourceSearchFilters;
