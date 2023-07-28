import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TypeAheadInput } from '@transcriptic/amino';
import LabConsumerAPI from 'main/api/LabConsumerAPI';
import LabConsumerStore from 'main/stores/LabConsumerStore';

class LabConsumersFilter extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      queryText: props.orgName,
      suggestions: []
    };
    this.debounceFetch = _.debounce(this.fetchSuggestions, 250).bind(this);
  }

  // This is mostly just used for a reset toggle since it has an internal unshared store
  componentDidUpdate(prevProps) {
    const { orgName } = this.props;
    if (orgName !== prevProps.orgName && orgName !== this.state.queryText) {
      this.setState({ queryText: orgName || '', suggestions: [] }); // eslint-disable-line react/no-did-update-set-state
    }
  }

  // Expected format of `?filter[lab_id]=....&filter[org_name]=....`
  buildFilter = () => {
    const { labId } = this.props;
    const { queryText } = this.state;
    const filter = { org_name: queryText };
    if (isValidLabId(labId)) {
      filter.lab_id = labId;
    }
    return filter;
  };

  fetchSuggestions = () => {
    const filters = this.buildFilter();
    LabConsumerAPI.index({
      filters,
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
  };

  handleOrganizationSelected = (orgName) => {
    const { suggestions } = this.state;
    const org = suggestions.find(org => org.name.toLowerCase() === orgName.toLowerCase());
    this.setState({ queryText: orgName, suggestions: [] });

    const { onOrganizationSelected = () => {} } = this.props;
    onOrganizationSelected(org);
  };

  handleChange = (evt) => {
    this.setState({
      queryText: evt.target.value || '',
      suggestions: [],
    });
    this.debounceFetch();
  };

  resetState = () => {
    this.setState({ queryText: '', suggestions: [] });

    const { onOrganizationSelected = () => {} } = this.props;
    onOrganizationSelected();
  };

  render() {
    const { queryText, suggestions } = this.state;
    return (
      <TypeAheadInput
        name="text-input"
        value={queryText}
        placeholder="All organizations"
        suggestions={suggestions.map(s => s.name)}
        onChange={this.handleChange}
        onSuggestedSelect={this.handleOrganizationSelected}
        onClear={this.resetState}
        isLoaded={this.props.isLoaded}
      />
    );
  }
}

// Some stores will pass this as undefined, others maybe as '', others as 'all', these aren't valid
const isValidLabId = (labId) => {
  return (labId != undefined &&
    labId !== '' &&
    labId !== 'all');
};

LabConsumersFilter.propTypes = {
  orgName: PropTypes.string,
  labId: PropTypes.string,
  onOrganizationSelected: PropTypes.func,
  isLoaded: PropTypes.bool,
};

export default LabConsumersFilter;
