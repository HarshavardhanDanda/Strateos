import * as _ from 'lodash';
import PropertySearchResults from 'main/inventory/locations/search/PropertySearchResults';
import ajax from 'main/util/ajax';

const ContainerTypeQueryEngine = {
  matches(containerType, query) {
    // match if query is a substring of name or shortname
    const queryLower = query.toLowerCase();
    const name = containerType.name.toLowerCase();
    const shortname = containerType.shortname.toLowerCase();
    return (
      name.indexOf(queryLower) !== -1 || shortname.indexOf(queryLower) !== -1
    );
  },

  query(query, cb) {
    return ajax.get('/api/container_types').done((types) => {
      const containerTypeData = types.data;
      const matched = _.filter(containerTypeData.map((d) => ({ id: d.id, name: d.attributes.name, shortname: d.attributes.shortname })),
        containerType => this.matches(containerType, query)
      );
      const data = {
        num_pages: 0,
        per_page: containerTypeData.length,
        results: matched
      };
      return cb(data);
    });
  },

  resultType: PropertySearchResults
};

export default ContainerTypeQueryEngine;
