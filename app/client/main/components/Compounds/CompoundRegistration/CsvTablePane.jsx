import React     from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _         from 'lodash';
import {
  List,
  Column,
  Popover,
  TagInput,
  Button,
  Molecule,
  ButtonGroup,
  StatusPill,
  Banner,
  DropDown
} from '@transcriptic/amino';
import CSVUtil                from 'main/util/CSVUtil';
import { MultiStepModalPane } from 'main/components/Modal';
import ModalActions           from 'main/actions/ModalActions';
import CompoundAPI            from 'main/api/CompoundAPI';
import CompoundsBulkLabelsDrawer from './CompoundsBulkLabelsDrawer';
import CompoundRegistrationDrawer from './CompoundRegistrationDrawer';

import './CsvTablePane.scss';

const messages = {
  resolve: 'To proceed with registration, please remove invalid compounds and remove or resolve duplicate compounds.',
  fail: 'Failed to register. Please try again.',
  info: 'Compounds already registered will be appended with any new labels specified in file.'
};

class CsvTablePane extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'renderStructure',
      'renderNickname',
      'renderClog',
      'renderTpsa',
      'renderFormula',
      'renderWeight',
      'onDestroySelected',
      'renderRefId',
      'renderLabels',
      'getStatus',
      'renderValidation',
      'registerCompounds',
      'getRecords',
      'isNotValid',
      'onRowClick',
      'onBulkAddition'
    );

    this.state = {
      records: this.props.records,
      compoundValidations: this.props.compoundValidations,
      duplicates: this.props.duplicates,
      selectedRows: {},
      registerFail: false,
      waitingOnResponse: false
    };
  }

  registerCompounds() {
    const compoundValidations = this.state.compoundValidations;
    const validCompounds = this.state.records
      .filter(compound => {
        const isValid = compoundValidations.get(compound.smiles).includes('Valid')
          || compoundValidations.get(compound.smiles).includes('Registered');
        return isValid;
      });

    this.setState({ waitingOnResponse: true, registerFail: false }, () => {
      if (this.props.isPublicCompound) {
        CompoundAPI.createManyPublic(CSVUtil.generateBulkUploadRequest(validCompounds, false, this.props.isPublicCompound), true)
          .done((data) => {
            this.props.onCompoundCreation(data);
            ModalActions.close('BulkCompoundRegistrationModal');
          }).fail(() => {
            this.setState({ registerFail: true });
          }).always(() => {
            this.setState({ waitingOnResponse: false });
          });
      } else {
        CompoundAPI.createMany(CSVUtil.generateBulkUploadRequest(validCompounds, false, this.props.isPublicCompound), true)
          .done((data) => {
            this.props.onCompoundCreation(data);
            ModalActions.close('BulkCompoundRegistrationModal');
          }).fail(() => {
            this.setState({ registerFail: true });
          }).always(() => {
            this.setState({ waitingOnResponse: false });
          });
      }
    });
  }

  onBulkAddition(records) {
    const duplicates = _.clone(this.state.duplicates);
    records.forEach(record => {
      const [compound] = duplicates.get(record.smiles);
      compound.labels = record.labels;
    });
    this.setState({ records, selectedRows: {}, duplicates }, this.props.closeDrawer);
  }

  onAddLabels() {
    this.props.setDrawer(
      <CompoundsBulkLabelsDrawer
        selectedRows={this.state.selectedRows}
        compounds={this.state.records}
        onBulkAddition={this.onBulkAddition}
      />, 'Add Labels');
  }

  hasStatus(status) {
    const { records, compoundValidations } = this.state;
    return records.some(record => compoundValidations.get(record.smiles).includes(status));
  }

  isLabelDisabled() {
    const { compoundValidations } = this.state;
    const ids = Object.keys(this.state.selectedRows).map(id => parseInt(id, 10));
    const records = this.state.records.filter(record => ids.includes(record.id));
    return records.some(record => {
      const hasDuplicates = compoundValidations.get(record.smiles).includes('Duplicates');
      const hasInvalid = compoundValidations.get(record.smiles).includes('Invalid');
      return hasDuplicates || hasInvalid;
    });
  }

  isNotValid() {
    return  _.isEmpty(this.state.records) || this.hasStatus('Duplicates') || this.hasStatus('Invalid');
  }

  getRecords() {
    const records = this.state.records.map((record) => {
      return Immutable.Map(record);
    });
    return Immutable.List(records);
  }

  getStatus(validation) {
    const icons = {
      Valid: 'fa-check',
      Registered: 'fal fa-cabinet-filing',
      Invalid: 'fal fa-exclamation-triangle',
      Restricted: 'fal fa-exclamation-circle',
      Duplicates: 'fal fa-clone'
    };
    return {
      text: validation,
      icon: icons[validation]
    };
  }

  onDestroySelected() {
    const ids = Object.keys(this.state.selectedRows).map(id => parseInt(id, 10));
    const records = _.clone(this.state.records);
    _.remove(records, record => ids.includes(record.id));
    this.setState({ records, awaitingConfirmation: false, selectedRows: {} });
  }

  getBannerMessage() {
    if (this.state.registerFail) {
      return messages.fail;
    }
    return messages.resolve;
  }

  onRowClick(record) {
    let drawerTitle = 'Resolve Duplicates';
    if (!this.state.compoundValidations.get(record.get('smiles')).includes('Duplicates')) {
      drawerTitle = 'Compound Details';
    }
    const isInvalid = this.state.compoundValidations.get(record.get('smiles')).includes('Invalid');
    if (!isInvalid) {
      this.props.setDrawer(
        <CompoundRegistrationDrawer
          compound={record}
          registeredLabels={this.props.registeredLabels}
          records={this.state.records}
          setRecords={(records) => this.setState({ records })}
          duplicates={this.state.duplicates}
          setDuplicates={(duplicates) => this.setState({ duplicates })}
          compoundValidations={this.state.compoundValidations}
          setCompoundValidations={validationMap => this.setState({ compoundValidations: validationMap })}
          closeDrawer={this.props.closeDrawer}
        />, drawerTitle);
    }
  }

  renderNickname(compound) {
    if (this.state.compoundValidations.get(compound.get('smiles')).includes('Duplicates')) {
      return '-';
    }
    return compound.get('name') || '-';
  }

  renderClog(compound) {
    const clogp = parseFloat(compound.get('clogp')).toFixed(2);

    return (
      <p className="tx-type--secondary">
        {isNaN(clogp) ? '-' : clogp}
      </p>
    );
  }

  renderTpsa(compound) {
    const tpsa = parseFloat(compound.get('tpsa')).toFixed(2);
    return (
      <p className="tx-type--secondary"> {isNaN(tpsa) ? '-' : tpsa}</p>
    );
  }

  renderFormula(compound) {
    return <p className="tx-type--secondary">{compound.get('formula') || '-'}</p>;
  }

  renderWeight(compound) {
    return (
      <p className="tx-type--secondary">{compound.get('molecular_weight') || '-'}</p>
    );
  }

  renderStructure(compound) {
    if (this.state.compoundValidations.get(compound.get('smiles')).includes('Invalid')) {
      return (
        <div className="csv-table-pane__invalid-molecule">
          <i className="fal fa-question-circle fa-5x" />
        </div>
      );
    } else {
      return (
        <div className="csv-table-pane__table--molecule">
          <Molecule SMILES={compound.get('smiles')} size="tiny" />
        </div>
      );
    }
  }

  renderRefId(compound) {
    if (this.state.compoundValidations.get(compound.get('smiles')).includes('Duplicates')) {
      return '-';
    }
    return (
      <p className="tx-type--secondary">
        {compound.get('reference_id') || '-'}
      </p>
    );
  }

  renderLabels(compound) {
    if (this.state.compoundValidations.get(compound.get('smiles')).includes('Duplicates')) {
      return '-';
    }
    const labels = compound.get('labels', []);
    if (labels.length > 1) {
      return (
        <Popover
          content={labels ? labels.map(tag => (
            <TagInput.Tag
              key={tag.name}
              text={tag.name}
              icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
              iconType={(tag.organization_id ? 'far' : 'fa')}
            />
          )) : []}
          placement="bottom"
          trigger="hover"
          onModal
        >
          {labels.length > 1 && (
            <div className=" csv-table-pane__table--labels">
              <sup>{labels.length}</sup>
              <h3 className="tx-type--secondary">&nbsp;&nbsp;
                <i className="fas fa-tags" />
              </h3>
            </div>
          )}
        </Popover>
      );
    } else if (labels.length === 1) {
      const [tag] = labels;
      return (
        <Popover
          content={(
            <TagInput.Tag
              key={tag.name}
              text={tag.name}
              icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
              iconType={(tag.organization_id ? 'far' : 'fa')}
            />
            )}
          placement="bottom"
          trigger="hover"
          showWhenOverflow
          onModal
        >
          <TagInput.Tag
            key={tag.name}
            text={tag.name}
            icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
            iconType={(tag.organization_id ? 'far' : 'fa')}
          />
        </Popover>
      );
    } else {
      return '-';
    }
  }

  renderValidation(compound) {
    let validation;
    if (this.state.compoundValidations.get(compound.get('smiles')).includes('Invalid')) {
      validation = 'Invalid';
    } else if (this.state.compoundValidations.get(compound.get('smiles')).includes('Duplicates')) {
      validation = 'Duplicates';
    } else {
      const [validity] = this.state.compoundValidations.get(compound.get('smiles'));
      validation = validity;
    }
    const status = this.getStatus(validation);
    return (
      <StatusPill
        className={`csv-table-pane__pill--${validation} csv-table-pane__pill`}
        text={status.text}
        icon={status.icon}
      />
    );
  }

  render() {
    return (
      <MultiStepModalPane
        {...this.props}
        key="BulkCompoundRegistrationModalSpecify"
        showBackButton
        backBtnName={(
          <div>
            <i className="fa fa-chevron-left" aria-hidden="true" />
            Back
          </div>
        )}
        backBtnClass="btn-primary btn-link btn-heavy"
        nextBtnName="Register"
        nextBtnClass="btn-medium btn-heavy"
        cancelBtnClass="btn-heavy btn-link btn-secondary"
        showCancel
        nextBtnDisabled={this.isNotValid()}
        onNavigateNext={this.registerCompounds}
        waitingOnResponse={this.state.waitingOnResponse}
        classNames={{ 'csv-table-pane__body_scroll': true }}
      >
        <div>
          <If condition={(this.state.records.length &&  this.isNotValid()) || this.state.registerFail}>
            <Banner
              bannerType="error"
              bannerMessage={this.getBannerMessage()}
            />
          </If>
          <div className="csv-table-pane__table-options">
            <ButtonGroup>
              <span style={{ position: 'relative' }} ref={(el) => { this.node = el; }}>
                <DropDown
                  isOpen={this.state.awaitingConfirmation}
                  parentAlignment="right"
                  hideTooltip
                  excludedParentNode={this.node}
                >
                  <span className="csv-table-pane__remove-dropdown">
                    <div>
                      Are you sure you would like to remove the selected compounds?{' '}
                      Removed compounds will not be registered.
                    </div>
                    <div className="csv-table-pane__table-options">
                      <Button
                        invert
                        link
                        heavy
                        type="primary"
                        size="small"
                        onClick={() => this.setState({ awaitingConfirmation: false })}
                      >
                        Cancel
                      </Button>
                      <Button
                        invert
                        heavy
                        type="danger"
                        size="small"
                        onClick={this.onDestroySelected}
                      >
                        Remove
                      </Button>
                    </div>
                  </span>
                </DropDown>
              </span>
            </ButtonGroup>
          </div>
          <List
            loaded
            tallRows
            data={this.getRecords()}
            onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selectedRows: selectedRows }); }}
            onSelectAll={(selectedRows) => { this.setState({ selectedRows: selectedRows }); }}
            selected={this.state.selectedRows}
            disableCard
            onRowClick={this.onRowClick}
            actions={
              [
                {
                  title: 'Remove',
                  text: 'remove',
                  icon: 'fa fa-trash',
                  action: () => this.setState({ awaitingConfirmation: true })
                },
                {
                  title: 'Add Labels',
                  text: 'Add Labels',
                  icon: 'fa fa-plus',
                  action: () => this.onAddLabels(),
                  disabled: this.isLabelDisabled()
                }
              ]
            }
            id="csv-compound-registration"
          >
            <Column renderCellContent={this.renderStructure} header="structure" id="structure" />
            <Column renderCellContent={this.renderNickname} header="name" id="name" />
            <Column renderCellContent={this.renderRefId} header="ref id" id="ref_id" />
            <Column renderCellContent={this.renderFormula} header="formula" id="formula" />
            <Column renderCellContent={this.renderWeight} header="M.W." id="M.W" />
            <Column renderCellContent={this.renderTpsa} header="TPSA" id="tpsa" disableFormatHeader />
            <Column renderCellContent={this.renderClog} header="cLogP" id="clog" disableFormatHeader />
            <Column renderCellContent={this.renderValidation} header="Status" id="validation" />
            <Column
              style={{ width: '80px', padding: '5px' }}
              renderCellContent={this.renderLabels}
              header="labels"
              id="labels"
            />
          </List>
          <If condition={this.state.records.length > 0 && this.hasStatus('Registered')}>
            <Banner
              bannerType="info"
              bannerMessage={messages.info}
            />
          </If>
        </div>
      </MultiStepModalPane>
    );
  }
}

CsvTablePane.propTypes = {
  compounds: PropTypes.array,
  onCompoundCreation: PropTypes.func
};

export default CsvTablePane;
