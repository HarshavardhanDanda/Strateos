import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { CustomPropertySet } from 'main/components/properties';

import './SearchFilterProperties.scss';

class SearchFilterProperties extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      collapsed: true
    };

    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onRemoveProperty = this.onRemoveProperty.bind(this);
    this.orgSpecOnChangeProperty = this.orgSpecOnChangeProperty.bind(this);
    this.orgSpecOnRemoveProperty = this.orgSpecOnRemoveProperty.bind(this);
    this.open = this.open.bind(this);
  }

  onChangeProperty({ key, value }) {
    const properties = _.clone(this.props.currentProperties);
    properties[key] = value;
    this.props.onSelectProperties(properties);
  }

  onRemoveProperty(key) {
    const properties = _.clone(this.props.currentProperties);
    delete properties[key];
    this.props.onSelectProperties(properties);
  }

  orgSpecOnChangeProperty({ key, value }) {
    const properties = _.clone(this.props.orgSpecProperties);
    value ?
      properties.searchProperties[key] = value
      : delete properties.searchProperties[key];
    this.props.orgSpecOnSelectProperties(properties.searchProperties);
  }

  orgSpecOnRemoveProperty(key) {
    const properties = _.clone(this.props.orgSpecProperties);
    delete properties.searchProperties[key];
    this.props.orgSpecOnSelectProperties(properties.searchProperties);
  }

  open() {
    this.setState({ shouldShowDismissable: true });
  }

  render() {
    const orgSpecPropertiesClone = _.clone(this.props.orgSpecProperties);
    const orgSpecCurrentPropertiesClone = _.clone(this.props.orgSpecCurrentProperties);
    // when the component renders the orgSpecProperties.searchProperties is being set to empty object so assigning the orgSpecCurrentProperties
    if (this.props.orgSpecCurrentProperties && this.props.orgSpecProperties) {
      orgSpecPropertiesClone.searchProperties = orgSpecCurrentPropertiesClone;
    }

    return (
      <div>
        <h4 className="search-filter-wrapper__subtitle">
          <span>Properties</span>
        </h4>
        {/* This accepts both key and value which are user-provided search terms that backend uses to search for a given arbitrary key/value pair property */}
        <CustomPropertySet
          onChangeProperty={this.onChangeProperty}
          onAddProperty={this.onChangeProperty}
          onRemoveProperty={this.onRemoveProperty}
          properties={this.props.currentProperties}
          orientation={this.props.orientation}
          customStyle="option-properties"
          nameEditable
          slim
        />
        {this.props.showOrgProperties && (
          <React.Fragment>
            <h4 className="search-filter-wrapper__subtitle">
              <span>Org specific properties</span>
            </h4>
            {/* The key is prefetched from the backend and accepts only the value which is user-provided search term that backend uses to search for a given CCP */}
            <CustomPropertySet
              onChangeProperty={this.orgSpecOnChangeProperty}
              onAddProperty={this.orgSpecOnChangeProperty}
              onRemoveProperty={this.orgSpecOnRemoveProperty}
              properties={orgSpecPropertiesClone}
              orientation={this.props.orientation}
              customStyle="option-properties"
              hasCustomProperties
              showLabeledInput
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}

SearchFilterProperties.propTypes = {
  currentProperties: PropTypes.object,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  onSelectProperties: PropTypes.func,
  showOrgProperties: PropTypes.bool,
  orgSpecProperties: PropTypes.object,
  orgSpecCurrentProperties: PropTypes.object,
  orgSpecOnSelectProperties: PropTypes.func
};

SearchFilterProperties.defaultProps = {
  currentProperties: {},
  orgSpecCurrentProperties: {},
  orientation: 'vertical',
  showOrgProperties: false
};

export default SearchFilterProperties;
