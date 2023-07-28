import classnames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import CreateNewPackage from './CreateNewPackage';

import './AddPackageCard.scss';

class AddPackageCard extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      showForm: false
    };
  }

  render() {
    const AddPackageCardClasses = classnames(
      'add-package-card',
      'container-rect',
      'grid-element',
      {
        creating: this.state.showForm
      }
    );
    return (
      <div className={AddPackageCardClasses}>
        <Choose>
          <When condition={this.state.showForm}>
            <div className="card create-new-object">
              <div className="form-section">
                <i
                  className="hide-form fa fa-times"
                  onClick={() =>
                    this.setState({
                      showForm: false
                    })}
                />
                <CreateNewPackage {...this.props} />
              </div>
            </div>
          </When>
          <Otherwise>
            <div className="card single-link-card">
              <a
                onClick={() =>
                  this.setState({
                    showForm: true
                  })}
              >
                <i className="fa fa-plus" />
                <span className="add-text">Create New Package</span>
              </a>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }
}

AddPackageCard.propTypes = {
  reservedNames: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export default AddPackageCard;
