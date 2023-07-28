import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { Pagination, Card } from '@transcriptic/amino';

import ResourceCard from './ResourceCard';

class ResourcesSearchResults extends React.Component {
  render() {
    return (
      <div className="resource-card">
        <div className="row">
          {this.props.data.size > 0 ? this.props.data.map(resource => (
            <ResourceCard
              key={resource.get('id')}
              resource={resource}
            />
          )) : <Card container>No records</Card>}
        </div>
        <div className="resource-card__pagination">
          <Pagination
            page={this.props.page}
            pageWidth={10}
            numPages={this.props.numPages}
            onPageChange={this.props.onSearchPageChange}
          />
        </div>
      </div>
    );
  }
}

ResourcesSearchResults.defaultProps = {
  data: Immutable.List()
};

ResourcesSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.Iterable),
  page: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func
};

export default ResourcesSearchResults;
