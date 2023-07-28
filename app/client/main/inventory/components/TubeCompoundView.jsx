import PropTypes  from 'prop-types';
import React      from 'react';
import _          from 'lodash';
import { Spinner, Button, TableLayout, Molecule, InputsController, InplaceInput, Select, InputWithUnits, Validated }         from '@transcriptic/amino';
import CompoundAPI                 from 'main/api/CompoundAPI';
import SessionStore                from 'main/stores/SessionStore';
import ModalActions                from 'main/actions/ModalActions';
import CompoundStore              from 'main/stores/CompoundStore';
import CompoundSelectorModal       from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import './TubeCompoundView.scss';
import FeatureStore                from 'main/stores/FeatureStore';
import FeatureConstants            from '@strateos/features';
import { UnitNames } from 'main/util/unit';
import Immutable from 'immutable';

class TubeCompoundView extends React.Component {
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

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'onCompoundRemove',
      'onCompoundsSelected'
    );

    this.state = {
      compounds: [],
      failedIds: [],
      compoundIds: this.props.existingCompoundIds,
      selectedCompoundLinksData: [],
      containerMap: null,
      selectedIndex: null,
      linkedCompoundsArray: this.props.linkedCompoundsArray === undefined ? [] : this.props.linkedCompoundsArray
    };
  }

  componentDidMount() {
    this.fetchAndAddCompounds(this.props.existingCompoundIds);
    if (this.props.hideCompoundLink) {
      this.onCompoundsSelected(this.props.compoundLinkId);
    }
  }

  fetchAndAddCompounds(selectedCompoundIds) {
    if (_.isEmpty(selectedCompoundIds)) {
      return;
    }
    this.setState({ loading: true }, () => {
      const compoundsArray = [];
      const promises = [];
      selectedCompoundIds.forEach((compoundId, idx) => {
        const options = {
          filters: {
            content: { query: compoundId, search_field: 'id' },
            organization_id: SessionStore.getOrg().get('id')
          }
        };
        const promise = CompoundAPI.index(options);
        promise.done(response => {
          this.processCompoundId(response, compoundsArray, compoundId, idx);
        });
        promises.push(promise);
      });

      Promise.allSettled(promises)
        .then(() => {
          this.updateOnSelection(selectedCompoundIds, compoundsArray);

          const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
          if (this.state.selectedIndex !== undefined) {
            tempLinkedCompoundsArray[this.state.selectedIndex] = [...this.state.compounds];
          }
          this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
          this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
        });
    });
  }

  updateOnSelection(compoundIds, compoundsArray) {
    this.setState(prevState => {
      const prevCompounds = prevState.compounds;
      const prevFailedIds = prevState.failedIds.filter(compound =>  !compoundsArray.includes(compound.id));
      const prevIds = prevState.compoundIds;

      const currSuccessIds = compoundsArray.map(compound => compound.id);
      const currFailedIds = _.difference(compoundIds, currSuccessIds);

      this.props.onError([...prevFailedIds, ...currFailedIds]);

      const currentIds = _.uniq([...prevIds, ...currSuccessIds]);
      this.props.onCompoundsChange(currentIds.join(' '));

      return {
        compounds: [...prevCompounds, ...compoundsArray],
        failedIds: [...prevFailedIds, ...currFailedIds],
        compoundIds: [...currentIds],
        loading: false
      };
    });
  }

  updateOnRemove(remainingCompounds) {
    this.setState(prevState => {
      const currentCompounds = prevState.compounds.filter(compound =>  remainingCompounds.includes(compound.id));
      return {
        compounds: [...currentCompounds],
        compoundIds: [...remainingCompounds]
      };
    });
  }

  processCompoundId(response, compoundsArray, compoundId, idx) {
    const tempLinkedCompoundsArray = this.state.linkedCompoundsArray;
    const selectedIndex = this.state.selectedIndex;

    const compoundConcentration = tempLinkedCompoundsArray && tempLinkedCompoundsArray[selectedIndex] &&
                                  tempLinkedCompoundsArray[selectedIndex][idx] &&
                                  tempLinkedCompoundsArray[selectedIndex][idx].concentration &&
                                  tempLinkedCompoundsArray[selectedIndex][idx].id === compoundId ? tempLinkedCompoundsArray[selectedIndex][idx].concentration : undefined;

    const compoundSolubilityFlag = tempLinkedCompoundsArray && tempLinkedCompoundsArray[selectedIndex] &&
                                   tempLinkedCompoundsArray[selectedIndex][idx] &&
                                   tempLinkedCompoundsArray[selectedIndex][idx].solubility_flag &&
                                   tempLinkedCompoundsArray[selectedIndex][idx].id === compoundId ? tempLinkedCompoundsArray[selectedIndex][idx].solubility_flag : undefined;
    if (response) {
      compoundsArray.push({
        id: compoundId,
        concentration: compoundConcentration,
        solubility_flag: compoundSolubilityFlag
      });
    }
  }

  onCompoundsSelected(selectedCompounds) {
    const newlyAddedCompoundIds = _.difference(selectedCompounds, this.state.compoundIds);
    this.fetchAndAddCompounds(newlyAddedCompoundIds);
  }

  onCompoundRemove(remainingCompounds) {
    this.updateOnRemove(remainingCompounds);
    const remainingCompoundIds = remainingCompounds.join(' ');
    this.props.onCompoundsChange(remainingCompoundIds);

    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
    if (this.state.selectedIndex !== undefined) {
      tempLinkedCompoundsArray[this.state.selectedIndex] = [...this.state.compounds];
    }
    this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
    this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
  }

  displayConcentrationWithUnits(concentration) {
    const [value, unit] = Array.from(concentration.split(/:/));
    return value + ' ' + UnitNames[unit];
  }

  onEditConcentrationAndSolubilityFlag(idx) {
    const compounds = this.state.compounds;
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

    if (tempCompoundLinksData[idx] === undefined) {
      tempCompoundLinksData[idx] = { concentration: undefined, solubility_flag: undefined, error: null };
    }

    tempCompoundLinksData[idx].concentration = compounds[idx].concentration;
    tempCompoundLinksData[idx].solubility_flag = compounds[idx].solubility_flag;
    this.setState({ selectedCompoundLinksData: tempCompoundLinksData });
  }

  onSaveConcentrationAndSolubilityFlag(idx) {
    const compoundsArray = [...this.state.compounds];
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
    const selectedCompoundLinks = this.state.selectedCompoundLinksData;

    if (tempCompoundLinksData[idx].error == null) {
      compoundsArray[idx].concentration = selectedCompoundLinks[idx] === undefined ||
                                          selectedCompoundLinks[idx].concentration === undefined ||
                                          isNaN(parseFloat(selectedCompoundLinks[idx].concentration)) ? undefined : selectedCompoundLinks[idx].concentration;
    } else {
      compoundsArray[idx].concentration = undefined;
    }
    compoundsArray[idx].solubility_flag = selectedCompoundLinks[idx] === undefined ||
                                          selectedCompoundLinks[idx].solubility_flag === undefined ||
                                          selectedCompoundLinks[idx].solubility_flag === '' ||
                                          selectedCompoundLinks[idx].solubility_flag === 'Not set' ? undefined : selectedCompoundLinks[idx].solubility_flag;

    tempCompoundLinksData[idx].concentration = undefined;
    tempCompoundLinksData[idx].solubility_flag = undefined;
    tempCompoundLinksData[idx].error = null;

    if (this.state.selectedIndex !== undefined) {
      tempLinkedCompoundsArray[this.state.selectedIndex] = [...this.state.compounds];
    }
    this.setState({ compounds: compoundsArray, selectedCompoundLinksData: tempCompoundLinksData, linkedCompoundsArray: tempLinkedCompoundsArray });
    this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
    return new Promise((resolve) => { resolve('Saved'); });
  }

  onCancelConcentrationAndSolubilityFlag(idx) {
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

    tempCompoundLinksData[idx].concentration = undefined;
    tempCompoundLinksData[idx].solubility_flag = undefined;
    tempCompoundLinksData[idx].error = null;
    this.setState({ selectedCompoundLinksData: tempCompoundLinksData });

    return new Promise((resolve) => { resolve('Cancelled'); });
  }

  onDeleteConcentrationAndSolubilityFlag(idx) {
    const compoundsArray = [...this.state.compounds];
    const compoundIdsArray = [...this.state.compoundIds];
    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];

    compoundsArray.splice(idx, 1);
    compoundIdsArray.splice(idx, 1);

    if (this.state.selectedIndex !== undefined) {
      tempLinkedCompoundsArray[this.state.selectedIndex] = compoundsArray;
    }
    this.setState({ compounds: compoundsArray, compoundIds: compoundIdsArray, linkedCompoundsArray: tempLinkedCompoundsArray });
    this.props.getLinkedCompoundArray(tempLinkedCompoundsArray);
    this.props.onCompoundsChange(compoundIdsArray.join(' '));
    return new Promise((resolve) => { resolve('Deleted'); });
  }

  onInputChangeCallback(state, idx) {
    const c = state.concentration;
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

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

  renderCompoundsView() {
    const { Block, Header, Body, Row, HeaderCell, BodyCell } = TableLayout;
    const compound_ids = this.state.compoundIds;
    return (
      <div>
        <p className="tube-compounds__link-compounds-label">Linked Compounds</p>
        {compound_ids !== undefined && compound_ids.length !== 0 ? (
          <div>
            {!this.props.hideCompoundLink && (
              <div className="tube-compounds__link-compounds-btn">
                <Button
                  onClick={() => ModalActions.openWithData(CompoundSelectorModal.MODAL_ID)}
                  type="action"
                  heavy
                >
                  Link Compounds
                </Button>
              </div>
            )}
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
                {compound_ids.map((id, idx) => {
                  const compound = CompoundStore.getById(id);
                  return (
                    <Row key={id}>
                      <BodyCell>
                        <Molecule SMILES={compound && compound.get('smiles')}  height="60px" width="120px" size="tiny" />
                      </BodyCell>
                      <BodyCell>
                        {compound && compound.get('formula')}
                      </BodyCell>
                      <BodyCell colSpan="3">
                        {this.renderConcentrationAndSolubilityFlagInput(idx)}
                      </BodyCell>
                    </Row>
                  );
                })}
              </Body>
            </Block>
          </div>
        ) : (
          <div className="tube-compounds__link-compounds-btn">
            <span className="tube-compounds__zero-state-text">No linked compounds</span>
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

  renderConcentrationAndSolubilityFlagInput(idx) {
    const compounds = this.state.compounds;
    let selected_compound = {};
    if (compounds !== undefined && compounds[idx] !== undefined) {
      selected_compound = compounds[idx];
    }

    const concentration = (this.state.selectedCompoundLinksData[idx] !== undefined && this.state.selectedCompoundLinksData[idx].concentration) || ':millimolar';
    const tempCompoundLinksData = [...this.state.selectedCompoundLinksData];

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
            viewComponent: selected_compound.concentration === undefined ? <p> - </p> : this.displayConcentrationWithUnits(selected_compound.concentration),
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
            viewComponent: selected_compound.solubility_flag === undefined ? <p> - </p> : _.toString(selected_compound.solubility_flag),
            editComponent: <Select
              name="solubility_flag"
              value={(this.state.selectedCompoundLinksData[idx] !== undefined && this.state.selectedCompoundLinksData[idx].solubility_flag) || selected_compound.solubility_flag}
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

  render() {
    const canRegisterCompound = FeatureStore.canRegisterCompound();
    const currentOrgId = SessionStore.getOrg().get('id');
    return (
      <Choose>
        <When condition={this.state.loading}>
          <Spinner />
        </When>
        <Otherwise>
          <If condition={FeatureStore.hasFeature(FeatureConstants.LINK_COMPOUND_RESOURCE)}>
            <React.Fragment>
              {this.renderCompoundsView()}
              <CompoundSelectorModal
                onCompoundsSelected={this.onCompoundsSelected}
                title="Link Compound"
                allowCompoundRegistration={canRegisterCompound}
                searchPublicAndPrivateByOrgId={currentOrgId}
                disableOrgFilter
              />
            </React.Fragment>
          </If>
        </Otherwise>
      </Choose>
    );
  }
}

TubeCompoundView.defaultProps = {
  existingCompoundIds: []
};

TubeCompoundView.propTypes = {
  /**
   * existing compounds in the Tube if any will be passed in this
   */
  existingCompoundIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCompoundsChange: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  hideCompoundLink: PropTypes.bool,
  compoundLinkId: PropTypes.arrayOf(PropTypes.string),
  containerArray: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  containerIndex: PropTypes.number.isRequired,
  deletedIndex: PropTypes.number,
  getLinkedCompoundArray: PropTypes.func.isRequired,
  linkedCompoundsArray: PropTypes.arrayOf(PropTypes.instanceOf(Object))
};

export default TubeCompoundView;
