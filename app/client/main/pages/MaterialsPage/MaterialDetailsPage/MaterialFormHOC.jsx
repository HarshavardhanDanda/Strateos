import React from 'react';
import {
  Select,
  TextArea,
  TextBody,
  TypeAheadInput
} from '@transcriptic/amino';
import _ from 'lodash';
import Immutable from 'immutable';
import SupplierActions from 'main/actions/SupplierActions';

const suggestionLimit = 20;
const debounceWait = 250;

const MaterialFormHOC = (WrappedComponent) => {
  class CommonMethods extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        supplier_query_text: this.props.material.getIn(['supplier', 'name']) || '',
        supplierSuggestions: []
      };
      this.renderCategory = this.renderCategory.bind(this);
      this.renderVendor = this.renderVendor.bind(this);
      this.renderSupplier = this.renderSupplier.bind(this);
      this.renderNote = this.renderNote.bind(this);
      this.supplierSuggest = this.supplierSuggest.bind(this);
      this.debounceFetchSuppliers = _.debounce(this.fetchSupplierSuggestions, debounceWait).bind(this);
    }

    supplierSuggest(event) {
      if (event.target === undefined) return;
      const { value } = event.target;
      this.setState({ supplier_query_text: value, supplierSuggestions: [] });
      if (_.isEmpty(value)) {
        this.onSupplierCleared();
      } else {
        this.debounceFetchSuppliers(value);
      }
    }

    fetchSupplierSuggestions(supplierName) {
      if (!supplierName) return;

      SupplierActions.search({ filters: { name: supplierName }, limit: suggestionLimit })
        .then(response => {
          const suppliers = response.data.map(supplier => ({ id: supplier.id, name: supplier.attributes.name }));
          this.setState({ supplierSuggestions: suppliers || [] });
        });
    }

    onSupplierSelected(supplierName) {
      const { material, onMaterialChange } = this.props;
      const supplier = this.state.supplierSuggestions.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
      this.setState({ supplier_query_text: supplierName, supplierSuggestions: [] });
      supplier && onMaterialChange(material.merge({ supplier }));
    }

    onSupplierCleared() {
      const { material, onMaterialChange } = this.props;
      this.setState({
        supplier_query_text: '',
        supplierSuggestions: []
      });
      onMaterialChange(material.merge({  supplier_id: null, supplier: null }));
    }

    renderCategory(disabled) {
      const id = this.props.material.getIn(['categories', 0, 'id']);
      const name = this.props.material.getIn(['categories', 0, 'path'], Immutable.List()).toJS().join();

      if (disabled) {
        return (
          <TextBody color="secondary">
            {name}
          </TextBody>
        );
      }

      return (
        <Select
          options={this.props.categories.map(cat => ({
            name: cat.path.join(),
            value: cat.id
          }))}
          value={id}
          onChange={e => {
            const category = this.props.categories.find(c => c.id === e.target.value);
            if (category) {
              this.props.onMaterialChange(this.props.material.set('categories', Immutable.fromJS([category])));
            }
          }}
          placeholder="Select Category"
        />
      );
    }

    renderVendor(disabled) {
      if (disabled) {
        return (
          <TextBody color="secondary">
            {this.props.material.getIn(['vendor', 'name'])}
          </TextBody>
        );
      }

      return (
        <Select
          options={this.props.vendors.map(vendor => ({
            name: vendor.name,
            value: vendor.name
          }))}
          value={this.props.material.getIn(['vendor', 'name'])}
          onChange={(e) => {
            const name = e.target.value;
            const vendor = this.props.vendors.find((vendor) => vendor.name === name);

            this.props.onMaterialChange(
              this.props.material.merge({
                vendor
              })
            );
          }}
          placeholder="Select Vendor"
        />
      );
    }

    renderSupplier(disabled) {
      if (disabled) {
        return (
          <TextBody color="secondary">
            {this.props.material.getIn(['supplier', 'name'])}
          </TextBody>
        );
      }

      return (
        <TypeAheadInput
          name="supplier-type-ahead"
          value={this.state.supplier_query_text}
          placeholder="Select Supplier"
          suggestions={this.state.supplierSuggestions.map(supplier => supplier.name)}
          onChange={this.supplierSuggest}
          onSuggestedSelect={selected => { this.onSupplierSelected(selected); }}
          onClear={() => this.onSupplierCleared()}
        />
      );
    }

    renderNote(disabled) {
      if (disabled) {
        return (
          <TextBody color="secondary">
            {this.props.material.get('note')}
          </TextBody>
        );
      }

      return (
        <TextArea
          value={this.props.material.get('note')}
          placeholder="Add note"
          onChange={(event) => {
            this.props.onMaterialChange(
              this.props.material.set('note', event.target.value)
            );
          }}
        />
      );
    }

    render() {
      return (
        <WrappedComponent
          renderCategory={this.renderCategory}
          renderVendor={this.renderVendor}
          renderSupplier={this.renderSupplier}
          renderNote={this.renderNote}
          {...this.props}
        />
      );
    }
  }

  return CommonMethods;
};

export default MaterialFormHOC;
