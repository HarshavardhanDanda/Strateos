import React     from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _         from 'lodash';
import UserActions            from 'main/actions/UserActions';
import CompoundAPI            from 'main/api/CompoundAPI';
import { CompoundHeading }    from 'main/components/Compounds';
import { MultiStepModalPane } from 'main/components/Modal';
import ConnectToStores        from 'main/containers/ConnectToStoresHOC';
import CompoundStore          from 'main/stores/CompoundStore';
import SessionStore           from 'main/stores/SessionStore';
import UserStore              from 'main/stores/UserStore';
import Urls                   from 'main/util/urls';
import CompoundEditForm       from 'main/components/Compounds/CompoundRegistration/CompoundEditForm';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import LibraryAPI from 'main/api/LibraryAPI';

import {
  Banner,
  MoleculeViewer
} from '@transcriptic/amino';

class SpecifyPane extends React.Component {
  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      compoundName: '',
      compoundReferenceId: '',
      compoundLabels: [],
      error: undefined,
      libraries: []
    };

    _.bindAll(
      this,
      'canViewLibraries');
  }

  componentDidMount() {
    // Fetch the user since we use the UserStore
    if (this.props.compound) {
      const userId = this.props.compound.get('created_by');
      UserActions.load(userId);
    }
    this.canViewLibraries() && this.fetchLibraries();
  }

  canViewLibraries() {
    return AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && (SessionStore.isRecordWithinCurrOrg(this.props.compound) || this.props.isPublicCompound);
  }

  fetchLibraries() {
    LibraryAPI.getLibraries({ compound_id: this.props.compoundId })
      .done((response) => {
        const libraries = response.data.map((lib) => ({ id: lib.id, ...lib.attributes }));
        this.setState({
          libraries
        });
      });
  }

  saveNewCompound() {
    this.setState({ error: undefined, pending: true }, async () => {
      try {
        const { compoundSource, compound, isPublicCompound } = this.props;
        const orgId = SessionStore.getOrg() && SessionStore.getOrg().get('id');
        const attributes = isPublicCompound ? {
          compound: {
            [compoundSource]: compound.get(compoundSource)
          }
        } : {
          compound: {
            [compoundSource]: compound.get(compoundSource)
          },
          organization_id: orgId
        };

        if (this.state.compoundName.trim()) {
          attributes.name = this.state.compoundName.trim();
        }
        if (this.state.compoundReferenceId.trim()) {
          attributes.reference_id = this.state.compoundReferenceId.trim();
        }
        if (this.state.compoundLabels.length > 0) {
          attributes.labels = this.state.compoundLabels;
        }

        const created = isPublicCompound
          ? (await CompoundAPI.createPublicCompound({ attributes })).data
          : (await CompoundAPI.create({ attributes })).data;
        this.useOrViewCompound(created.id);
      } catch (e) {
        this.setState({
          error: {
            title: 'Failed to save compound',
            message: e.responseJSON.message
          }
        });
      } finally {
        this.setState({ pending: false });
      }
    });
  }

  isToBeUsed() {
    const { data } = this.props;
    return data && data.get('onUseCompound');
  }

  useOrViewCompound(id) {
    const onUseCompound = this.isToBeUsed();
    return onUseCompound ? onUseCompound(id) :  this.viewCompound(id);
  }

  viewCompound(id) {
    this.context.router.history.push(Urls.compound(id || this.props.compound.get('id')));
  }

  addLabel(label) {
    this.setState(
      ({ compoundLabels }) => ({ compoundLabels: _.uniqWith([...compoundLabels, label], _.isEqual) })
    );
  }

  removeLabel(label) {
    this.setState(
      ({ compoundLabels }) => ({ compoundLabels: compoundLabels.filter(l => !_.isEqual(label, l)) })
    );
  }

  render() {
    const { compoundExists, compound, createdByUser } = this.props;
    const { pending, error, compoundLabels, compoundName, compoundReferenceId } = this.state;

    const beforeNavigate = () => {
      if (compoundExists) {
        this.useOrViewCompound(compound.get('id'));
      } else {
        this.saveNewCompound();
      }
    };

    const nextBtnName = () => {
      if (compoundExists) { return this.isToBeUsed() ?  'Use Compound' : 'View Compound'; }
      return 'Create Compound';
    };

    return (
      <MultiStepModalPane
        {...this.props}
        key={'CompoundRegistrationModalSpecify'}
        waitingOnResponse={!!pending}
        backBtnDisabled={!!pending}
        beforeNavigateNext={beforeNavigate}
        nextBtnName={nextBtnName()}
      >
        <If condition={!!compound}>
          <Choose>
            <When condition={!compoundExists}>
              <CompoundEditForm
                compound={compound}
                compoundLabels={compoundLabels}
                compoundName={compoundName}
                compoundReferenceId={compoundReferenceId}
                error={error}
                canEditCompound
                onChange={(update) => this.setState(update)}
              />
            </When>
            <Otherwise>
              <div className="row tx-stack">
                <div className="col-md-12 tx-stack__block--xxs">
                  <Banner
                    bannerType="warning"
                    bannerTitle="Duplicate Molecule"
                    bannerMessage="This molecule has already been registered and cannot be registered again."
                  />
                </div>
                <div className="col-md-12 tx-stack__block--xxxs">
                  <CompoundHeading
                    createdByUser={createdByUser}
                    compound={compound}
                    canViewLibraries={this.canViewLibraries()}
                    libraries={this.state.libraries}
                    onModal
                  />
                </div>
                <div className="col-md-12">
                  <MoleculeViewer
                    SMILES={compound.get('smiles')}
                    properties={compound.toJS()}
                  />
                </div>
              </div>
            </Otherwise>
          </Choose>
        </If>
      </MultiStepModalPane>
    );
  }
}

SpecifyPane.propTypes = {
  /**
   * The compound being specified
   */
  compound: PropTypes.instanceOf(Immutable.Map).isRequired,
  /**
   * Whether or not the compound should be treated as already registered.
   */
  compoundExists: PropTypes.bool.isRequired,
  /**
   * For new compounds, whether to use the summary sdf or smiles field as the source of truth
   */
  compoundSource: PropTypes.oneOf(['sdf', 'smiles']),

  /**
   * User that created the compound
   */
  createdByUser: PropTypes.instanceOf(Immutable.Map)
};

SpecifyPane.defaultProps = {
  compoundSource: 'smiles'
};

const ConnectedSpecifyPane = ConnectToStores(SpecifyPane, ({ compoundId }) => {
  const compound = CompoundStore.getById(compoundId);
  const createdByUser = compound ? UserStore.getById(compound.get('created_by')) : undefined;
  return { compound, createdByUser };
});

ConnectedSpecifyPane.propTypes = {
  /**
   * CompoundStore ID where further information about the compound exists
   */
  compoundId: PropTypes.string.isRequired
};

export default ConnectedSpecifyPane;
