import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { Button, ButtonGroup } from '@transcriptic/amino';
import CompoundEditForm        from 'main/components/Compounds/CompoundRegistration/CompoundEditForm';
import Immutable from 'immutable';

import './CompoundRegistrationDrawer.scss';

class CompoundRegistrationDrawer extends React.Component {

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'resolveConflicts',
      'getLabels',
      'getColumn',
      'getErrorMessage',
      'hasStatus'
    );

    this.state = {
      compoundLabels: this.getLabels(),
      compoundReferenceId: this.getColumn('reference_id'),
      compoundName: this.getColumn('name'),
      dropDownContent: {
        compoundNames: this.getDropdownContent('name'),
        compoundReferenceIds: this.getDropdownContent('reference_id')
      }
    };
  }

  getColumn(type) {
    const { compound } = this.props;
    if (this.hasStatus('Registered') || (this.hasStatus('Valid') && !this.hasStatus('Duplicates'))) {
      return compound.get(type);
    }
    const fieldList = this.getDropdownContent(type);
    const [first] = fieldList;
    return first || '';
  }

  hasStatus(status) {
    const { compound, compoundValidations } = this.props;
    return compoundValidations.get(compound.get('smiles')).includes(status);
  }

  getLabels() {
    const { compound, duplicates } = this.props;
    let labels = [];
    duplicates.get(compound.get('smiles')).forEach((compoundInfo) => {
      if (compoundInfo.labels) {
        compoundInfo.labels.forEach(label => labels.push(label));
      }
    });
    if (this.hasStatus('Registered')) {
      labels = _.differenceWith(labels, this.props.registeredLabels.get(compound.get('smiles')), (summarizedLabel, registeredLabel) => summarizedLabel.name === registeredLabel.name);
    }

    return _.uniqBy(labels, 'name');
  }

  resolveConflicts() {
    const { compoundLabels, compoundName, compoundReferenceId } = this.state;
    let { compound } = this.props;
    const { compoundValidations, setCompoundValidations, duplicates, registeredLabels } = this.props;
    compound = compound.toJS();
    compound.name = compoundName ? compoundName.trim() : '';
    compound.labels = compoundLabels.concat(registeredLabels.get(compound.smiles) || []);
    compound.reference_id = compoundReferenceId ? compoundReferenceId.trim() : '';
    const validation = compoundValidations.get(compound.smiles);
    compoundValidations.set(compound.smiles, _.without(validation, 'Duplicates'));

    duplicates.set(compound.smiles, [{ ...compound }]);
    this.props.setDuplicates(duplicates);

    setCompoundValidations(compoundValidations);

    const records = _.clone(this.props.records);
    records.forEach(record => {
      if (record.smiles === compound.smiles) {
        _.assign(record, compound);
      }
    });
    this.props.setRecords(records);
    this.props.closeDrawer();
  }

  getDropdownContent(field) {
    const { compound, duplicates } = this.props;
    if (this.hasStatus('Registered') || (this.hasStatus('Valid') && !this.hasStatus('Duplicates'))) {
      return [];
    }
    const fieldList = duplicates.get(compound.get('smiles')).filter(compoundInfo => compoundInfo[field]);
    return _.uniqBy(fieldList, field).map(compoundInfo => compoundInfo[field]);
  }

  getErrorMessage() {
    const { compound, duplicates } = this.props;
    let message;
    if (this.hasStatus('Registered')) {
      message = `There exist multiple (${duplicates.get(compound.get('smiles')).length}) compounds with the same chemical identifier, which has 
            already been registered in the system. Please resolve the labels from amongst the set 
            of new labels or create new labels. Chemical nickname and reference id cannot be modified here.`;

    } else {
      message = `There exist multiple (${duplicates.get(compound.get('smiles')).length}) compounds with
                 the same chemical identifier. Please merge/resolve the following properties to a single compound.`;
    }
    return message;
  }

  getViewerHeight() {
    let viewerHeight;
    if (this.hasStatus('Duplicates') && this.hasStatus('Registered')) {
      viewerHeight = 'small';
    } else if (this.hasStatus('Duplicates') && this.hasStatus('Valid')) {
      viewerHeight = 'medium';
    } else {
      viewerHeight = 'large';
    }
    return viewerHeight;
  }

  render() {

    return (
      <div className="tx-inset--xxs tx-inset--square">
        <CompoundEditForm
          canEditCompound
          compound={this.props.compound}
          compoundLabels={this.state.compoundLabels}
          compoundName={this.state.compoundName}
          compoundReferenceId={this.state.compoundReferenceId}
          error={
            this.hasStatus('Duplicates') ?
              { message: this.getErrorMessage() } :
              undefined
          }
          dropDown={this.hasStatus('Valid') && !this.hasStatus('Duplicates') ? undefined : this.state.dropDownContent}
          onChange={update => this.setState(update)}
          viewerHeight={`registration-drawer__viewer-height--${this.getViewerHeight()}`}
        />
        <div className="registration-drawer__duplicates-drawer-options">
          <ButtonGroup>
            <Button
              link
              invert
              type="primary"
              size="small"
              height="standard"
              heavy
              onClick={this.props.closeDrawer}
            >
              Cancel
            </Button>
            <Button
              type="success"
              size="medium"
              className="registration-drawer__resolve-conflicts"
              heavy
              onClick={this.resolveConflicts}
            >
              <Choose>
                <When condition={this.hasStatus('Duplicates')}>
                  Resolve Conflicts
                </When>
                <Otherwise>
                  Save Changes
                </Otherwise>
              </Choose>
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}

CompoundRegistrationDrawer.propTypes = {
  compound: PropTypes.object,
  compoundValidations: PropTypes.object,
  setCompoundValidations: PropTypes.func,
  closeDrawer: PropTypes.func,
  duplicates: PropTypes.object,
  setRecords: PropTypes.func,
  setDuplicates: PropTypes.func,
  records: PropTypes.array,
  registeredLabels: PropTypes.instanceOf(Immutable.Map)
};
export default CompoundRegistrationDrawer;
