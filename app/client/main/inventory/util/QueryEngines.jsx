import $ from 'jquery';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Highlighted, Button } from '@transcriptic/amino';
import ajax                    from 'main/util/ajax';
import AddResourceModal        from 'main/pages/ResourcesPage/modals/AddResourceModal';
import ModalActions            from 'main/actions/ModalActions';
import Urls                    from 'main/util/urls';

// ######## RESOURCE
class ResourceSearchResults extends Component {
  static get propTypes() {
    return {
      results: PropTypes.array,
      query: PropTypes.func,
      onSelected: PropTypes.func,
      selected: PropTypes.number
    };
  }

  render() {
    return (
      <div className="results">
        {this.props.results.map((result, i) => {
          return (
            <ResourceSearchResult
              key={result.name}
              highlight={this.props.query}
              resource={result}
              onSelected={this.props.onSelected}
              selected={this.props.selected === i}
            />
          );
        })}
      </div>
    );
  }
}

class ResourceSearchResult extends Component {
  static get propTypes() {
    return {
      selected: PropTypes.number,
      onSelected: PropTypes.func,
      resource: PropTypes.object,
      highlight: PropTypes.string
    };
  }

  render() {
    const { resource } = this.props;

    return (
      <div
        className={classnames(
          'result',
          { selected: this.props.selected }
        )}
        onClick={() => this.props.onSelected(resource)}
      >
        <strong>
          <Highlighted
            text={resource.name}
            highlight={this.props.highlight}
          />
        </strong>
      </div>
    );
  }
}

// Renders a button to '+ Create Resource' which reveals a form
class ResourceQuickCreate extends Component {
  constructor() {
    super();

    this.state = {
      open: false
    };
  }

  render() {
    return (
      <div>
        <AddResourceModal
          onDone={resource => this.props.onSelected(resource)}
        />
        <Button
          icon="fa fa-plus"
          link
          type="primary"
          onClick={() => { ModalActions.open(AddResourceModal.MODAL_ID); }}
        >
          Create Resource
        </Button>
      </div>
    );
  }
}

ResourceQuickCreate.propTypes = {
  onSelected: PropTypes.func
};

const AliquotResourcesQueryEngine = {
  query(q, cb, searchData) {
    const container_id = (searchData && searchData.containerId) ? searchData.containerId : window.location.pathname.split('/')[4];
    const url = `${Urls.resources()}?${$.param({ q })}&${$.param({ container_id })}`;

    return ajax.get(url)
      .done(data => cb(data));
  },
  resultType: ResourceSearchResults
};

// Vendor
class VendorSearchResults extends Component {
  render() {
    return (
      <div className="results">
        {this.props.results.map((result, i) => {
          return (
            <VendorSearchResult
              key={result.name}
              highlight={this.props.query}
              vendor={result}
              onSelected={this.props.onSelected}
              selected={this.props.selected === i}
            />
          );
        })}
      </div>
    );
  }
}

VendorSearchResults.propTypes = {
  results: PropTypes.array,
  query: PropTypes.func,
  selected: PropTypes.number,
  onSelected: PropTypes.func
};

class VendorSearchResult extends Component {
  render() {
    const { vendor } = this.props;

    return (
      <div
        className={
          classnames(
            'result',
            { selected: this.props.selected }
          )
        }
        onClick={() => this.props.onSelected(vendor)}
      >
        <strong>
          <Highlighted
            text={vendor.name}
            highlight={this.props.highlight}
          />
        </strong>
      </div>
    );
  }
}

VendorSearchResult.propTypes = {
  selected: PropTypes.number,
  onSelected: PropTypes.func,
  vendor: PropTypes.object,
  highlight: PropTypes.string
};

export { AliquotResourcesQueryEngine };
