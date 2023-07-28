import _ from 'lodash';
import NotificationActions from 'main/actions/NotificationActions';
import SessionStore from 'main/stores/SessionStore';
import { CompoundSourceSelectorModalState } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import Immutable from 'immutable';
import { getEMolecules } from '../EMoleculesAPI';
import { CompoundSourceSelectorModalActions } from './CompoundSourceActions';

const CompoundSourceEMoleculesActions = {
  ...CompoundSourceSelectorModalActions,

  onSortOptionChange(onSearchFailed, searchSortBy, descending = true) {
    const options = {
      ...this.searchOptions(false),
      searchSortBy,
      descending
    };
    // sort eMolecules data
    const sortedData = this.searchOptions().eMoleculesCurrentData
      .sortBy((supplier) => (descending ? -1 : 1) * this.parseEMoleculesSortingValues(supplier.get(searchSortBy)));
    this.updateState(
      {
        ...options,
        searchPage: 1,
        eMoleculesCurrentData: Immutable.fromJS(sortedData),
        eMoleculesCurrentPage: Immutable.fromJS(sortedData.slice(0, options.searchPerPage))
      }
    );
  },

  parseEMoleculesSortingValues(value) {
    if (typeof value === 'number') return value;
    const parsedGroups = value.match(/^\$([0-9.]*)\/g/);
    return parsedGroups ? parsedGroups[1] : Infinity;
  },

  onSearchPageChange(onSearchFailed, searchPage) {
    const options = {
      ...this.searchOptions(false),
      searchPage
    };
    // paginate eMolecules data
    this.updateState(
      {
        ...options,
        eMoleculesCurrentPage: Immutable.fromJS(
          this.searchOptions().eMoleculesCurrentData
            .slice((options.searchPage - 1) * options.searchPerPage, options.searchPage * options.searchPerPage)
        )
      }
    );
  },

  parseEMolecules(data) {
    if (!data.content) return Immutable.List();
    return Immutable.List(data.content.flatMap((result) => {
      let counter = 0;
      return result.suppliers.map((supplier) => {
        counter += 1;
        return Immutable.fromJS(_.extend(
          {
            smiles: result.smiles,
            name: result.chemicalNames && result.chemicalNames[0],
            structureUrl: result.structureUrl,
            casNumber: result.casNumber
          },
          {
            id: `${supplier.id}_${counter}`,
            supplierName: supplier.name,
            tier: supplier.tier,
            estimatedCost: supplier.estimatedCost,
            pricePoints: supplier.pricePoints,
            tierText: supplier.catalog.type
          }
        ));
      });
    }));
  },

  getSupplierFilteredData(smilesEMoleculesData, searchSuppliers) {
    return smilesEMoleculesData.toJS().filter((eMoleculeData) => searchSuppliers.includes(eMoleculeData.supplierName));
  },

  doSearch(searchOptions, onSearchFailed, onSearchSucceed = () => {}) {

    this.updateState({
      isSearching: true
    });
    const smilesEMoleculesData = this.searchOptions().eMoleculesData.getIn([searchOptions.eMoleculesSearchType, searchOptions.compound_smiles]);
    if (smilesEMoleculesData) {
      const filtered = this.getSupplierFilteredData(smilesEMoleculesData, searchOptions.searchEMoleculeSupplier);
      this.updateState(
        {
          eMoleculesCurrentData: Immutable.fromJS(filtered),
          eMoleculesCurrentPage: Immutable.fromJS(filtered.slice(0, searchOptions.searchPerPage)),
          numPages: Math.ceil(filtered.length / searchOptions.searchPerPage)
        }
      );
      this.onSortOptionChange(onSearchFailed, searchOptions.searchSortBy, searchOptions.descending);
      setTimeout(() => {
        onSearchSucceed();
        this.updateState({ isSearching: false });
      }, 300);
    } else {
      const orgId = SessionStore.getOrg().get('id');
      getEMolecules(orgId, searchOptions.compound_smiles, searchOptions.eMoleculesSearchType)
        .then((results) => {
          this.updateState(
            { ...searchOptions,
              eMoleculesData: this.searchOptions().eMoleculesData.setIn([searchOptions.eMoleculesSearchType, searchOptions.compound_smiles], this.parseEMolecules(results))
            }
          );
        })
        .fail((_) => {
          this.updateState(
            {
              ...searchOptions,
              eMoleculesCurrentPage: Immutable.List()
            }
          );
          NotificationActions.createNotification(
            {
              text: 'Supplier was unable to process this request',
              isError: true,
              timeout: 5 * 1000
            }
          );
        })
        .then(() => {
          const smilesEMoleculesData =  this.searchOptions().eMoleculesData
            .getIn([searchOptions.eMoleculesSearchType, searchOptions.compound_smiles]);
          const filtered = this.getSupplierFilteredData(smilesEMoleculesData, searchOptions.searchEMoleculeSupplier);

          this.updateState(
            {
              eMoleculesCurrentData: Immutable.fromJS(filtered),
              eMoleculesCurrentPage: Immutable.fromJS(filtered.slice(0, searchOptions.searchPerPage)),
              numPages: Math.ceil(filtered.size / searchOptions.searchPerPage)
            }
          );
        })
        .always(() => {
          onSearchSucceed();
          this.updateState({ isSearching: false });
        });
    }
  }
};

const CompoundSourceSelectorEMoleculesModalActions = _.extend({}, CompoundSourceEMoleculesActions, {
  stateStore: CompoundSourceSelectorModalState
});

export { CompoundSourceSelectorEMoleculesModalActions };
