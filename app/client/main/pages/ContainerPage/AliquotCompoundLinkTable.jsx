import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Button,
  Molecule,
  Popover,
  ZeroState,
  List,
  Table,
  Column,
  Select,
  TextInput,
  LabeledInput
} from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import CompoundView from 'main/components/Compounds/CompoundListView/CompoundView';
import CompoundStore from 'main/stores/CompoundStore';
import CompoundAPI from 'main/api/CompoundAPI';
import NotificationActions from 'main/actions/NotificationActions';
import AcsControls from 'main/util/AcsControls';

import './AliquotCompoundLinkTable.scss';
import BatchAPI from 'main/api/BatchAPI';
import { CompoundBatchesPageActions } from 'main/pages/CompoundsPage/CompoundBatchesActions';

const css = {
  base: 'aliquot-compound-link-table',
  row: 'aliquot-compound-link-table__row',
  button: 'aliquot-compound-link-table__button',
  linkButton: 'aliquot-compound-link-table__link-button',
  zeroState: 'aliquot-compound-link-table__zero-state',
  removeColumn: 'aliquot-compound-link-table__remove-column',
  moleculeColumn: 'aliquot-compound-link-table__molecule-column',
  propertyColumn: 'aliquot-compound-link-table__property-column',
  valueColumn: 'aliquot-compound-link-table__value-column',
  molecule: 'aliquot-compound-link-table__molecule',
  popover: 'aliquot-compound-link-table__popover',
  popoverWrapper: 'aliquot-compound-link-table__popover-wrapper',
};
class AliquotCompoundLinkTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isEditing: false,
      selected: {},
      expanded: {},
      loading: false,
      compound: undefined,
      concentrationError: {},
      batchError: {},
      editingRecord: []
    };
  }

  disableExpandRow = (record) => {
    const compound_link_id = record.get('compound_link_id');
    const batches = this.props.batches.filter((batch) => batch.get('compound_link_id') === compound_link_id);
    return !this.props.canViewBatches || batches.size === 0;
  };

  onUnlink(data, selected) {
    data = data.toJS();
    const unLinkedCompoundLinks = _.keys(selected).map((id => {
      return _.find(data, d => d.id == id);
    }));
    this.props.onUnlink(unLinkedCompoundLinks);
  }

  isValidNumber(value) {
    const validationRegex = '^[0-9]+(.[0-9]+)?$';
    const re = new RegExp(validationRegex);
    return re.test(value);
  }

  onChange(formValue, record) {
    const errorMessage = 'Must be greater than or equal to 0';
    const isValid = this.isValidNumber(formValue);

    const inputFieldKey = record.get('key');
    const isConcentration = (inputFieldKey == 'concentration');
    const isBatch = (inputFieldKey == 'mass_yield' || inputFieldKey == 'purity');
    const errorName = isConcentration ? 'concentrationError' : isBatch ? 'batchError' : '';

    if (isValid) {
      this.removeError(record, errorName);
    } else {
      this.addError(record, errorName, errorMessage);
    }
  }

  removeError(record, errorName) {
    const record_id = record.get('id');
    const isErrorPresent = this.state[errorName][record_id];
    if (isErrorPresent) {
      const updatedError = _.omit(this.state[errorName], record_id);
      this.setState({ [errorName]: updatedError });
    }
  }

  addError(record, errorName, errorMessage) {
    const record_id = record.get('id');
    const isErrorPresent = this.state[errorName][record_id];
    if (!isErrorPresent) {
      this.setState((state) => {
        return { [errorName]: { ...state[errorName], [record_id]: errorMessage } };
      });
    }
  }

  onEditIconClick(record) {
    const editingRecord = [...this.state.editingRecord];
    editingRecord.push(record.get('id'));
    this.setState({ editingRecord: editingRecord, isEditing: true });
  }

  removeEditingRecord(record) {
    const editingRecord = [...this.state.editingRecord];
    const updatedEditingRecord = _.difference(editingRecord, [record.get('id')]);
    this.setState({ editingRecord: updatedEditingRecord, isEditing: !_.isEmpty(updatedEditingRecord) });
  }

  onCancelClick(record, errorName) {
    this.removeEditingRecord(record);
    this.removeError(record, errorName);
  }

  onClickBatchLink = (batch) => {
    CompoundBatchesPageActions.updateState({
      searchInput: batch.get('id')
    });
    this.props.onCompoundClick(batch.get('compound_link_id'), 'Batches');
  };

  renderLinkCompoundButton = (title) => {
    return (
      <Button
        type="success"
        size="small"
        onClick={this.props.onLink}
        disabled={this.state.isEditing}
        height="short"
      >
        {title}
      </Button>
    );
  };

  renderUnLinkCompoundButton = (data, title) => {
    return (
      <Button
        type="secondary"
        size="small"
        onClick={() => this.onUnlink(data, this.state.selected)}
        disabled={Object.keys(this.state.selected).length < 1 || !(this.props.unlinkAction) || this.state.isEditing}
        height="short"
      >
        {title}
      </Button>
    );
  };

  renderStructure = (compound) => {
    return (
      <div
        className={css.molecule}
        onClick={() => {
          if (this.props.onCompoundClick) {
            this.props.onCompoundClick(compound.get('id'));
          }
        }}
      >
        <Molecule SMILES={compound.get('smiles')} size="tiny" />
      </div>
    );
  };

  renderBatchProperties = (batch, canManageBatch, parent_record_id) => {

    const onBatchEdit = (changedValue, record) => {
      this.removeEditingRecord(record);
      const key = record.get('key');
      const value = changedValue.value;

      if (_.isUndefined(value)) {
        return;
      }

      let attributes;
      if (key === 'purity') {
        attributes = { purity: value };
      } else if (key === 'mass_yield') {
        attributes = { post_purification_mass_yield_mg: value };
      }

      BatchAPI.update(batch.get('id'), attributes, { version: 'v1' }).done(() => {
        NotificationActions.createNotification({
          text: 'Batch is Updated',
          isSuccess: true
        });
      }).fail((...response) => NotificationActions.handleError(...response));
    };
    const keyValueData = Immutable.fromJS([
      {
        id: `${parent_record_id}-${batch.get('id')}-purity`,
        key: 'purity',
        value: batch.get('purity')
      },
      {
        id: `${parent_record_id}-${batch.get('id')}-mass`,
        key: 'mass_yield',
        value: batch.get('post_purification_mass_yield_mg')
      }
    ]);

    return (
      <Table
        loaded
        disabledSelection
        data={keyValueData}
        id="properties-table"
        onCancelIconClick={(record) => this.onCancelClick(record, 'batchError')}
        onEditIconClick={(record) => this.onEditIconClick(record)}
        isSaveDisabled={(record) => (!!this.state.batchError[record.get('id')])}
        editableRow={canManageBatch}
        onEditRow={onBatchEdit}
        disableBorder
      >
        <Column
          renderCellContent={(record) => (record.get('key') === 'purity' ? 'Purity' : 'Mass Yield')}
          id="key"
        />
        <Column
          renderCellContent={(record) => (record.get('key') === 'purity' ? record.get('value') + ' %' : record.get('value') + ' mg')}
          renderEditableCellContent={(record) => {
            return (
              <LabeledInput error={this.state.batchError[record.get('id')]}>
                <TextInput
                  name="value"
                  type="number"
                  value={record.get('value')}
                  onChange={(e) => {
                    this.onChange(e.target.value, record);
                  }}
                  validated={{ hasError: this.state.batchError[record.get('id')] }}
                />
              </LabeledInput>
            );
          }
          }
          id="value"
        />
      </Table>
    );
  };

  renderBatchID = (batch) => {
    return (
      <Button
        link
        heavy={false}
        disableFormat
        onClick={() => this.onClickBatchLink(batch)}
      >
        {batch.get('id')}
      </Button>
    );
  };

  renderExpandedRow = (record) => {
    const batches = this.props.batches.filter((batch) => batch.get('compound_link_id') === record.get('compound_link_id'));

    const canManageBatch = AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB);

    const record_id = record.get('id');

    const batchTableColumns = [
      <Column
        renderCellContent={this.renderBatchID}
        header="Batch ID"
        id="batchId"
        key="batch-id"
      />,
      <Column
        renderCellContent={(record) => this.renderBatchProperties(record, canManageBatch, record_id)}
        header="Batch Property"
        id="batchProperty"
        key="batch-property"
        colSpan={3}
      />,
      <Column
        renderCellContent={() => null}
        header="Batch Value"
        id="batchValue"
        key="batch-value"
        showCell={false}
      />,
      <Column
        renderCellContent={() => null}
        header=""
        id="editable"
        key="editable"
        showCell={false}
      />
    ];

    const renderThisColumn = (column) => {
      switch (column.props.id) {
        case 'editable':
          return canManageBatch;
        default:
          return true;
      }
    };
    return (
      (this.props.canViewBatches && batches.size > 0) && (
        <Table
          loaded
          disabledSelection
          data={batches}
          id="batches-table"
          disableBorder
        >
          {batchTableColumns.filter(col => renderThisColumn(col))}
        </Table>
      )
    );
  };

  renderMolecule = (record) => {
    const compoundId = record.get('compound_link_id');
    const compound = CompoundStore.getById(compoundId);

    if (!compound) {
      this.setState({ loading: true });
      CompoundAPI.get(compoundId).done((response) => {
        this.setState({ compound: Immutable.fromJS(response.data), loading: false });
      }).fail((...response) => NotificationActions.handleError(...response));
    }

    return (
      <Popover
        placement="right"
        trigger="hover"
        onModal
        className={css.popover}
        wrapperClassName={css.popoverWrapper}
        content={(
          <CompoundView
            compound={compound || this.state.compound}
            moleculeSize="tiny"
            showPropertiesOnStart
          />
        )}
      >
        { !this.state.loading && this.renderStructure(compound || this.state.compound)}
      </Popover>
    );
  };

  renderProperties = (aliquotCompoundLink) => {
    const options = [
      { name: 'Not set', value: null },
      { name: 'False', value: false },
      { name: 'True', value: true },
    ];
    const keyValueData = Immutable.fromJS([
      {
        id: `${aliquotCompoundLink.get('id')}-concentration`,
        key: 'concentration',
        value: aliquotCompoundLink.get('concentration')
      },
      {
        id: `${aliquotCompoundLink.get('id')}-solubility_flag`,
        key: 'solubility_flag',
        value: aliquotCompoundLink.get('solubility_flag') === null ? '-' : _.toString(aliquotCompoundLink.get('solubility_flag'))
      }
    ]);

    const onSave = (changedValue, record) => {
      this.removeEditingRecord(record);
      const key = record.get('key');
      const value = changedValue.value;

      if (_.isUndefined(value)) {
        return;
      }

      const aliquot_compound_link = aliquotCompoundLink.toJS();
      if (key == 'concentration') { aliquot_compound_link.concentration = value; } else {
        aliquot_compound_link.solubility_flag = value;
      }
      this.props.onEdit(Immutable.fromJS(aliquot_compound_link));
    };

    return (
      <Table
        loaded
        disabledSelection
        data={keyValueData}
        initialState={{ data: keyValueData }}
        editableRow={this.props.editAction}
        onEditIconClick={(record) => this.onEditIconClick(record)}
        onCancelIconClick={(record) => { this.onCancelClick(record, 'concentrationError'); }}
        isSaveDisabled={(record) => (!!this.state.concentrationError[record.get('id')])}
        onEditRow={onSave}
        id="properties-table"
        disableBorder
        nestedTable
      >
        <Column
          renderCellContent={(record) => (record.get('key') == 'concentration' ? 'Concentration' : 'Solubility flag')}
          id="key"
        />
        <Column
          renderCellContent={(record) => (record.get('key') == 'concentration' ? (record.get('value') == null ? '-' : record.get('value') + ' mM') : record.get('value'))}
          renderEditableCellContent={(record) => {
            switch (record.get('key')) {
              case 'solubility_flag':
                return (
                  <Select name="value" value={record.get('value')} options={options} />
                );
              default:
                return (
                  <LabeledInput error={this.state.concentrationError[record.get('id')]}>
                    <TextInput
                      name="value"
                      type="number"
                      value={record.get('value')}
                      onChange={(e) => {
                        this.onChange(e.target.value, record);
                      }}
                      validated={{ hasError: this.state.concentrationError[record.get('id')] }}
                    />
                  </LabeledInput>
                );
            }
          }}
          id="value"
        />
      </Table>
    );
  };

  render() {
    const {
      aliquotCompoundLinks,
      linkAction,
      unlinkAction,
      numPages,
      page,
      onPageChange,
    } = this.props;

    const data = aliquotCompoundLinks.map((element, key) => {
      const a = element.toJS();
      a.id = (key + 1).toString();
      return Immutable.fromJS(a);
    });

    const columns = [
      <Column
        renderCellContent={(record) => this.renderMolecule(record)}
        header="Structure"
        id="structure"
        key="structure"
        relativeWidth={this.props.editAction ? 2 : 1}
      />,
      <Column
        renderCellContent={(record) => this.renderProperties(record)}
        header="Property"
        id="property"
        key="property"
        relativeWidth={2}
        colSpan={3}
      />,
      <Column
        renderCellContent={() => null}
        header="Value"
        id="value"
        key="value"
        relativeWidth={2}
        showCell={false}
      />,
      <Column
        renderCellContent={() => null}
        header=""
        id="editable"
        key="editable"
        relativeWidth={2}
        showCell={false}
      />
    ];

    const renderThisColumn = (column) => {
      switch (column.props.id) {
        case 'editable': return this.props.editAction;
        default: return true;
      }
    };

    return (
      <div className={css.base}>
        {!aliquotCompoundLinks.size && linkAction ? (
          <div className={css.zeroState}>
            <ZeroState
              title="Link compound"
              subTitle="Register compounds before linking them to samples"
              zeroStateSvg="/images/link-compound-illustration.svg"
              button={this.renderLinkCompoundButton('Link compounds')}
            />
          </div>
        ) : (
          <div>
            <div className={css.button}>
              {linkAction && (
              <div className={css.linkButton}>
                {this.renderLinkCompoundButton('Link new compound')}
              </div>
              )}
              {unlinkAction && (
              <div  className={css.linkButton}>
                {this.renderUnLinkCompoundButton(data, 'Unlink compound')}
              </div>
              )}
            </div>
            {!!aliquotCompoundLinks.size && (
              <div>
                <List
                  data={Immutable.fromJS(data)}
                  showPagination={numPages > 1}
                  pageSizeOptions={[4]}
                  currentPage={page}
                  pageSize={4}
                  maxPage={numPages}
                  onPageChange={(...args) => {
                    this.setState({ isEditing: false });
                    onPageChange(...args);
                  }}
                  loaded={!this.state.loading}
                  onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selected: selectedRows }); }}
                  onSelectAll={(selectedRows) => { this.setState({ selected: selectedRows }); }}
                  selected={this.state.selected}
                  showActions
                  id="aliquot_compound_link_table"
                  disableExpandRow={this.disableExpandRow}
                  onExpandRow={(_record, _willBeExpanded, expanded) => this.setState({ expanded })}
                  renderExpandedRow={this.renderExpandedRow}
                  expanded={this.state.expanded}
                  disabledSelection={!this.props.unlinkAction}
                  disableCard
                  toggleRowColor
                >
                  {columns.filter(col => renderThisColumn(col))}
                </List>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

AliquotCompoundLinkTable.propTypes = {
  aliquotCompoundLinks: PropTypes.instanceOf(Immutable.List).isRequired,
  linkAction: PropTypes.bool.isRequired,
  unlinkAction: PropTypes.bool.isRequired,
  editAction: PropTypes.bool.isRequired,
  onLink: PropTypes.func.isRequired,
  onUnlink: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCompoundClick: PropTypes.func,
  page: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default AliquotCompoundLinkTable;
