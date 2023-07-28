import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import {
  Plate,
  PlateSelectLogic,
  LabeledInput,
  Validated,
  TextInput,
  Select,
  Button,
  TableLayout,
  InplaceInput,
  InputsController,
  Molecule,
  InputWithUnits,
} from '@transcriptic/amino';

import _, { isNaN } from 'lodash';

import SelectStorage     from 'main/components/Input';
import WellInputs from 'main/components/WellInputs';
import PlateAndInfo from 'main/components/PlateAndInfo';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import CompoundStore from 'main/stores/CompoundStore';
import ModalActions from 'main/actions/ModalActions';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

import { UnitNames } from 'main/util/unit';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import SessionStore from 'main/stores/SessionStore';
import PlateCreateLogic from './PlateCreateLogic';

import './PlateCreate.scss';

class PlateCreate extends React.Component {

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.containerMap === null) {
      return ({ ...prevState, containerMap: nextProps.containerArray });
    } else if (prevState.containerMap.size > nextProps.containerArray.size) {
      if (nextProps.deletedIndex && nextProps.deletedIndex === prevState.selectedIndex &&  prevState.selectedIndex === 0) {
        return ({ ...prevState, selectedIndex: nextProps.deletedIndex + 1 });
      }
      if (prevState.linkedCompoundsArray !== nextProps.linkedCompoundsArray) {
        const tempLinkedCompoundsArray = [...prevState.linkedCompoundsArray];
        !tempLinkedCompoundsArray.isEmpty && tempLinkedCompoundsArray.splice(nextProps.deletedIndex, 1);
        nextProps.getLinkedCompoundArray(tempLinkedCompoundsArray);
        return ({ ...prevState, linkedCompoundsArray: tempLinkedCompoundsArray });
      }
    }
    return ({ ...prevState, containerMap: nextProps.containerArray, selectedIndex: nextProps.containerIndex });
  }

  constructor(props, context) {
    super(props, context);
    this.onClearSelected = this.onClearSelected.bind(this);
    this.onColClicked = this.onColClicked.bind(this);
    this.onRowClicked = this.onRowClicked.bind(this);
    this.onSelectAllClicked = this.onSelectAllClicked.bind(this);
    this.onSelectedValueChange = this.onSelectedValueChange.bind(this);
    this.onWellClicked = this.onWellClicked.bind(this);

    this.state = {
      linkedCompoundsArray: this.props.linkedCompoundsArray === undefined ? [] : this.props.linkedCompoundsArray,
      containerMap: null,
      selectedIndex: null,
      compoundLinks: [],
      selectedCompoundLinksData: []
    };
  }

  componentWillUnmount() {
    if (this.props.containerArray.length > 0) {
      this.props.getLinkedCompoundArray(this.state.linkedCompoundsArray);
    }
  }

  onWellClicked(wellIndex, e) {
    let wellMap = this.props.inputValues.get('wellMap');
    wellMap = PlateSelectLogic.wellClicked(
      wellMap,
      wellIndex,
      e.ctrlKey || e.metaKey,
      false,
      true
    );
    return this.inputChange('wellMap', wellMap);
  }

  onRowClicked(row, e) {
    let wellMap = this.props.inputValues.get('wellMap');
    const rows = this.props.inputValues.get('rows');
    const cols = this.props.inputValues.get('cols');
    wellMap = PlateSelectLogic.rowClicked(
      wellMap,
      row,
      rows,
      cols,
      e.ctrlKey || e.metaKey,
      false,
      true
    );
    return this.inputChange('wellMap', wellMap);
  }

  onColClicked(col, e) {
    let wellMap = this.props.inputValues.get('wellMap');
    const rows = this.props.inputValues.get('rows');
    const cols = this.props.inputValues.get('cols');
    wellMap = PlateSelectLogic.colClicked(
      wellMap,
      col,
      rows,
      cols,
      e.ctrlKey || e.metaKey,
      false,
      true
    );
    return this.inputChange('wellMap', wellMap);
  }

  onSelectAllClicked() {
    let wellMap = this.props.inputValues.get('wellMap');
    const rows = this.props.inputValues.get('rows');
    const cols = this.props.inputValues.get('cols');
    wellMap = PlateSelectLogic.selectAllClicked(
      wellMap,
      rows,
      cols,
      false,
      true
    );
    return this.inputChange('wellMap', wellMap);
  }

  onSelectedValueChange(name, value, hasError) {
    let wellMap = this.props.inputValues.get('wellMap');
    wellMap = PlateSelectLogic.selectedValueChange(wellMap, name, value);
    wellMap = PlateSelectLogic.selectedValueChange(
      wellMap,
      'hasError',
      hasError
    );
    return this.inputChange('wellMap', wellMap);
  }

  onClearSelected() {
    let wellMap = this.props.inputValues.get('wellMap');
    wellMap = PlateSelectLogic.clearSelected(wellMap);
    return this.inputChange('wellMap', wellMap);
  }

  inputChange(name, value) {
    if (name === 'wellMap') {
      this.clearCompoundsOnUnSelectedWells(value);
    }
    return this.props.onInputValuesChange(
      this.props.inputValues.set(name, value)
    );
  }

  clearCompoundsOnUnSelectedWells(wellMap) {
    if (this.state.linkedCompoundsArray !== undefined && this.state.linkedCompoundsArray[this.state.selectedIndex] !== undefined) {
      const clearedWells = Object.keys(this.state.linkedCompoundsArray[this.state.selectedIndex]).filter(x => !Object.keys(wellMap.toJS()).includes(x));
      const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
      clearedWells.map((i) => delete tempLinkedCompoundsArray[this.state.selectedIndex][i]);
      this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
    }
  }

  getSelectedWells() {
    const wellMap = this.props.inputValues.get('wellMap');
    return wellMap.filter(v => v.get('selected'));
  }

  addToLinkedCompounds(ids, indices) {
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray] || [];
    if (tempLinkedCompoundsArray[this.state.selectedIndex] === undefined) {
      tempLinkedCompoundsArray[this.state.selectedIndex] = {};
    }
    indices.forEach(i => {
      const uniqCompoundLinks = tempLinkedCompoundsArray[this.state.selectedIndex][i] === undefined ? [] : tempLinkedCompoundsArray[this.state.selectedIndex][i].compoundLinks;

      ids.forEach(id => {
        const foundLink = uniqCompoundLinks.filter((compoundLink) => (compoundLink.id === id));
        if (_.isEmpty(foundLink)) {
          uniqCompoundLinks.push({
            id: id,
            concentration: undefined,
            solubility_flag: undefined
          });
        }
      });
      tempLinkedCompoundsArray[this.state.selectedIndex][i] = { compoundLinks: uniqCompoundLinks };
    });
    this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
    this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
  }

  displayConcentrationWithUnits(concentration) {
    const [value, unit] = Array.from(concentration.split(/:/));
    return value + ' ' + UnitNames[unit];
  }

  onEditConcentrationAndSolubilityFlag(idx) {
    const selectedIndices = this.getSelectedWells().keySeq().toArray();
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];
    const concentration = tempLinkedCompoundsArray[this.state.selectedIndex][selectedIndices[0]].compoundLinks[idx].concentration;

    if (tempCompoundLinksData[idx] === undefined) {
      tempCompoundLinksData[idx] = { concentration: undefined, solubility_flag: undefined, error: null };
    }
    tempCompoundLinksData[idx].concentration = concentration;
    tempCompoundLinksData[idx].solubility_flag = tempLinkedCompoundsArray[this.state.selectedIndex][selectedIndices[0]].compoundLinks[idx].solubility_flag;
    this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
  }

  onSaveConcentrationAndSolubilityFlag(idx) {
    const selectedIndices = this.getSelectedWells().keySeq().toArray();
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];
    const selectedIndex = this.state.selectedIndex;
    const selectedCompoundLinks = this.state.selectedCompoundLinksData;

    for (let i = 0; i < selectedIndices.length; i++) {
      if (tempCompoundLinksData[idx].error == null) {
        tempLinkedCompoundsArray[selectedIndex][selectedIndices[i]].compoundLinks[idx].concentration = selectedCompoundLinks[idx] === undefined ||
                                                                                                       selectedCompoundLinks[idx].concentration === undefined ||
                                                                                                       isNaN(parseFloat(selectedCompoundLinks[idx].concentration)) ? undefined : selectedCompoundLinks[idx].concentration;
      } else {
        tempLinkedCompoundsArray[selectedIndex][selectedIndices[i]].compoundLinks[idx].concentration = undefined;
      }
      tempLinkedCompoundsArray[selectedIndex][selectedIndices[i]].compoundLinks[idx].solubility_flag = selectedCompoundLinks[idx] === undefined ||
                                                                                                       selectedCompoundLinks[idx].solubility_flag === undefined ||
                                                                                                       selectedCompoundLinks[idx].solubility_flag === '' ||
                                                                                                       selectedCompoundLinks[idx].solubility_flag === 'Not set' ? undefined : selectedCompoundLinks[idx].solubility_flag;
    }
    tempCompoundLinksData[idx].concentration = undefined;
    tempCompoundLinksData[idx].solubility_flag = undefined;
    tempCompoundLinksData[idx].error = null;
    this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray, selectedCompoundLinksData: tempCompoundLinksData });
    return new Promise((resolve) => { resolve('Saved'); });
  }

  onDeleteConcentrationAndSolubilityFlag(idx) {
    const selectedIndices = this.getSelectedWells().keySeq().toArray();
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];

    for (let i = 0; i < selectedIndices.length; i++) {
      tempLinkedCompoundsArray[this.state.selectedIndex][selectedIndices[i]].compoundLinks.splice(idx, 1);
    }
    this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
    this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
    return new Promise((resolve) => { resolve('Deleted'); });
  }

  onCancelConcentrationAndSolubilityFlag(idx) {
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

    // tempCompoundLinksData is a temporary array which stores the state of the user inputs (concentration and solubility flag)
    // and then passes it to the linkedCompoundsArray. When we click on edit on any one of the inplace input component provided
    // for the user, the tempCompoundLinksData gets populated with the value present in that row. When we click on cancel the
    // temporary data we have set should be removed for that line to later repopulate it when required.
    tempCompoundLinksData[idx].concentration = undefined;
    tempCompoundLinksData[idx].solubility_flag = undefined;
    tempCompoundLinksData[idx].error = null;
    this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
    return new Promise((resolve) => { resolve('Cancelled'); });
  }

  onInputChangeCallback(state, idx) {
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

    const c = state.concentration;
    if ((typeof c == 'string' && !isNaN(c) && !isNaN(parseFloat(c)) && parseFloat(c) > 0) || c === undefined) {
      tempCompoundLinksData[idx].error = null;
      this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
    } else {
      if (isNaN(parseFloat(c)) || c == '') {
        tempCompoundLinksData[idx].error = 'Must be a numeric';
      } else if (parseFloat(c) <= 0) {
        tempCompoundLinksData[idx].error = 'Must be positive';
      }
      this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
    }
    const s = state.solubility_flag;
    if (s === undefined || s == '') {
      tempCompoundLinksData[idx].solubility_flag = state.solubility_flag;
      this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
    }
  }

  renderInplaceInput(idx) {
    const selectedIndices = this.getSelectedWells().keySeq().toArray();
    const selectedIndex = this.state.selectedIndex;
    const linkedCompoundsArray = this.state.linkedCompoundsArray;
    let selectedWell = {};
    if (selectedIndices.length !== 0 && linkedCompoundsArray[selectedIndex] !== undefined && linkedCompoundsArray[selectedIndex][selectedIndices[0]] !== undefined) {
      selectedWell = linkedCompoundsArray[selectedIndex][selectedIndices[0]];
    }

    const concentration = (this.state.selectedCompoundLinksData[idx] !== undefined && this.state.selectedCompoundLinksData[idx].concentration) || ':millimolar';
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];
    const hasSolubiltyFlag = (this.state.selectedCompoundLinksData[idx] !== undefined && this.state.selectedCompoundLinksData[idx].solubility_flag) || selectedWell.compoundLinks[idx].solubility_flag;

    return (
      <InputsController
        inputChangeCallback={(state) => this.onInputChangeCallback(state, idx)}
      >
        <InplaceInput
          fullWidth
          onEdit={() => this.onEditConcentrationAndSolubilityFlag(idx)}
          onSave={() => this.onSaveConcentrationAndSolubilityFlag(idx)}
          onCancel={() => this.onCancelConcentrationAndSolubilityFlag(idx)}
          onDelete={() => this.onDeleteConcentrationAndSolubilityFlag(idx)}
          content={
        [
          {
            id: 1,
            viewComponent: selectedWell.compoundLinks[idx].concentration === undefined ? <p> - </p> : this.displayConcentrationWithUnits(selectedWell.compoundLinks[idx].concentration),
            editComponent:
  <Validated
    error={this.state.selectedCompoundLinksData[idx] === undefined ? null : this.state.selectedCompoundLinksData[idx].error}
    force_validate
  >
    <InputWithUnits
      dimension="amount_concentration"
      preserveUnit
      name="concentration"
      value={concentration}
      onChange={(e) => {
        tempCompoundLinksData[idx].concentration = e.target.value;
        this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
      }}
    />
  </Validated>
          },
          {
            id: 2,
            viewComponent: selectedWell.compoundLinks[idx].solubility_flag === undefined ? <p> - </p> : _.toString(selectedWell.compoundLinks[idx].solubility_flag),
            editComponent: <Select
              name="solubility_flag"
              value={hasSolubiltyFlag}
              options={[
                { value: undefined, name: 'Not set' },
                { value: true, name: 'True' },
                { value: false, name: 'False' }
              ]}
              onChange={(event) => {
                tempCompoundLinksData[idx].solubility_flag = event.target.value;
                this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
              }}
            />
          }
        ]}
        />
      </InputsController>
    );
  }

  renderLinkedCompounds() {
    const { Block, Header, Body, Row, HeaderCell, BodyCell } = TableLayout;
    const selectedIndices = this.getSelectedWells().keySeq().toArray();
    const linkedCompoundsArray = this.state.linkedCompoundsArray;
    const selectedIndex = this.state.selectedIndex;
    return (
      <div>
        <p className="plate-create__link-compounds-label">Linked Compounds</p>
        {selectedIndices.length !== 0 && linkedCompoundsArray !== undefined && linkedCompoundsArray[selectedIndex] !== undefined &&
        linkedCompoundsArray[selectedIndex][selectedIndices[0]] !== undefined && linkedCompoundsArray[selectedIndex][selectedIndices[0]].compoundLinks !== undefined &&
        linkedCompoundsArray[selectedIndex][selectedIndices[0]].compoundLinks.length > 0 ? (
          <div>
            <div className="plate-create__link-compounds-btn">
              <Button
                onClick={() => ModalActions.openWithData(CompoundSelectorModal.MODAL_ID)}
                type="action"
                heavy
              >
                Link Compounds
              </Button>
            </div>
            <Block toggleRowColor>
              <Header>
                <Row>
                  <HeaderCell>
                    Structure
                  </HeaderCell>
                  <HeaderCell>
                    Formula
                  </HeaderCell>
                  <HeaderCell>
                    Concentration
                  </HeaderCell>
                  <HeaderCell>
                    Solubility Flag
                  </HeaderCell>
                  <HeaderCell />
                </Row>
              </Header>
              <Body>
                {selectedIndices.length !== 0 && linkedCompoundsArray !== undefined && linkedCompoundsArray[selectedIndex] !== undefined &&
                linkedCompoundsArray[selectedIndex][selectedIndices[0]] !== undefined && linkedCompoundsArray[selectedIndex][selectedIndices[0]].compoundLinks.map((compoundLink, idx) => {
                  const compound = CompoundStore.getById(compoundLink.id);
                  return (
                    <Row key={compound.get('id')}>
                      <BodyCell>
                        <Molecule SMILES={compound.get('smiles')} height="60px" width="120px" size="tiny" />
                      </BodyCell>
                      <BodyCell>
                        {compound.get('formula')}
                      </BodyCell>
                      <BodyCell colSpan="3">
                        {this.renderInplaceInput(idx)}
                      </BodyCell>
                    </Row>
                  );
                })}
              </Body>
            </Block>
          </div>
          ) : (
            <div>
              <span className="plate-create__zero-state-text">No linked compounds</span>
              <Button
                onClick={() => ModalActions.openWithData(CompoundSelectorModal.MODAL_ID)}
                type="action"
                heavy
              >
                Link Compounds
              </Button>
            </div>
          )}
      </div>
    );
  }

  render() {
    const selectedWells = this.getSelectedWells();
    const errors = PlateCreateLogic.errors(this.props.inputValues);
    const forceValidate = this.props.inputValues.get('force_validate');
    const canLinkCompounds = FeatureStore.hasFeature(FeatureConstants.LINK_COMPOUND_RESOURCE);
    const canRegisterCompound = FeatureStore.canRegisterCompound();

    const containerType = ContainerTypeStore.getById(this.props.inputValues.get('containerType'));
    const lids = [];
    const currentOrgId = SessionStore.getOrg().get('id');
    if (containerType) {
      lids.push(
        ...containerType
          .get('acceptable_lids')
          .concat(['uncovered'])
          .map(lid => ({ value: lid }))
      );
    }

    return (
      <div className="plate-create">
        <p>
          <strong>Instructions: </strong>
          <span>
            Click a well, letter, or number to indicate wells with volume
            (custom naming wells is optional).
          </span>
          <If condition={this.props.onUseCSV != undefined}>
            <span>
              {' Or, '}
              <a onClick={this.props.onUseCSV}>use our CSV template</a>
              {' to map your samples.'}
            </span>
          </If>
        </p>
        <div className="plate-create__details row">
          <div className="col-xs-12">
            <LabeledInput label="Plate Name">
              <Validated error={errors.get('name')} force_validate={forceValidate}>
                <TextInput
                  value={this.props.inputValues.get('name')}
                  onChange={e => this.inputChange('name', e.target.value)}
                />
              </Validated>
            </LabeledInput>
          </div>
        </div>
        <div className="plate-create__details row">
          <div className="col-xs-4">
            <LabeledInput label="Cover Status">
              <Select
                value={this.props.inputValues.get('cover', 'uncovered')}
                options={lids}
                onChange={e => this.inputChange('cover', e.target.value === 'uncovered' ? null : e.target.value)}
              />
            </LabeledInput>
          </div>
          <div className="col-xs-4">
            <LabeledInput label="Storage Temp">
              <SelectStorage
                value={this.props.inputValues.get('storage')}
                onChange={e => this.inputChange('storage', e.target.value)}
              />
            </LabeledInput>
          </div>
          <div className="col-xs-4">
            <LabeledInput label="Container Type">
              <TextInput disabled value={this.props.inputValues.get('containerType')} />
            </LabeledInput>
          </div>
        </div>
        <PlateAndInfo
          plate={(
            <Plate
              rows={this.props.inputValues.get('rows')}
              cols={this.props.inputValues.get('cols')}
              wellMap={this.props.inputValues.get('wellMap')}
              showSelectAll
              isNew
              onWellClick={this.onWellClicked}
              onRowClick={this.onRowClicked}
              onColClick={this.onColClicked}
              onSelectAllClick={this.onSelectAllClicked}
              width="auto"
            />
          )}
          info={
            (selectedWells.size > 0) && (
              <WellInputs
                selectedWells={selectedWells}
                forceValidate={forceValidate}
                onChange={this.onSelectedValueChange}
                onClear={this.onClearSelected}
                maxVolume={this.props.containerType.get('well_volume_ul')}
              />
            )}
        />
        {canLinkCompounds && this.getSelectedWells().keySeq().toArray().length !== 0 && this.renderLinkedCompounds()}
        <div className="plate-create__error">
          <If
            condition={forceValidate && errors.get('globalError') != undefined}
          >
            <div className="alert alert-danger">
              {errors.get('globalError')}
            </div>
          </If>
        </div>
        {canLinkCompounds && (
          <CompoundSelectorModal
            onCompoundsSelected={(ids) => this.addToLinkedCompounds(ids, selectedWells.keySeq().toArray())}
            title="Link Compound"
            allowCompoundRegistration={canRegisterCompound}
            searchPublicAndPrivateByOrgId={currentOrgId}
            disableOrgFilter
          />
        )}
      </div>
    );
  }
}

PlateCreate.propTypes = {
  inputValues: PropTypes.instanceOf(Immutable.Map).isRequired,
  containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
  onInputValuesChange: PropTypes.func,
  onUseCSV: PropTypes.func,
  containerArray: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  containerIndex: PropTypes.number.isRequired,
  deletedIndex: PropTypes.number,
  getLinkedCompoundArray: PropTypes.func.isRequired,
  linkedCompoundsArray: PropTypes.arrayOf(PropTypes.instanceOf(Object))
};

export default PlateCreate;
