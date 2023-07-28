import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Immutable from 'immutable';
import { Link } from 'react-router-dom';
import { Breadcrumbs, Page, Card, Spinner, MoleculeViewer, Subtabs } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import UserActions from 'main/actions/UserActions';
import CompoundAPI from 'main/api/CompoundAPI';
import { CompoundHeading, CompoundEditModal, CompoundDownloadModal } from 'main/components/Compounds';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import CompoundStore from 'main/stores/CompoundStore';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import UserStore from 'main/stores/UserStore';
import SessionStore from 'main/stores/SessionStore';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import Urls from 'main/util/urls';
import ModalActions from 'main/actions/ModalActions';
import AcsControls from 'main/util/AcsControls';
import CustomPropertyTable from 'main/pages/ContainerPage/CustomPropertyTable';
import ContextualCustomPropertyStore from 'main/stores/ContextualCustomPropertyStore';
import LibraryAPI from 'main/api/LibraryAPI';
import { CompoundsPageActions } from './CompoundsActions';
import CompoundDetailPageInventory from './CompoundDetailPageInventory';
import CompoundBatches from './CompoundBatches';

import './CompoundDetailPage.scss';
import './CompoundBatches.scss';

export class CompoundDetailPage extends React.Component {
  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      failed: false,
      libraries: [],
      selectedTab: (this.props.location.state && this.props.location.state.tab) || 'Compound Inventory',
      downloadOption: {
        csv: false,
        sdf: false
      }
    };
    this.props.history.replace();

    _.bindAll(
      this,
      'onSaveCustomProperty',
      'onUpdateLibraries',
      'onDownloadOptionChange',
      'onModalDownloadClicked');
  }

  componentDidMount() {
    this.fetchData(true);
    this.canViewLibraries(this.props.compound) && this.fetchLibraries();
    if (!this.props.showInventory) { this.setState({ selectedTab: 'Batches' }); }
  }

  componentDidUpdate(prevProps, prevState) {
    const prevCompoundId = _.get(prevProps.match, 'params.compoundId');
    const currCompoundId = _.get(this.props.match, 'params.compoundId');
    if ((prevCompoundId !== currCompoundId) ||
      (this.state.failed !== prevState.failed)) {
      this.fetchData();
    }
    if (!prevProps.compound && this.props.compound) {
      this.canViewLibraries(this.props.compound) && this.fetchLibraries();
    }
  }

  canViewLibraries(compound) {
    const isPublicCompound = compound && !compound.get('organization_id');
    return  AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && (SessionStore.isRecordWithinCurrOrg(compound) || isPublicCompound);
  }

  fetchLibraries() {
    LibraryAPI.getLibraries({ compound_id: this.props.match.params.compoundId })
      .done((response) => {
        const libraries = response.data.map((lib) => ({ id: lib.id, ...lib.attributes }));
        this.setState({
          libraries
        });
      });
  }

  onUpdateLibraries(libraries) {
    this.setState({ libraries });
  }

  async fetchData(forceReLoad = false) {
    try {
      if ((!this.props.compound || forceReLoad) && !this.state.failed) {
        await CompoundAPI.get(this.props.match.params.compoundId).done((response) => {
          const orgId = response.data.attributes.organization_id || SessionStore.getOrg().get('id');
          ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'CompoundLink');
        });
      }
    } catch (err) {
      this.setState({ failed: err || true });
    }
    try {
      if (!this.props.createdByUser && !this.state.failed) {
        await UserActions.load(this.props.compound.get('created_by'));
      }
    } catch (err) {
      // User fetching failed
    }
  }

  onSaveCustomProperty(key, value) {
    const { compound } = this.props;
    return CompoundAPI.updateCustomProperty(
      compound.get('id'),
      key,
      value);
  }

  getCustomPropertyConfigs(compound) {
    if (compound) {
      const orgId = compound.get('organization_id');
      const configs = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(orgId, 'CompoundLink');

      return configs.map((config) => {
        const configDef = config.get('config_definition');
        /**
         * MVP workaround
         * if value of config_definition is of string type, convert it
         *  */
        if (typeof configDef === 'string') {
          return config.set('config_definition', Immutable.fromJS(JSON.parse(configDef)));
        }

        return config;
      });
    }
  }

  onModalDownloadClicked() {
    const compoundId = this.props.compound.get('id');
    CompoundsPageActions.downloadCompounds(this.state.downloadOption.csv, this.state.downloadOption.sdf, [compoundId]);
    this.closeCompoundDownloadModal();
  }

  closeCompoundDownloadModal() {
    ModalActions.close(CompoundDownloadModal.MODAL_ID);
    this.setState({
      downloadOption: {
        csv: false,
        sdf: false
      }
    });
  }

  onDownloadOptionChange = e => {
    const downloadOption = { ...this.state.downloadOption };
    const option = e.target.name;
    downloadOption[option] = e.target.checked;
    this.setState({ downloadOption });
  };

  renderCompoundInventory() {
    return (
      <div className="compound-inventory">
        <TabLayout>
          <CompoundDetailPageInventory
            id={this.props.match.params.compoundId}
          />
        </TabLayout>
      </div>
    );
  }

  renderBatches() {
    const compound_link_id = this.props.compound.get('id');
    return (
      <div className="compound-batches">
        <TabLayout>
          <CompoundBatches compoundLinkId={compound_link_id} />
        </TabLayout>
      </div>
    );
  }

  renderTabHeader() {
    const canViewBatches = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB);
    return (
      <Subtabs activeItemKey={this.state.selectedTab}>
        {this.props.showInventory && (
        <span key="Compound Inventory" onClick={() => this.setState({ selectedTab: 'Compound Inventory' })}>
          Compound Inventory
        </span>
        )}
        { canViewBatches && (
        <span key="Batches" onClick={() => this.setState({ selectedTab: 'Batches' })}>
          Batches
        </span>
        )}
      </Subtabs>
    );
  }

  renderTabContent() {
    const canViewBatches = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB);
    const activeKey = this.state.selectedTab;
    switch (activeKey) {
      case 'Compound Inventory':
        return this.props.showInventory && this.renderCompoundInventory();
      case 'Batches':
        return canViewBatches &&  this.renderBatches();
      default:
        return undefined;
    }
  }

  renderSubtabs() {
    return (
      <React.Fragment>
        {this.renderTabHeader()}
        {this.renderTabContent()}
      </React.Fragment>
    );
  }

  render() {
    const { compound, createdByUser, listUrl, customProperties } = this.props;
    const statusCode = AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) ? (this.state.failed.status || 200) : 404;
    const displayname = compound ? (compound.get('name') || compound.get('id')) : '';
    const isPublicCompound = compound && !compound.get('organization_id');
    const compoundOrganization = compound ? compound.get('organization_id') : '';
    const canEditCompound = AcsControls.isFeatureEnabled(FeatureConstants.EDIT_COMPOUND) && (compoundOrganization === SessionStore.getOrg().get('id'));
    const canEditExternalSystemId = AcsControls.isFeatureEnabled(FeatureConstants.EDIT_COMPOUND) && (compoundOrganization === SessionStore.getOrg().get('id') || isPublicCompound);
    const canEditPublicCompound = isPublicCompound && AcsControls.isFeatureEnabled(FeatureConstants.UPDATE_PUBLIC_COMPOUND);
    const canEditLabCompound = AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB);
    const canEditLibrary = AcsControls.isFeatureEnabled(FeatureConstants.EDIT_LIBRARY) && (SessionStore.isRecordWithinCurrOrg(compound) || isPublicCompound);
    const enableEditCompound = canEditCompound || canEditPublicCompound || canEditLabCompound || canEditLibrary || canEditExternalSystemId;
    const canEditHazards = canEditPublicCompound || this.props.canEditHazards || canEditLabCompound;
    const customPropertiesConfigs = this.getCustomPropertyConfigs(compound);
    const showCustomPropertyTable = !!(customPropertiesConfigs && customPropertiesConfigs.size && compound);
    const canViewBatches = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB);

    return (
      <Page title={displayname || 'Compounds'} statusCode={statusCode}>
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={listUrl}>
                    Compounds
                  </Link>
                  <Link
                    to={this.props.match.params.compoundId}
                  >{ displayname }
                  </Link>
                </Breadcrumbs>
              )}
              primaryInfoArea=""
              actions={
                [{
                  text: 'Edit Compound',
                  icon: 'fa fa-edit',
                  disabled: !enableEditCompound,
                  onClick: () => ModalActions.open(CompoundEditModal.MODAL_ID)
                },
                {
                  text: 'Download',
                  icon: 'fa fa-download',
                  onClick: () => ModalActions.open(CompoundDownloadModal.MODAL_ID)
                }]
              }
            />
          )}
        >
          <TabLayout>
            {!compound && <Spinner />}
            {compound && (
              <React.Fragment>
                <CompoundEditModal
                  compound={compound}
                  canEditHazards={canEditHazards}
                  canEditCompound={canEditPublicCompound || canEditCompound}
                  canEditExternalSystemId={canEditExternalSystemId}
                  libraries={this.state.libraries}
                  canEditLibrary={canEditLibrary}
                  onUpdateLibraries={this.onUpdateLibraries}
                />
                <CompoundDownloadModal
                  onDownloadClicked={this.onModalDownloadClicked}
                  closeModal={this.closeCompoundDownloadModal}
                  text={'Please check the file type applicable for download'}
                  onDownloadOptionChange={this.onDownloadOptionChange}
                  downloadOption={this.state.downloadOption}
                />
                <div className="tx-stack">
                  <div className="col-md-12 tx-stack__block--xxxs">
                    <CompoundHeading
                      createdByUser={createdByUser}
                      compound={compound}
                      canViewLibraries={this.canViewLibraries(compound)}
                      libraries={this.state.libraries}
                    />
                  </div>
                  <div className="col-md-12 tx-stack__block--xlg">
                    <Card className="compound-detail-page__molecule-wrapper">
                      <MoleculeViewer
                        SMILES={compound.get('smiles')}
                        size="large"
                        properties={compound.toJS()}
                        name={displayname}
                      />
                    </Card>
                  </div>
                  {showCustomPropertyTable && (
                    <div className="col-md-12 tx-stack__block--xlg">
                      <h3>Organization specific properties</h3>
                      <Card>
                        <CustomPropertyTable
                          customPropertiesConfigs={customPropertiesConfigs}
                          customProperties={customProperties}
                          onSaveCustomProperty={(key, value) => this.onSaveCustomProperty(key, value)}
                        />
                      </Card>
                    </div>
                  )}
                  <div className="col-md-12 tx-stack__block">
                    { (this.props.showInventory || canViewBatches) && this.renderSubtabs()}
                  </div>
                </div>
              </React.Fragment>
            )}
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

CompoundDetailPage.defaultProps = { showInventory: true, canEditHazards: false };

CompoundDetailPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      compoundId: PropTypes.string
    })
  }),
  compound: PropTypes.any.isRequired,
  createdByUser: PropTypes.any,
  customProperties: PropTypes.instanceOf(Immutable.List)
};

export const props = ({
  match: { params },
  showInventory
}) => {
  const { compoundId } = params;
  const compound = CompoundStore.getById(compoundId);
  const listUrl = Urls.compounds();
  const canEditHazards = SessionStore.isAdmin();
  const customProperties  = ContextualCustomPropertyStore.getCustomProperties(compoundId, 'CompoundLink');

  let createdByUser;

  if (compound) {
    createdByUser = UserStore.getById(compound.get('created_by'));
  }

  return {
    compound,
    createdByUser,
    showInventory,
    canEditHazards,
    listUrl,
    customProperties
  };
};

export default ConnectToStores(CompoundDetailPage, props);
