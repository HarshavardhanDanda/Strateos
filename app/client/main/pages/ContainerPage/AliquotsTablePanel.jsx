import Immutable from 'immutable';
import classnames from 'classnames';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import Urls                from 'main/util/urls';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import AliquotAPI          from 'main/api/AliquotAPI';
import CompoundAPI         from 'main/api/CompoundAPI';
import AliquotActions      from 'main/actions/AliquotActions';
import CompoundStore       from 'main/stores/CompoundStore';
import InventoryUtil       from 'main/inventory/inventory/util/InventoryUtil';

import { Spinner, ImmutablePureComponent, Column, List, CollapsiblePanel, Divider } from '@transcriptic/amino';
import CompoundSearchResults from 'main/pages/CompoundsPage/CompoundSearchResults';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import './AliquotsTablePanel.scss';

class AliquotsTablePanel extends ImmutablePureComponent {
  static get propTypes() {
    return {
      containerId:     PropTypes.string.isRequired,
      aliquots:        PropTypes.instanceOf(Immutable.List).isRequired,
      containerType:   PropTypes.instanceOf(Immutable.Map).isRequired,
      resources:       PropTypes.instanceOf(Immutable.List).isRequired,
      onMouseEnterRow: PropTypes.func.isRequired,
      onMouseLeaveRow: PropTypes.func.isRequired,
      loading:         PropTypes.bool,
      isOrgless:       PropTypes.bool,
      onModal:         PropTypes.bool,
      onAliquotClick:  PropTypes.func,
      onCompoundClick:  PropTypes.func,
      rowColorMap: PropTypes.object
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      compounds: [],
      pageSize: 4,
      page: 1,
      numPages: undefined,
      resource_compound_ids: [],
      compound_ids: []
    };
    this.onPageChange = this.onPageChange.bind(this);
    this.updateValues = this.updateValues.bind(this);
    this.fetchCompounds = this.fetchCompounds.bind(this);
  }

  componentDidMount() {
    this.props.onMouseLeaveRow();
    this.fetchCompounds(this.props.containerId);
    this.fetchResourceCompounds(this.props.containerId);
  }

  containerTypeHelper() {
    return new ContainerTypeHelper({
      col_count: this.props.containerType.get('col_count')
    });
  }

  fetchCompounds(id) {
    this.setState({ loadingCompounds: true }, () => {
      const { pageSize, page } = this.state;
      const options = { offset: ((page - 1) * pageSize), limit: pageSize, filters: { container_id: id } };
      CompoundAPI.getByContainerId(options).done((resp) => {
        const cids = (resp.data || []).filter(obj => obj.type === 'compounds').map(obj => obj.id);
        this.setState({ compound_ids: cids, numPages: Math.ceil(resp.meta.record_count / pageSize) });
        this.updateValues();
      });
    });
  }

  updateValues() {
    if (this.state.resource_compound_ids.length > 0) {
    // add resources related compounds to compound store
      CompoundAPI.index({
        filters: {
          id: this.state.resource_compound_ids.join()
        }
      }).done(() => {
        const compounds = CompoundStore.getByIds(this.state.compound_ids.concat(this.state.resource_compound_ids));
        this.setState({ compounds, loadingCompounds: false });
      });
    } else {
      CompoundAPI.index({
        filters: {
          id: this.state.compound_ids.join()
        }
      }).done(() => {
        const compounds = CompoundStore.getByIds(this.state.compound_ids);
        this.setState({ compounds, loadingCompounds: false });
      });
    }
  }

  fetchResourceCompounds(id) {
    this.setState({ loadingCompounds: true }, () => {
      const options = {
        includes: ['resource']
      };
      AliquotAPI.getByContainerId(id, options)
        .done(resp => {

          let resource_compound_ids = (resp.included || [])
            .filter(obj => obj.type === 'resources' && obj.attributes.kind === 'ChemicalStructure')
            .map(obj => obj.attributes.compound.model.id);
          resource_compound_ids = resource_compound_ids.filter(c => !this.state.compound_ids.includes(c));

          this.setState({ resource_compound_ids });

          this.updateValues();
          this.onPageChange(this.state.page);
        });
    });
  }

  onPageChange(page) {
    this.setState({
      page: page
    },
    this.fetchCompounds(this.props.containerId));
  }

  render() {
    if (this.props.loading && !this.props.aliquots.count() > 0) return <Spinner />;

    if (this.props.aliquots.count() === 0) {
      return (
        <div>
          <div className="aliquot-table-panel__header">
            <h3 className="tx-type--secondary tx-type--heavy">Aliquots</h3>
          </div>
          <div className="panel-body">
            <div className="no-aliquot">
              <em>No Aliquots</em>
            </div>
          </div>
        </div>
      );
    }

    const aliquots = this.props.aliquots.sortBy(aq => aq.get('well_idx'));
    const helper   = new ContainerTypeHelper({ col_count: this.props.containerType.get('col_count') });
    const containerVisibleColumns = InventoryUtil.getVisibleColumns();

    const renderWellIndex = (aliquot) => {
      const wellIndex    = aliquot.get('well_idx');
      return helper.humanWell(wellIndex);
    };

    const renderVolume = (aliquot) => {
      return `${aliquot.get('volume_ul')} µL`;
    };

    const renderMass = (aliquot) => {
      if (aliquot.get('mass_mg')) return `${aliquot.get('mass_mg')} mg`;
      return 'N/A';
    };

    const renderResource = (aliquot) => {
      const resource     = this.props.resources.find(r => r.get('id') === aliquot.get('resource_id'));
      return  <p className="tx-type--secondary">{resource ? resource.get('name') : 'N/A'}</p>;
    };

    const renderAliquotDisplayName = (aliquot) => {
      return  <p className="tx-type--secondary">{aliquot.get('name') || 'N/A'}</p>;
    };

    const onRowClick = (aliquot) => {
      const wellIndex = aliquot.get('well_idx');
      this.props.onMouseEnterRow(wellIndex);
      if (this.props.onModal) {
        this.props.onAliquotClick(aliquot);
      } else {
        const humanIndex  = helper.humanWell(wellIndex);
        const aliquotUrl = this.props.isOrgless ?
          Urls.orglessAliquot(this.props.containerId, humanIndex) :
          Urls.aliquot(this.props.containerId, humanIndex);
        this.context.router.history.push(aliquotUrl);
      }
    };

    const onRowHover = (aliqout, hovered) => {
      const wellIndex   = aliqout.get('well_idx');
      if (hovered) {
        this.props.onMouseEnterRow(wellIndex);
      } else {
        this.props.onMouseEnterRow();
      }
    };

    const renderCompounds = () => {
      const {
        loadingCompounds,
        compounds,
        page,
        pageSize,
        numPages,
      } = this.state;

      if (loadingCompounds) {
        return <Spinner />;
      }
      if (_.isEmpty(compounds)) {
        return (
          <div className="aliquot-table-panel__header">
            <h4 className="tx-type--secondary">No Compounds Linked</h4>
          </div>
        );
      }

      const data = Immutable.fromJS(compounds);
      const visibleColumns = ['structure', 'nickname', 'formula', 'weight'];

      return (
        <div className="aliquot-table-panel__compounds">
          <CompoundSearchResults
            data={data}
            searchOptions={Immutable.Map()}
            page={page}
            pageSize={pageSize}
            numPages={numPages}
            visibleColumns={visibleColumns}
            onSearchPageChange={this.onPageChange}
            onRowClick={(compound) =>
              this.props.onCompoundClick(compound.get('id'))
            }
            enableSelection={false}
            enableSort={false}
            disableCard
            hideActions
          />
        </div>
      );
    };

    const listActions = [{
      title: 'Download container data',
      icon: 'fa fa-download',
      action: () => {
        AliquotActions.downloadCSV([this.props.containerId], containerVisibleColumns);
      }
    }];

    const manageCompounds = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_COMPOUNDS) || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LAB_COMPOUNDS);
    return (
      <div className={classnames({
        'panel-default': this.props.onModal,
        'aliquot-table-panel': true
      })}
      >
        <div className="aliquot-table-panel__header">
          <h3 className="tx-type--heavy">Aliquots</h3>
        </div>
        <div className="aliquot-table-panel__list">
          <List
            data={aliquots}
            loaded
            onRowClick={onRowClick}
            onRowHover={onRowHover}
            id="aliquots-list"
            disableCard
            disabledSelection
            rowColorMap={this.props.rowColorMap}
            showActions
            defaultActions={listActions}
          >
            <Column renderCellContent={renderWellIndex} header="WELL" id="well" />
            <Column renderCellContent={renderVolume} header="VOLUME" id="volume" />
            <Column renderCellContent={renderMass} header="MASS" id="mass" />
            <Column renderCellContent={renderResource} header="RESOURCE" id="resource" />
            <Column renderCellContent={renderAliquotDisplayName} header="NAME" id="name" />
          </List>
        </div>
        <Divider />
        {/* render union of linked compounds */}
        <If condition={manageCompounds}>
          <CollapsiblePanel title="Compounds" wide initiallyCollapsed={false}>
            {renderCompounds()}
          </CollapsiblePanel>
        </If>
      </div>
    );
  }
}

export default AliquotsTablePanel;
