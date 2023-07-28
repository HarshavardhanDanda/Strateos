import Immutable         from 'immutable';
import { some, bindAll } from 'lodash';
import PropTypes         from 'prop-types';
import React             from 'react';

import ProtocolCard   from 'main/components/ProtocolCard';
import { SearchBar }  from 'main/components/Search';
import RowWrappedGrid from 'main/components/grid';

import {
  Spinner,
  matches
} from '@transcriptic/amino';

class SearchableProtocolList extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      query: ''
    };
    bindAll(
      this,
      'handleSearchBarChange'
    );
  }

  handleSearchBarChange(e) {
    this.setState({ query: e.target.value });
  }

  searchProtocols() {
    const q = this.state.query;
    return this.props.protocols.filter(protocol =>
      some([
        matches(protocol.get('display_name'), q),
        matches(protocol.get('name'), q),
        matches(protocol.get('description'), q),
        matches(protocol.get('version'), q)
      ])
    );
  }

  renderProtocols(protocols) {
    return protocols.map(protocol => (
      <ProtocolCard
        key={protocol.get('id')}
        protocol={protocol}
        query={this.state.query}
      />
    ));
  }

  render() {
    const { query } = this.state;
    const { loading } = this.props;

    const hasQuery = (query ? query.trim().length : 0) > 0;
    const protocols = hasQuery ? this.searchProtocols() : this.props.protocols;

    return (
      <div className="node-group-section">
        <div className="card-group-header">
          <h2 className="modal-title">{this.props.title}</h2>
          <SearchBar
            value={query}
            onChange={this.handleSearchBarChange}
          />
        </div>
        <div className="wrapped-card-page">
          <Choose>
            <When condition={protocols.count()}>
              <RowWrappedGrid>
                {this.renderProtocols(protocols)}
              </RowWrappedGrid>
            </When>
            <When condition={loading}>
              <RowWrappedGrid>
                <Spinner />
              </RowWrappedGrid>
            </When>
            <Otherwise>
              <p className="caption tx-type--heavy tx-type--secondary">
                There are no protocols to display.
              </p>
            </Otherwise>
          </Choose>
        </div>
      </div>
    );
  }
}

SearchableProtocolList.defaultProps = {
  loading: true
};

SearchableProtocolList.propTypes = {
  protocols: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  loading: PropTypes.bool,
  title: PropTypes.string
};

export default SearchableProtocolList;
