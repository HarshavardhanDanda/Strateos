import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _  from 'lodash';
import CompoundListView from 'main/components/Compounds/CompoundListView';
import { Pagination } from '@transcriptic/amino';

class CompoundListWithPagination extends Component {
  constructor(props) {
    super(props);

    this.remove = this.remove.bind(this);
  }

  remove(remainingCompounds) {
    const allCompounds = _.map(this.props.allCompounds.toJS(), 'id');
    const currentCompounds = _.map(this.props.compounds.toJS(), 'id');
    const compounds = _.difference(allCompounds, currentCompounds);
    const totalRemainingCompounds = [...remainingCompounds, ...compounds];
    this.props.onRemove(totalRemainingCompounds, remainingCompounds.size);
  }

  renderProps(prop) {
    const withRemoveAction = {
      compounds: prop.compounds,
      compoundClass: prop.compoundClass,
      onRemove: this.remove,
      moleculeSize: prop.moleculeSize,
      onCompoundClick: prop.onCompoundClick
    };
    const withOutRemoveAction = {
      compounds: prop.compounds,
      compoundClass: prop.compoundClass,
      moleculeSize: prop.moleculeSize,
      onCompoundClick: prop.onCompoundClick
    };
    return this.props.removeAction ? withRemoveAction : withOutRemoveAction;
  }

  render() {
    return (
      <div>
        <CompoundListView
          {...this.renderProps(this.props)}
        />
        <If condition={this.props.numPages > 1}>
          <Pagination
            page={this.props.page}
            pageWidth={this.props.pageWidth}
            numPages={this.props.numPages}
            onPageChange={(page) => this.props.onPageChange(page)}
          />
        </If>
      </div>
    );
  }
}

CompoundListWithPagination.propTypes = {
  compounds: PropTypes.any.isRequired,
  allCompounds: PropTypes.any,
  compoundClass: PropTypes.string,
  moleculeSize: PropTypes.string,
  onRemove: PropTypes.func,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  pageWidth: PropTypes.number.isRequired,
  removeAction: PropTypes.bool.isRequired,
  onCompoundClick: PropTypes.func
};

export default CompoundListWithPagination;
