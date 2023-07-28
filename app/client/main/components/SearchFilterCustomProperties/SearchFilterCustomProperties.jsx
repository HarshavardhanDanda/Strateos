import React from 'react';
import PropTypes from 'prop-types';

import { CustomPropertySet } from 'main/components/properties';

import './SearchFilterCustomProperties.scss';
import _ from 'lodash';

class SearchFilterCustomProperties extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      collapsed: true
    };

    this.onChangeProperty = this.onChangeProperty.bind(this);
    this.onRemoveProperty = this.onRemoveProperty.bind(this);
    this.open = this.open.bind(this);
  }

  onChangeProperty({ key, value }) {
    const properties = _.clone(this.props.properties);
    if (value) {
      properties.searchProperties[key] = value;
    } else {
      delete properties.searchProperties[key];
    }
    this.props.onSelectProperties(properties.searchProperties);
  }

  onRemoveProperty(key) {
    const properties = _.clone(this.props.properties);
    delete properties.searchProperties[key];
    this.props.onSelectProperties(properties.searchProperties);
  }

  open() {
    this.setState({ shouldShowDismissable: true });
  }

  render() {
    const propertiesClone = _.clone(this.props.properties);
    // when the component renders the properties.searchProperties is being set to empty object so assigning the currentProperties
    if (this.props.currentProperties && this.props.properties) {
      propertiesClone.searchProperties = this.props.currentProperties;
    }
    return (
      <CustomPropertySet
        onChangeProperty={this.onChangeProperty}
        onAddProperty={this.onChangeProperty}
        onRemoveProperty={this.onRemoveProperty}
        properties={propertiesClone}
        orientation={this.props.orientation}
        customStyle="option-properties"
        hasCustomProperties
        showLabeledInput
      />
    );
  }
}

SearchFilterCustomProperties.propTypes = {
  currentProperties: PropTypes.object,
  orientation: PropTypes.oneOf(['vertical', 'horizontal']),
  onSelectProperties: PropTypes.func,
  properties: PropTypes.object
};

SearchFilterCustomProperties.defaultProps = {
  currentProperties: {},
  orientation: 'vertical',
};

export default SearchFilterCustomProperties;
