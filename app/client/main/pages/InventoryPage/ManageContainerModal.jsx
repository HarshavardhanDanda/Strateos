import React from 'react';
import { SinglePaneModal } from 'main/components/Modal';
import { SearchField, Divider, Table, Column, ButtonGroup, Button, Validated, HierarchyPath, TextBody, DataTable, Spinner } from '@transcriptic/amino';

import Moment from 'moment';
import classNames from 'classnames';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { inflect } from 'inflection';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import Immutable from 'immutable';
import ModalActions from 'main/actions/ModalActions';
import NotificationActions from 'main/actions/NotificationActions';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import ContainerActions from 'main/actions/ContainerActions';
import { InventoryActions } from 'main/inventory/inventory/InventoryActions';

import './ManageContainerModal.scss';

const LocationPath = (container) => {
  const ancestors = container.getIn(['location', 'ancestors']);
  const location = container.getIn(['location']) || [];
  const ancestorLocations = ancestors ? [...ancestors] : [];
  const locationPaths = ancestorLocations.concat(location);
  return locationPaths.map((loc) => {
    return {
      name: loc.get('name', '-'),
      id: loc.get('id')
    };
  });
};
class ManageContainerModal extends React.Component {

  static get propTypes() {
    return {
      onManageSubmit: PropTypes.func.isRequired,
      onManageCancel: PropTypes.func.isRequired,
      searchTextArray: PropTypes.arrayOf(PropTypes.string).isRequired,
      searchField: PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired
      }).isRequired
    };
  }

  static get MODAL_ID() {
    return 'MANAGE_CONTAINERS_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = this.initialState();

    _.bindAll(
      this,
      'renderTableView',
      'beforeDismiss',
      'renderFooter',
      'onSubmit',
      'onDismiss',
      'removeContainerFromList',
      'addContainerToList',
      'renderConflictDrawerFooter',
      'renderConflictDrawerContent',
      'closeDrawer',
      'renderRemoveRowAction',
      'renderLocationAction',
      'renderRetryDrawerContent',
      'renderRetryDrawerFooter',
      'handleRetryFailedContainers',
      'enableRetryDrawer',
      'enableConflictDrawer',
      'search',
      'getDrawerProps',
      'onSearchFieldKeyDown',
    );

    this.containerCellRender = {
      RemoveRowAction: this.renderRemoveRowAction,
      Id: container => container.get('id'),
      BarCode: container => container.get('barcode'),
      ContainerType: container => this.renderType(container),
      Organization: container => container.get('organization_name', '-'),
      CreatedAt: container => Moment(container.get('created_at')).format('MMM D, YYYY'),
      Available: container => container.get('available'),
      Reserved: container => container.get('reserved'),
      Status: container => _.upperFirst(container.get('status')),
      Location: this.renderLocationAction
    };
  }

  componentDidUpdate() {
    if (!_.isEqual(this.state.searchTextArray, this.props.searchTextArray)) {
      this.setState({
        searchTextArray: this.props.searchTextArray,
        containers: Immutable.List([]),
        validBulkSearchValues: Immutable.Set([])
      }, () => !_.isEmpty(this.state.searchTextArray) && this.search(this.state.searchTextArray, false));
    }
  }

  initialState() {
    return {
      loading: false,
      searchTextArray: [],
      validBulkSearchValues: Immutable.Set([]),
      onDeletingRequest: false,
      containers: Immutable.List([]),
      toBeSelectedContainers: Immutable.List([]),
      selectedContainers: {},
      searchBarText: '',
      errorMessage: '',
      force_validate: false,
      isConflictDrawerOpen: false,
      isRetryDrawerOpen: false,
      isDeleteContainerDrawer: false,
      isDeleteContainerActionFailed: false,
      bulkSearchValuesWithNoContainers: []
    };
  }

  beforeDismiss() {
    this.props.onManageCancel();
    this.setState(this.initialState());
  }

  onDismiss() {
    this.beforeDismiss();
    ModalActions.close(ManageContainerModal.MODAL_ID);
  }

  onSubmit() {
    const { containers } = this.state;
    this.props.onManageSubmit(containers.map(c => c.get('id')).toList());
    this.onDismiss();
  }

  baseColumn(colName, label, colWidth, disableFormatHeader = false) {
    return {
      name: colName,
      label: label,
      relativeWidth: colWidth,
      disableFormatHeader: disableFormatHeader
    };
  }

  closeDrawer(isRetryDrawer = false) {
    this.setState(prevState => ({
      isConflictDrawerOpen: isRetryDrawer ? prevState.isConflictDrawerOpen : false,
      isRetryDrawerOpen: isRetryDrawer ? false : prevState.isRetryDrawerOpen,
      onDeletingRequest: isRetryDrawer ? prevState.onDeletingRequest : false,
      toBeSelectedContainers: isRetryDrawer ? prevState.toBeSelectedContainers : Immutable.List([]),
      selectedContainers: isRetryDrawer ? prevState.selectedContainers : {},
      searchBarText: isRetryDrawer ? prevState.searchBarText : '',
      bulkSearchValuesWithNoContainers: isRetryDrawer ? [] : prevState.bulkSearchValuesWithNoContainers
    }));
  }

  handleRetryFailedContainers() {
    const { bulkSearchValuesWithNoContainers } = this.state;
    this.setState({
      isRetryDrawerOpen: false,
      bulkSearchValuesWithNoContainers: []
    }, () => this.search(bulkSearchValuesWithNoContainers, false));
  }

  search(bulkSearchValues, textAreaSearch = true) {
    const { searchOptions, searchField } = this.props;
    let newSearchOptions = InventoryActions.buildSearchPayload(searchOptions.toJS());
    newSearchOptions = _.omit(newSearchOptions, 'bulk_search');
    if (searchField.value === 'id') {
      newSearchOptions.ids = bulkSearchValues;
    } else {
      newSearchOptions[searchField.value] = bulkSearchValues;
    }
    this.setState({ loading: true }, () => {
      ContainerActions.searchWithoutPagination(newSearchOptions)
        .done((response) => {
          const containersResponse = JsonAPIIngestor.ingest(response);
          const containers = Immutable.fromJS(_.get(containersResponse, 'containers', []));
          this.onSearchSuccess(bulkSearchValues, containers, textAreaSearch).finally(() => {
            this.setState({
              drawerHeight: '',
              loading: false
            });
          });
        })
        .fail((...errorResponse) => {
          this.setState({ loading: false }, () => {
            NotificationActions.handleError(...errorResponse);
            this.enableRetryDrawer(bulkSearchValues);
          });
        });
    });
  }

  async onSearchSuccess(bulkSearchValues, containers, textAreaSearch = true) {
    if (textAreaSearch) {
      const error = await this.validateContainer(containers.first());
      this.setState({ searchBarText: '' });
      if (error) {
        this.setState({
          errorMessage: error,
          force_validate: true
        });
      } else if (containers.size === 1) {
        this.setState((prevState) => ({
          validBulkSearchValues: prevState.validBulkSearchValues.union(bulkSearchValues),
          containers: prevState.containers.concat(containers),
        }),
        );
      } else {
        this.enableConflictDrawer(bulkSearchValues, containers);
      }
    } else {
      const {
        bulkValuesWithConflict, containersWithConflict,
        bulkValuesWithoutConflict, containersWithoutConflict,
      } = this.getConflictingBulkFieldAndContainers(containers);
      this.setState((prevState) => ({
        validBulkSearchValues: prevState.validBulkSearchValues.union(bulkValuesWithoutConflict),
        containers: prevState.containers.concat(containersWithoutConflict),
      }), () => {
        const bulkSearchValuesWithNoContainers = _.difference(bulkSearchValues, _.union(bulkValuesWithConflict, bulkValuesWithoutConflict));
        this.enableRetryDrawer(bulkSearchValuesWithNoContainers);
        this.enableConflictDrawer(bulkValuesWithConflict, containersWithConflict);
      });
    }
  }

  getConflictingBulkFieldAndContainers(containers) {
    const { searchField } = this.props;
    const bulkFieldContainerMap = {};
    containers.forEach(container => {
      const bulkValue = container.get(searchField.value);
      bulkFieldContainerMap[bulkValue] = (bulkFieldContainerMap[bulkValue] || []).concat(container);
    });
    const bulkValuesWithConflict = [];
    const bulkValuesWithoutConflict = [];
    const containersWithConflict = [];
    const containersWithoutConflict = [];
    _.entries(bulkFieldContainerMap).forEach(([bulkValue, containers]) => {
      if (containers.length > 1) {
        bulkValuesWithConflict.push(bulkValue);
        containersWithConflict.push(...containers);
      } else {
        bulkValuesWithoutConflict.push(bulkValue);
        containersWithoutConflict.push(...containers);
      }
    });
    return {
      bulkValuesWithConflict,
      containersWithConflict: Immutable.fromJS(containersWithConflict).toList(),
      bulkValuesWithoutConflict,
      containersWithoutConflict: Immutable.fromJS(containersWithoutConflict).toList(),
    };
  }

  enableConflictDrawer(bulkValuesWithConflict, containersWithConflict) {
    if (!_.isEmpty(bulkValuesWithConflict)) {
      this.setState({
        isConflictDrawerOpen: true,
        toBeSelectedContainers: containersWithConflict
      });
    }
  }

  enableRetryDrawer(bulkSearchValuesWithNoContainers = []) {
    if (!_.isEmpty(bulkSearchValuesWithNoContainers)) {
      this.setState({
        isRetryDrawerOpen: true,
        bulkSearchValuesWithNoContainers: bulkSearchValuesWithNoContainers,
      });
    }
  }

  async validateContainer(container) {
    let error = '';
    const { searchField } = this.props;
    const searchFieldName = searchField.name;
    try {
      if (!this.state.searchBarText.trim()) {
        throw new Error(`Container ${searchFieldName} not found. Please scan or type in a valid ${searchFieldName} or update applied filters.`);
      }

      if (!container) {
        throw new Error(`Container ${searchFieldName} not found. Please scan or type in a valid ${searchFieldName} or update applied filters.`);
      }

      if (this.state.containers.contains(container)) {
        throw new Error('This container is already in the list.');
      }

    } catch (e) {
      error = e.message;
    }

    return error;
  }

  addContainerToList() {
    const { containers, toBeSelectedContainers, selectedContainers, validBulkSearchValues } = this.state;
    const { searchField } = this.props;
    const selectedContainersList = toBeSelectedContainers.filter(container => container.get('id') in selectedContainers);
    const newContainers = containers.concat(selectedContainersList);
    const newValidBulkValues = validBulkSearchValues.concat(selectedContainersList.map(container => container.get(searchField.value)));
    this.setState({
      validBulkSearchValues: newValidBulkValues,
      containers: newContainers,
      isConflictDrawerOpen: false,
      toBeSelectedContainers: Immutable.List([]),
      selectedContainers: {},
      searchBarText: '',
    });
  }

  removeContainerFromList(idx, removeBulkValue) {
    const filteredContainers = this.state.containers.filter(container => container.get('id') !== idx);
    const filteredValidBulkValues = this.state.validBulkSearchValues.filter(bulkValue => bulkValue !== removeBulkValue);
    this.setState({
      errorMessage: '',
      force_validate: false,
      validBulkSearchValues: filteredValidBulkValues,
      containers: filteredContainers,
    });
  }

  getDataTableData() {
    const tableData = this.state.containers.map((container) => {
      return {
        '': this.renderRemoveRowAction(container),
        ID: container.get('id'),
        Barcode: container.get('barcode'),
        Name: container.get('label'),
        'Container Type': this.renderType(container),
        Organization: container.get('organization_name', '-'),
        'Created at': Moment(container.get('created_at')).format('MMM D, YYYY'),
        Available: container.get('available'),
        Reserved: container.get('reserved'),
        Status: _.upperFirst(container.get('status')),
        Location: this.renderLocationAction(container)
      };
    });
    return tableData.toJS();
  }

  onSearchFieldKeyDown(event) {
    const { key, target: { value } } = event;
    if (key === 'Enter' && value) {
      this.search([value]);
    }
  }

  getDrawerProps() {
    const { isRetryDrawerOpen, isConflictDrawerOpen, drawerHeight } = this.state;
    let drawerTitle = '';
    let drawerChildren;
    let drawerFooterChildren;
    if (isRetryDrawerOpen) {
      drawerTitle = 'Containers not found';
      drawerChildren = this.renderRetryDrawerContent();
      drawerFooterChildren = this.renderRetryDrawerFooter();
    } else if (isConflictDrawerOpen) {
      drawerTitle = 'Look Up Container';
      drawerChildren = this.renderConflictDrawerContent();
      drawerFooterChildren = this.renderConflictDrawerFooter();
    }
    return {
      drawerState: isRetryDrawerOpen || isConflictDrawerOpen,
      drawerTitle: drawerTitle,
      drawerChildren: drawerChildren,
      drawerFooterChildren: drawerFooterChildren,
      drawerHeight: drawerHeight,
      onDrawerClose: () => this.closeDrawer(isRetryDrawerOpen),
    };
  }

  renderRemoveRowAction(container) {
    const { searchField } = this.props;
    return (
      <Button type="info" link onClick={() => this.removeContainerFromList(container.get('id'), container.get(searchField.value))}>
        <i className="fa fa-trash-alt" />
      </Button>
    );
  }

  renderLocationAction(container) {
    const pathNames = LocationPath(container);
    if (_.isEmpty(pathNames)) {
      return '-';
    }
    return (
      <HierarchyPath steps={pathNames} spacingPx={1} isTruncate />
    );
  }

  renderType(container) {
    if (container.get('test_mode')) {
      return <p><i className="tx-type--warning fas fa-flask test-icon" /> {container.get('container_type_id')}</p>;
    }
    const cTypeId = container.get('container_type_id');
    const containerType = ContainerTypeStore.getById(cTypeId);
    const isTube = containerType && containerType.get('is_tube');

    return <p><i className={classNames('baby-icon', isTube ? 'aminol-tube' : 'aminol-plate')} />{container.get('container_type_id')}</p>;
  }

  renderSearch() {
    return (
      <div className="manage-container-modal__search">
        <p className="tx-type--secondary">
          {this.renderSearchDescription()}
        </p>
        {this.renderSearchField()}
      </div>
    );
  }

  renderSearchFieldNameText(searchFieldName) {
    return `${searchFieldName}s`;
  }

  renderSearchDescription() {
    const { searchField } = this.props;
    const searchFieldName = searchField.name;
    return searchField.value === 'barcode' ? "Scan your container's barcode or type it in to begin" :
      `Type your container's ${searchFieldName} to begin`;
  }

  renderTableView() {
    return (
      <div className="manage-container-content">
        {this.renderSearch()}
        <Divider isDark />
        <p className="tx-type--secondary">
          Your scanned containers will appear in the table below.
        </p>
        {(this.state.loading || this.state.isConflictDrawerOpen) ? <Spinner /> : (
          <DataTable
            headers={['', 'ID', 'Barcode', 'Name', 'Container Type', 'Organization', 'Created at', 'Available', 'Reserved', 'Status', 'Location']}
            disableFormatHeader
            rowHeight={50}
            data={this.getDataTableData()}
          />
        )}
      </div>
    );
  }

  renderRetryDrawerContent() {
    const { bulkSearchValuesWithNoContainers } = this.state;
    const { searchField } = this.props;
    const searchFieldName = searchField.name;
    return (
      <div>
        <TextBody>
          The container {this.renderSearchFieldNameText(searchFieldName)} specified below could not be found. Try searching again or updating
          the {this.renderSearchFieldNameText(searchFieldName)} or applied filters to resolve the error.
        </TextBody>
        <TextBody color="secondary" heavy>
          {this.renderSearchFieldNameText(_.capitalize(searchFieldName))}
        </TextBody>
        <ul>
          {
            _.map(bulkSearchValuesWithNoContainers, (bulkValue) => (
              <li key={bulkValue}>
                <TextBody tag="span">
                  {bulkValue}
                </TextBody>
              </li>
            ))
          }
        </ul>
      </div>
    );
  }

  renderRetryDrawerFooter() {
    return (
      <ButtonGroup>
        <Button type="primary" link onClick={() => this.closeDrawer(true)}>
          Cancel
        </Button>
        <Button
          type="danger"
          size="small"
          heavy
          height="short"
          onClick={this.handleRetryFailedContainers}
        >
          Try again
        </Button>
      </ButtonGroup>
    );
  }

  renderConflictDrawerContent() {
    const columns = [
      this.baseColumn('Id', 'ID', 2, true),
      this.baseColumn('BarCode', 'Bar Code', 2),
      this.baseColumn('ContainerType', 'Container Type', 3),
      this.baseColumn('Organization', 'Organization', 2),
      this.baseColumn('CreatedAt', 'Created', 2),
      this.baseColumn('Available', 'Available', 1),
      this.baseColumn('Reserved', 'Reserved', 1),
      this.baseColumn('Status', 'Status', 2),
      this.baseColumn('Location', 'Location', 2)
    ];

    return (
      <div>
        <TextBody color="secondary" heavy>
          The container {this.props.searchField.name}(s) specified below match multiple containers.
        </TextBody>
        <TextBody color="secondary" heavy>
          {this.state.toBeSelectedContainers.size + ' ' + inflect('match', this.state.toBeSelectedContainers.size) + ' found.'}
        </TextBody>
        <Table
          id="manage-containers-drawer-table"
          data={this.state.toBeSelectedContainers}
          loaded
          onSelectRow={(record, willBeSelected, selectedRows) => { this.setState({ selectedContainers: selectedRows }); }}
          onSelectAll={(selectedRows) => { this.setState({ selectedContainers: selectedRows }); }}
          selected={this.state.selectedContainers}
        >
          {
              columns.map(column => {
                const render = this.containerCellRender[column.name];

                return (
                  <Column
                    renderCellContent={render}
                    header={column.label}
                    id={`manage-containers-drawer-table-column-${column.name}`}
                    key={column.name}
                    relativeWidth={column.relativeWidth}
                    disableFormatHeader={column.disableFormatHeader}
                  />
                );
              })
            }
        </Table>
      </div>
    );
  }

  renderConflictDrawerFooter() {
    return (
      <ButtonGroup>
        <Button type="primary" link onClick={() => this.closeDrawer()}>
          Cancel
        </Button>
        <Button
          type="primary"
          size="small"
          heavy
          onClick={this.addContainerToList}
          disabled={Object.keys(this.state.selectedContainers).length === 0}
        >
          Add Container
        </Button>
      </ButtonGroup>
    );
  }

  renderFooter() {
    return (
      <div className="modal__footer manage-container-modal__footer">
        <div className="manage-container-modal__footer-text">
          <TextBody tag="p">
            {this.state.containers.size + ' containers'}
          </TextBody>
        </div>
        <ButtonGroup>
          <Button type="info" link onClick={this.onDismiss}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            heavy
            onClick={this.onSubmit}
          >
            Submit
          </Button>
        </ButtonGroup>
      </div>
    );
  }

  renderSearchField() {
    return (
      <Validated error={this.state.errorMessage} force_validate={this.state.force_validate}>
        <SearchField
          type="text"
          orientation="horizontal"
          searchType={this.props.searchField.name}
          isSearching={this.state.loading}
          value={this.state.searchBarText}
          showBarcodeIcon={this.props.searchField.value === 'barcode'}
          autoFocus
          onChange={(event) => {
            this.setState({
              searchBarText: event.target.value,
              errorMessage: false,
              force_validate: false
            });
          }}
          onKeyDown={(event) => this.onSearchFieldKeyDown(event)}
          validated={{
            hasError: !!this.state.errorMessage
          }}
        />
      </Validated>
    );
  }

  render() {
    const { drawerState, drawerTitle, drawerChildren, drawerHeight,
      drawerFooterChildren, onDrawerClose } = this.getDrawerProps();
    return (
      <SinglePaneModal
        title={'Manage Containers'}
        modalSize="xlg"
        modalId={ManageContainerModal.MODAL_ID}
        modalClass="manage-container-modal"
        modalWrapperClass="manage-container-modal-wrapper"
        onDismissed={this.beforeDismiss}
        footerRenderer={this.renderFooter}
        hasDrawer
        drawerState={drawerState}
        drawerTitle={drawerTitle}
        drawerHeight={drawerHeight}
        drawerChildren={drawerChildren}
        drawerFooterChildren={drawerFooterChildren}
        onDrawerClose={onDrawerClose}
      >
        {this.renderTableView()}
      </SinglePaneModal>
    );
  }
}

export default ManageContainerModal;
