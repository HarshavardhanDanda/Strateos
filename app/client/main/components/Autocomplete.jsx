import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import uuidv4 from 'uuid/v4';
import { TextInput } from '@transcriptic/amino';

import AjaxHOC from 'main/containers/AjaxHOC';

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onSearch = _.debounce(this.props.onSearch, 250).bind(this);

    this.state = {
      selected: false
    };
  }

  onSelect(value) {
    this.setState({ selected: true },
      () => this.props.onChange(value));
  }

  onChange(e) {
    this.setState({ selected: false },
      () => {
        this.props.onChange(e.target.value);
        this.onSearch(e.target.value);
      });
  }

  icon() {
    if (this.props.loading) {
      return <i className="fa fa-spinner fa-pulse" />;
    } else if (this.props.value) {
      return <i className="fa fa-check" />;
    }
    return <i className="fa fa-search" />;
  }

  results() {
    if (this.props.results.length > 0) {
      return this.props.results.map((result) => (
        <a
          key={uuidv4()}
          className="list-group-item"
          onClick={() => this.onSelect(result)}
        >
          {result}
        </a>
      ));
    }
    return <a className="list-group-item">{this.props.zeroResultsMessage || 'No matching records found'}</a>;
  }

  render() {
    const showResults = this.props.value && !this.state.selected && this.props.results;

    return (
      <div>
        <div className="input-group">
          <TextInput
            id={this.props.id}
            value={this.props.value}
            placeholder={this.props.placeholder}
            onChange={this.onChange}
          />
          <span className="input-group-addon">
            {this.icon()}
          </span>
        </div>
        <div className="list-group">
          { showResults ? this.results() : undefined }
        </div>
      </div>
    );
  }
}

Autocomplete.propTypes = {
  id:          PropTypes.string.isRequired,
  value:       PropTypes.string,
  onChange:    PropTypes.func.isRequired,
  loading:     PropTypes.bool.isRequired,
  onSearch:    PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  results:     PropTypes.arrayOf(PropTypes.string)
};

Autocomplete.defaultProps = {
  placeholder: 'Search'
};

function AjaxManager(props) {
  const onSearch = value => props.onAction(() => props.onSearch(value));
  const results  = props.data;
  return (
    <Autocomplete {...({ ...props, onSearch, results })} />
  );
}

/* eslint-disable react/no-unused-prop-types */
AjaxManager.propTypes = {
  // These are used explicitly
  onSearch: PropTypes.func.isRequired,
  onAction: PropTypes.func,
  data:     PropTypes.arrayOf(PropTypes.string), // same as 'results' above

  // These are implicit dependencies that get passed to the child
  id:          PropTypes.string.isRequired,
  value:       PropTypes.string,
  onChange:    PropTypes.func.isRequired,
  loading:     PropTypes.bool,
  zeroResultsMessage:     PropTypes.string
};

const AjaxedAutocomplete = AjaxHOC(AjaxManager);
AjaxedAutocomplete.propTypes = {
  ...AjaxHOC.propTypes || {},
  ...AjaxManager.propTypes
};

export default AjaxedAutocomplete;
