import React     from 'react';

import ContainerActions       from 'main/actions/ContainerActions';
import PathActions            from 'main/inventory/locations/PathActions';
import ContainerSearchResults from 'main/inventory/locations/search/ContainerSearchResults';
import { GenericSearcher }    from 'main/components/properties';

const ContainerSearchQueryEngine = {
  query(q, cb) {
    const repackaged_cb = results =>
      cb({ results, page: 1, selected: -1 });

    return ContainerActions.searchContainer(q)
      .done(({ results }) => repackaged_cb(results));
  },

  resultType: ContainerSearchResults
};

function ContainerSearch() {

  const onCancel = () => {
    PathActions.showSearcher(false);
  };

  const onSelected = (c) => {
    PathActions.showSearcher(false);
    PathActions.showContainer(c.id, c.location_id);
  };

  return (
    <div className="container-search">
      <GenericSearcher
        engine={ContainerSearchQueryEngine}
        onCancel={onCancel}
        onSelected={onSelected}
        searchType="Container"
      />
    </div>
  );
}

export default ContainerSearch;
