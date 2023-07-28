import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TypeAheadInput } from '@transcriptic/amino';
import LabConsumerAPI from 'main/api/LabConsumerAPI';
import FeatureStore from 'main/stores/FeatureStore';
import OrganizationActions from 'main/actions/OrganizationActions';
import OrganizationStore from 'main/stores/OrganizationStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';

import classNames from 'classnames';

import './OrganizationFilter.scss';

class OrganizationTypeAhead extends React.Component {

  static getDerivedStateFromProps(nextProps, prevState) {

    if (nextProps.organizationSelected != prevState.organizationSelected) {
      if (!nextProps.organizationSelected) {
        return { org_query_text: '', organizationSelected: nextProps.organizationSelected };
      }
      return { organizationSelected: nextProps.organizationSelected };
    }

    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      org_query_text: '',
      organizationSelected: this.props.organizationSelected,
      suggestions: []
    };
    this.debounceFetch = _.debounce(this.fetchSuggestionsByOrg, 250).bind(this);
  }

  componentDidMount() {
    const organizationSelected = this.props.organizationSelected;
    if (organizationSelected && this.state.org_query_text.length === 0) {
      if (!OrganizationStore.getById(organizationSelected)) {
        OrganizationActions.loadOrganization(organizationSelected).done(() => {
          this.setState({ org_query_text:  OrganizationStore.getById(organizationSelected).get('name') });
        });
      } else {
        this.setState({ org_query_text:  OrganizationStore.getById(organizationSelected).get('name') });
      }
    }
  }

  fetchSuggestionsByOrg() {
    LabConsumerAPI.index({
      filters: {
        org_name: this.state.org_query_text,
        lab_id: FeatureStore.getLabIds().join(),
      },
      includes: ['organization'],
      fields: { organizations: ['id', 'name', 'subdomain'] }
    }).then(res => {
      const suggestions = [];
      res.data.forEach(consumer => {
        const labConsumerFromStore = LabConsumerStore.getById(consumer.id);
        if (labConsumerFromStore) {
          suggestions.push({
            name: labConsumerFromStore.getIn(['organization', 'name']),
            value: labConsumerFromStore.getIn(['organization', 'id'])
          });
        }
      });
      this.setState({ suggestions });
    });
  }

  suggest(e) {
    if (e.target === undefined) return;
    const { value } = e.target;
    this.setState({ org_query_text: value, suggestions: [] });
    if (_.isEmpty(value)) { this.onOrganizationCleared(); }
    this.debounceFetch();
  }

  onOrganizationCleared() {
    this.setState({ org_query_text: '', suggestions: [] }, () => {
      this.props.onOrganizationChange(undefined);
    });

  }

  render() {
    return (
      <div className={classNames('organization-typeahead', this.props.defaultWidth
        ? 'organization-typeahead__default-width' : '')}
      >
        <TypeAheadInput
          name="text-input"
          value={this.state.org_query_text}
          placeholder="All organizations"
          searchIcon={this.props.searchIcon}
          suggestions={this.state.suggestions.map(s => s.name)}
          onChange={e => this.suggest(e)}
          isLoaded={this.state.organizationSelected}
          onSuggestedSelect={org_query_text => {
            this.setState({ org_query_text }, () => {
              const [orgId] = this.state.suggestions.map(s =>
                (s.name === org_query_text ? s.value : undefined)
              ).filter(x => x !== undefined);
              const id = orgId || '';
              this.props.onOrganizationChange(id);
            });
          }}
          onClear={() => this.onOrganizationCleared()}
        />
      </div>
    );
  }

}

OrganizationTypeAhead.propTypes = {
  onOrganizationChange: PropTypes.func,
  organizationSelected: PropTypes.string,
  searchIcon: PropTypes.string,
  defaultWidth: PropTypes.bool
};

export default OrganizationTypeAhead;
