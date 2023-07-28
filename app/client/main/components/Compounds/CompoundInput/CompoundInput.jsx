import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { Button } from '@transcriptic/amino';
import CompoundStore from 'main/stores/CompoundStore';
import CompoundListView from 'main/components/Compounds/CompoundListView';
import ModalActions from 'main/actions/ModalActions';
import SessionStore from 'main/stores/SessionStore';
import CompoundAPI from 'main/api/CompoundAPI';
import FeatureStore from 'main/stores/FeatureStore';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import './CompoundInput.scss';

class CompoundInput extends React.Component {

  constructor(props) {
    super(props);

    this.addToCompounds = this.addToCompounds.bind(this);
    this.onRemove = this.onRemove.bind(this);

    this.state = {
      compounds: Immutable.List()
    };
  }

  componentDidMount() {
    const orgId = this.props.organizationId ? this.props.organizationId :
      SessionStore.getOrg() && SessionStore.getOrg().get('id');
    const compounds = this.props.compounds;
    if (compounds) {
      const smilesKeys = Immutable.List.isList(compounds) ? compounds.map(c => c.value) : [compounds.value];
      if (smilesKeys.length > 0) {
        smilesKeys.forEach(smiles => {
          CompoundAPI.index({
            filters: {
              smiles: encodeURIComponent(smiles),
              organization_id: orgId
            }
          })
            .done((result) => {
              this.setState(prevState => ({
                compounds: Immutable.List([...prevState.compounds,
                  Immutable.Map(result.data[0].attributes)
                    .set('id', result.data[0].id)])
              }));
            });
        });
      }
    }
  }

  onRemove(ids) {
    this.setState({ compounds: Immutable.List(CompoundStore.getByIds(ids)) });
    if (this.props.isSingleCompound) {
      this.props.onCompoundsSelected && this.props.onCompoundsSelected(undefined);
    } else {
      this.props.onCompoundsSelected && this.props.onCompoundsSelected(this.getCompoundObjects(ids));
    }
  }

  buildCompoundObject(smiles) {
    return {
      format: 'Daylight Canonical SMILES',
      value: smiles
    };
  }

  getCompoundObjects(ids) {
    return CompoundStore.getByIds(ids)
      .map((compound) => this.buildCompoundObject(compound.get('smiles')));
  }

  getCompoundObject(id) {
    return this.buildCompoundObject(CompoundStore.getById(id)
      .get('smiles'));
  }

  addToCompounds(ids) {
    const {
      onCompoundsSelected,
      isSingleCompound
    } = this.props;
    const compoundIds = this.state.compounds.map((compound) => compound.get('id'));
    const uniqCompounds = _.uniqWith([...compoundIds, ...ids], _.isEqual);

    this.setState({ compounds: Immutable.List(CompoundStore.getByIds(uniqCompounds)) });

    if (isSingleCompound) {
      onCompoundsSelected && onCompoundsSelected(this.getCompoundObject(uniqCompounds[0]) || undefined);
    } else {
      onCompoundsSelected && onCompoundsSelected(this.getCompoundObjects(uniqCompounds));
    }
  }

  render() {
    const {
      message,
      isSingleCompound,
      readOnly
    } = this.props;
    const { compounds } = this.state;
    const canRegisterCompound = FeatureStore.canRegisterCompound();
    return (
      <React.Fragment>
        <Choose>
          <When condition={compounds.size === 0 && !readOnly}>
            <div className="compound-input tx-stack tx-stack--md">
              <h3 className="tx-type--secondary">{message}</h3>
              <Button
                type="action"
                heavy
                height="short"
                size="small"
                icon="fas fa-plus"
                onClick={_e => ModalActions.open('SEARCH_COMPOUND_MODAL')}
              >
                Select a structure
              </Button>
            </div>
          </When>
          <Otherwise>
            <CompoundListView compounds={compounds} onRemove={readOnly ? undefined : this.onRemove}>
              <If condition={!(isSingleCompound || readOnly)}>
                <div
                  className="tx-stack tx-stack--sm compound-input__add"
                  onClick={() => ModalActions.open('SEARCH_COMPOUND_MODAL')}
                >
                  <i className="fal fa-plus fa-2x compound-input__add--icon" />
                  <p className="tx-type--secondary compound-input__add--text">Click to add a final product</p>
                </div>
              </If>
            </CompoundListView>
          </Otherwise>
        </Choose>
        <CompoundSelectorModal
          onCompoundsSelected={(ids) => this.addToCompounds(ids)}
          title="Define Final Product"
          isSingleSelect={isSingleCompound}
          allowCompoundRegistration={canRegisterCompound}
          disableOrgFilter
        />
      </React.Fragment>
    );
  }
}

CompoundInput.defaultProps = {
  compounds: Immutable.List(),
  isSingleCompound: false
};

CompoundInput.propTypes = {
  compounds: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.instanceOf(Immutable.Iterable)
  ]).isRequired,
  onCompoundsSelected: PropTypes.func,
  message: PropTypes.string,
  isSingleCompound: PropTypes.bool,
  organizationId: PropTypes.string
};

export default CompoundInput;
