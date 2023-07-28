import PropTypes from 'prop-types';
import React     from 'react';
import Immutable  from 'immutable';
import _          from 'lodash';
import SessionStore from 'main/stores/SessionStore';
import AliquotAPI                 from 'main/api/AliquotAPI';
import CompoundStore              from 'main/stores/CompoundStore';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import ModalActions from 'main/actions/ModalActions';
import { Spinner } from '@transcriptic/amino';
import FeatureConstants   from '@strateos/features';
import FeatureStore       from 'main/stores/FeatureStore';
import CompoundListWithPagination  from 'main/components/Compounds/CompoundListView/CompoundViewPagination';
import NotificationActions from 'main/actions/NotificationActions';
import BatchStore from 'main/stores/BatchStore';
import CompoundAPI from '../../api/CompoundAPI';
import AliquotCompoundLinkTable from './AliquotCompoundLinkTable';
import './AliquotComposition.scss';

class AliquotComposition extends React.Component {
  static get propTypes() {
    return {
      id: PropTypes.string.isRequired,
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      aliquotIndex: PropTypes.string.isRequired,
      editable: PropTypes.bool,
      onCompoundClick: PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      editable: true
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onCompoundsSelected = this.onCompoundsSelected.bind(this);
    this.onRemoveCompound = this.onRemoveCompound.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.checkPagination = this.checkPagination.bind(this);
    this.fetch = this.fetch.bind(this);

    this.state = {
      compoundLinks: Immutable.List(),
      batch_ids: [],
      loading: true,
      page: 1,
      numPages: 0,
      pageSize: 4,
      compoundsPerPage: [],
      isEmptyPage: false,
      resourceCompoundId: []
    };
  }

  componentDidMount() {
    this.fetch(this.props.id);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.fetch(this.props.id);
    }
  }

  fetch(id) {
    const lab_id = this.props.container.getIn(['lab', 'id']);

    this.setState({ loading: true }, () => {
      const options = {
        fields: { aliquots: ['id'] },
        includes: this.canViewLinkedBatches(lab_id) ? ['compounds', 'resource', 'aliquots_compound_links', 'batches'] : ['compounds', 'resource', 'aliquots_compound_links']
      };

      AliquotAPI.get(id, options)
        .done(resp => {
          const compoundLinks = (resp.included || []).filter(obj => obj.type === 'aliquot_compound_links').map(obj => obj.attributes);
          const compound_ids = compoundLinks.map(link => link.compound_link_id);
          const resource = (resp.included || []).filter(obj => obj.type === 'resources');
          const batch_ids = (resp.included || []).filter(included => included.type === 'batches').map(batch => batch.id);
          let resourceCompoundId;
          if (resource.length > 0 && resource[0].attributes.kind === 'ChemicalStructure') {
            resourceCompoundId = resource[0].attributes.compound.model.id;
            this.fetchResourceCompound(resourceCompoundId);
          }
          resourceCompoundId = compound_ids.includes(resourceCompoundId) ? [] : [resourceCompoundId];
          this.setState({ compoundLinks: Immutable.fromJS(compoundLinks), resourceCompoundId, loading: false, batch_ids }, () => this.checkPagination());
        });
    });

  }

  fetchResourceCompound(resourceCompoundId) {
    const compound = CompoundStore.getById(resourceCompoundId);
    // add resource related compound to compound store
    if (compound === undefined) {
      CompoundAPI.index({
        filters: {
          id: resourceCompoundId
        }
      });
    }
  }

  getCompoundIds() {
    return this.state.compoundLinks.map(link => link.get('compound_link_id')).toJS();
  }

  checkPagination() {
    if (this.getCompoundIds().length > this.state.pageSize) {
      if (this.state.isEmptyPage) {
        this.onPageChange(this.state.page - 1);
        this.setState({ isEmptyPage: false });
      } else {
        this.onPageChange(this.state.page);
      }
    } else {
      this.setState({ numPages: 0, compoundsPerPage: this.getCompoundIds() });
    }
  }

  confirmUnlink() {
    return confirm(
      `Are you sure want to unlink this compound from Aliquot ${this.props.aliquotIndex}?`
    );
  }

  onRemoveCompound(aliquotCompoundLinks) {
    if (!this.confirmUnlink()) {
      return;
    }

    const remainingOnPage = _.difference(this.state.compoundsPerPage, _.map(aliquotCompoundLinks, 'compound_link_id'));
    const links = _.differenceBy(this.state.compoundLinks.toJS(), aliquotCompoundLinks, 'compound_link_id');

    this.updateComposition(Immutable.fromJS(links));
    if (this.state.page === this.state.numPages && !remainingOnPage.length) {
      this.setState({ isEmptyPage: true });
    }
  }

  updateComposition(compoundLinks, refresh = true) {
    const { id } = this.props;

    const data = compoundLinks
      .map((link) => ({
        compound_link_id: link.get('compound_link_id'),
        concentration: link.get('concentration'),
        solubility_flag: link.get('solubility_flag'),
      }))
      .toJS();

    const options = {
      relationships: {
        compounds: {
          data: data // Endpoint requires all compound links to be provided
        },
      },
      version: 'v2'
    };

    return AliquotAPI.update(id, {}, options)
      .done(() => {
        this.setState({ compoundLinks }, () => {
          if (refresh) {
            this.fetch(id);
          }
        });
      })
      .fail(this.onUpdateFail);
  }

  onUpdateFail = (...response) => {
    NotificationActions.handleError(...response);
  };

  updateResource() {
    this.fetch(this.props.id);
  }

  updateAliquotCompoundLink = (link) => {
    const cmpId = link.get('compound_link_id');
    let links = this.state.compoundLinks;
    const idx = links.findIndex((item) => item.get('compound_link_id') === cmpId);
    links = links.set(idx, link);

    return this.updateComposition(links, false);
  };

  onCompoundsSelected(selectedCompounds) {
    let links = this.state.compoundLinks;

    const newlyAddedCompoundIds = selectedCompounds.filter((id) => !this.getCompoundIds().includes(id));
    newlyAddedCompoundIds.forEach((id) => {
      links = links.push(
        Immutable.fromJS({
          compound_link_id: id,
          concentration: null,
          solubility_flag: null,
        })
      );
    });

    this.updateComposition(links);
  }

  onPageChange(page) {
    const compounds = [...this.getCompoundIds()];
    const compoundList = compounds.slice((page - 1) * this.state.pageSize, (page * this.state.pageSize));
    this.setState({
      compoundsPerPage: compoundList,
      page: page,
      numPages: Math.ceil(this.getCompoundIds().length / this.state.pageSize)
    });
  }

  canEditAliquotCompoundLink() {
    const lab_id = this.props.container.getIn(['lab', 'id']);
    return (
      FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, lab_id) &&
      FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, lab_id)
    );
  }

  canUnlinkAliquotCompound(lab_id) {
    return FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, lab_id);
  }

  canLinkAliquotCompound(lab_id) {
    return FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, lab_id) && FeatureStore.hasFeature(FeatureConstants.VIEW_LAB_COMPOUNDS);
  }

  canViewLinkedBatches(lab_id) {
    return FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_BATCHES_IN_LAB, lab_id) || FeatureStore.hasFeature(FeatureConstants.VIEW_BATCHES);
  }

  render() {
    const { loading, compoundLinks, compoundsPerPage, batch_ids } = this.state;

    const batches = Immutable.List(BatchStore.getByIds(batch_ids));

    if (loading) {
      return <Spinner />;
    }
    const lab_id = this.props.container.getIn(['lab', 'id']);
    const aliquotCompoundLinksPerPage = compoundLinks.filter(link => compoundsPerPage.includes(link.get('compound_link_id')));
    const resourceCompound = CompoundStore.getByIds(this.state.resourceCompoundId);

    const canLinkCompound = this.props.editable && this.canLinkAliquotCompound(lab_id);
    const canEditAliquotCompoundLink = this.canEditAliquotCompoundLink() && this.props.editable;
    const canUnlinkCompound = this.props.editable && this.canUnlinkAliquotCompound(lab_id);
    const canViewBatches = this.canViewLinkedBatches(lab_id);
    const container_org =  this.props.container.get('organization_id');
    const canRegisterCompound = FeatureStore.hasFeature(FeatureConstants.REGISTER_PUBLIC_COMPOUND) ||
      (FeatureStore.hasFeature(FeatureConstants.REGISTER_COMPOUND) && container_org === SessionStore.getOrg().get('id'));
    const searchProp = container_org ? { searchPublicAndPrivateByOrgId: container_org } : { searchByPublicCompounds: true };
    const aliquotCompoundLinkModalId = 'SEARCH_COMPOUND_MODAL_ALIQUOT_COMPOSITION';

    return (
      <div>
        <div className="aliquot-composition__compounds">
          <AliquotCompoundLinkTable
            aliquotCompoundLinks={aliquotCompoundLinksPerPage}
            batches={batches}
            linkAction={Boolean(canLinkCompound)}
            canViewBatches={canViewBatches}
            onLink={() => {
              ModalActions.open(aliquotCompoundLinkModalId);
            }}
            unlinkAction={Boolean(canUnlinkCompound)}
            onUnlink={this.onRemoveCompound}
            editAction={canEditAliquotCompoundLink}
            onEdit={this.updateAliquotCompoundLink}
            onCompoundClick={this.props.onCompoundClick}
            page={this.state.page}
            numPages={this.state.numPages}
            onPageChange={this.onPageChange}
          />
          {!!resourceCompound.length && (
            <div>
              <h3>Resource</h3>
              <CompoundListWithPagination
                compounds={Immutable.fromJS(resourceCompound)}
                removeAction={false}
                compoundClass="aliquot-composition__molecule-viewer"
                moleculeSize="tiny"
                page={this.state.page}
                pageWidth={5}
                numPages={1}
                onPageChange={this.onPageChange}
                onCompoundClick={this.props.onCompoundClick}
              />
            </div>
          )}
        </div>
        <CompoundSelectorModal
          onCompoundsSelected={this.onCompoundsSelected}
          allowCompoundRegistration={canRegisterCompound}
          persistSearchResultSelection={false}
          title="Link Compound"
          {...searchProp}
          modalId={aliquotCompoundLinkModalId}
          disableOrgFilter
        />
      </div>
    );
  }
}

export default AliquotComposition;
