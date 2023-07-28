import Immutable                    from 'immutable';
import _                            from 'lodash';
import React                        from 'react';
import classNames                   from 'classnames';

import { Column,
  ExpandableCard,
  Card,
  Page,
  Breadcrumbs,
  Spinner,
  Button,
  ButtonGroup,
  List,
  TextInput,
  Banner,
  PizzaTracker }             from '@transcriptic/amino';
import { Link } from 'react-router-dom';
import Urls from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout }                from 'main/components/TabLayout';
import { validators } from 'main/components/validation';
import IntakeKitActions             from 'main/actions/IntakeKitActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import './IntakeKitDetailsPage.scss';
import ContainerActions from 'main/actions/ContainerActions';
import ShipmentConfirmationPage from 'main/pages/ShipsPage/ShipmentsConfirmationPage/ShipmentConfirmationPage.jsx';
import NotificationActions from 'main/actions/NotificationActions';
import CsvUploadPane from './CsvUploadPane';

class IntakeKitDetailsPage extends React.Component {

  static get navigationIcons() {
    return ['fal fa-box-check', 'far fa-shipping-fast'];
  }

  constructor(props) {
    super(props);

    this.state = {
      currentNavIndex: undefined,
      navigationList: [],
      completedIndex: [],
      loading: true,
      items: [],
      containerIds: [],
      intakeKit: {},
      showBanner: true,
      isShipmentConfirmation: false,
      validIntakeKitItems: [],
      showExpandableCardBody: false,
      outboundConsumableContainerIds: [],
      consumableContainerIds: []
    };

    this.barcodeInput = this.barcodeInput.bind(this);
    this.barcodeValidate = this.barcodeValidate.bind(this);
    this.renderBarcode = this.renderBarcode.bind(this);
    this.getFormat = this.getFormat.bind(this);
    this.renderFormat = this.renderFormat.bind(this);
    this.saveForLater = this.saveForLater.bind(this);
    this.handleBarcodeUpdate = this.handleBarcodeUpdate.bind(this);
    this.setIntakeKitState = this.setIntakeKitState.bind(this);
  }

  componentDidMount() {
    IntakeKitActions.load(
      this.props.match.params.intakeKitId
    ).then(intakeKit => {

      if (intakeKit) {
        const vials = intakeKit.intake_kit_items;
        const RACK_OF_VIALS = Immutable.Map({
          'a1-vial': 24,
          'd1-vial': 12,
          'd2-vial': 8
        });
        const items = [];
        for (const vial of vials) {
          const rackOfVials = RACK_OF_VIALS.get(vial.container_type_id) != null ? RACK_OF_VIALS.get(vial.container_type_id) : 1;
          let vialIndex = 0;
          for (let i = 0; i < vial.quantity * rackOfVials; i++) {
            const item = {
              container_type_id: vial.container_type_id,
              id: vial.id,
              barcode: null
            };
            if (vial.intake_kit_item_containers[vialIndex] != null) {
              item.prefilledBarcode = vial.intake_kit_item_containers[vialIndex].barcode;
              item.isValid = true;
              item.barcode = vial.intake_kit_item_containers[vialIndex].barcode;
              item.itemId = vial.intake_kit_item_containers[vialIndex].id;
              item.containerId = vial.intake_kit_item_containers[vialIndex].container_id;
              vialIndex++;
            }
            items.push(item);
          }
        }
        this.setState({
          currentNavIndex: 0,
          navigationList: ['Pack Container', 'Shipment'],
          completedIndex: [false, false],
          containerIds: items.map(item => item.containerId),
          items: items,
          intakeKit: intakeKit,
          loading: false
        });
      }
    });
  }

  async handleBarcodeUpdate(containers) {
    if (containers.length) {
      const labId = _.get(this.state.intakeKit, 'lab_id');
      const validatedContainers = await ContainerActions.validateConsumableBarcodes(containers.map(container => ({ ...container, lab_id: labId })));
      this.addValidatedContainersToState(validatedContainers);

      const { items } = this.state;
      const intakeKitItems = Immutable.fromJS(items);
      for (let i = 0; i < items.length; i++) {
        this.addValidationOnSingleRow(items[i].isValid, items[i].barcode, i, intakeKitItems.get(i), items,  items[i].containerId);
      }
    }
  }

  addValidatedContainersToState(containers) {
    let itemsIndex = 0;
    const items = [...this.state.items];
    if (containers.length < items.length) {
      for (const container of containers) {
        while (this.shouldSkipRow(items, itemsIndex, container)) {
          itemsIndex++;
        }
        this.mapContainerToItem(container, items[itemsIndex]);
        itemsIndex++;
      }
    } else {
      for (let i = 0; i < items.length; i++) {
        this.mapContainerToItem(containers[i], items[i]);
      }
    }
    this.setState({ items: items });
  }

  shouldSkipRow(items, itemsIndex, container) {
    return items[itemsIndex].isValid || items[itemsIndex].container_type_id !== container.container_type_id;
  }

  mapContainerToItem(container, item) {
    item.barcode = container.barcode;
    item.isValid = container.is_valid && !validators.barcode(container.barcode);
    item.containerId = container.container_id;
  }

  barcodeInput(e, row) {
    const { items } = this.state;
    items[row].barcode = e.target.value;
    items[row].editing = true;
    this.setState({ items: [...items] });
  }

  barcodeValidate(e, intakeKitItem, row) {
    if (validators.barcode(e.target.value)) {
      const { items } = this.state;
      items[row].editing = false;
      this.addActionOnInvalidBarcode(row, intakeKitItem);
    } else if (e.target.value.length) {
      const containers = [{
        container_type_id: intakeKitItem.get('container_type_id'),
        barcode: e.target.value,
        lab_id: _.get(this.state.intakeKit, 'lab_id')
      }];
      ContainerActions.validateConsumableBarcodes(containers).done(response => {
        const { items } = this.state;
        items[row].editing = false;

        const isValid = response[0].is_valid;
        const barcode = response[0].barcode;
        const containerId = response[0].container_id;

        this.addValidationOnSingleRow(isValid, barcode, row, intakeKitItem, items, containerId);
      });
    }
  }

  addValidationOnSingleRow(isValid, barcode, row, intakeKitItem, items, containerId) {
    const { outboundConsumableContainerIds } = this.state;
    if (items[row].containerId != null && items[row].prefilledBarcode && items[row].barcode != items[row].prefilledBarcode) {
      outboundConsumableContainerIds.push(items[row].containerId);
    }
    if (isValid && (items.filter(item => item.barcode === barcode).length === 1 || row === items.findIndex(item => item.barcode === barcode))) {
      this.addActionOnValidBarcode(row, barcode, containerId, intakeKitItem);
    } else {
      this.addActionOnInvalidBarcode(row, intakeKitItem);
    }
    this.setState({
      outboundConsumableContainerIds: [...outboundConsumableContainerIds]
    });
  }

  addActionOnValidBarcode(row, barcode, containerId, intakeKitItem) {
    const { items, consumableContainerIds, validIntakeKitItems } = this.state;
    items[row].barcode = barcode;
    items[row].isValid = true;
    items[row].validBarcode = barcode;
    items[row].containerId = containerId;
    consumableContainerIds.push(containerId);
    const intakeKitItemContainer = {
      intake_kit_item_id: intakeKitItem.get('id'),
      container_id: containerId
    };
    const intakeKitItemContainerAttributes =  items[row].itemId ? { ...intakeKitItemContainer, id: items[row].itemId } : intakeKitItemContainer;

    // If the intake kit item (e.g. A1 type) is not present in the list.
    if (!validIntakeKitItems.find(item => item.id === intakeKitItem.get('id'))) {
      validIntakeKitItems.push({
        id: intakeKitItem.get('id'),
        intake_kit_id: this.state.intakeKit.id,
        intake_kit_item_containers_attributes: [intakeKitItemContainerAttributes]
      });
    } else {
      const item = validIntakeKitItems.find(item => item.id === intakeKitItem.get('id'));
      const itemIndex = validIntakeKitItems.indexOf(item);
      // In prefilled row, remove all delete and update action and pushing the new if same container doesn't exist in the list
      if (items[row].itemId != null) {
        validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes = validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.filter(i => i.id !== items[row].itemId);
      }

      // If the valid container is not avaiable add it to the list.
      if (!item.intake_kit_item_containers_attributes.find(item => item.container_id === intakeKitItemContainerAttributes.container_id)) {
        item.intake_kit_item_containers_attributes.push(intakeKitItemContainerAttributes);
      }
    }

    this.setState({
      items: [...items],
      validIntakeKitItems: [...validIntakeKitItems],
      consumableContainerIds: [...consumableContainerIds] });
  }

  addActionOnInvalidBarcode(row, intakeKitItem) {
    const { items, validIntakeKitItems, consumableContainerIds, outboundConsumableContainerIds } = this.state;

    const item = validIntakeKitItems.find(item => item.id === intakeKitItem.get('id'));
    const itemIndex = validIntakeKitItems.indexOf(item);

    // If valid barcode row changes to invalid barcode row, remove that valid container from the valid list.
    if (item && item.intake_kit_item_containers_attributes.length === 1 && items[row].isValid && !items[row].prefilledBarcode) {
      consumableContainerIds.splice(consumableContainerIds.findIndex(id => id === items[row].containerId), 1);
      validIntakeKitItems.splice(itemIndex, 1);
    } else if (item && item.intake_kit_item_containers_attributes.length >= 2 && !items[row].prefilledBarcode) {
      if (items[row].isValid) {
        const container = validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.find(i => i.container_id === items[row].containerId);
        const index = validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.indexOf(container);
        validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.splice(index, 1);
        consumableContainerIds.splice(consumableContainerIds.findIndex(id => id === items[row].containerId), 1);
      }
    }
    items[row].isValid = false;
    if (items[row].itemId != null && items[row].barcode != items[row].prefilledBarcode) {
      const intakeKitItemContainer = {
        id: items[row].itemId,
        _destroy: '1'
      };
      if (!validIntakeKitItems.find(item => item.id === intakeKitItem.get('id'))) {
        validIntakeKitItems.push({
          id: intakeKitItem.get('id'),
          intake_kit_id: this.state.intakeKit.id,
          intake_kit_item_containers_attributes: [intakeKitItemContainer]
        });
      } else {
        const item = validIntakeKitItems.find(item => item.id === intakeKitItem.get('id'));
        if (items[row].itemId != null) {
          validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes = validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.filter(i => i.id !== items[row].itemId);
        }
        if (!item.intake_kit_item_containers_attributes.find(item => item.id === intakeKitItemContainer.id)) {
          item.intake_kit_item_containers_attributes.push(intakeKitItemContainer);
        }
      }
    } else if (items[row].itemId != null && items[row].barcode === items[row].prefilledBarcode && itemIndex !== -1) {
      items[row].isValid = true;
      validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes = validIntakeKitItems[itemIndex].intake_kit_item_containers_attributes.filter(i => i.id !== items[row].itemId);
      if (outboundConsumableContainerIds.findIndex(id => id === items[row].containerId) !== -1) {
        outboundConsumableContainerIds.splice(outboundConsumableContainerIds.findIndex(id => id === items[row].containerId), 1);
      }
    }

    this.setState({
      items: [...items],
      validIntakeKitItems: [...validIntakeKitItems],
      consumableContainerIds: [...consumableContainerIds] });
  }

  getFormat(intakeKit) {
    const CONTAINER_TYPES = Immutable.Map({
      'a1-vial': 'A1',
      'd1-vial': 'D1',
      'd2-vial': 'D2'
    });
    return CONTAINER_TYPES.get(intakeKit.get(('container_type_id'))) != null ?
      CONTAINER_TYPES.get(intakeKit.get(('container_type_id'))) : intakeKit.get(('container_type_id'));
  }

  setIntakeKitState(items, isNext) {
    this.setState({ validIntakeKitItems: [],
      containerIds: items.filter((item) => item.containerId).map((filteredItem) => filteredItem.containerId),
      outboundConsumableContainerIds: [],
      consumableContainerIds: [],
      isShipmentConfirmation: isNext,
      currentNavIndex: isNext ? 1 : this.state.currentNavIndex,
      items },
    () => !isNext && NotificationActions.createNotification({ text: 'Saved Successfully' }));
  }

  saveForLater(isNext) {
    const { intakeKit, validIntakeKitItems, items } = this.state;
    if (isNext && items.filter(item => item.isValid !== true).length >= 1) {
      NotificationActions.createNotification({
        text: 'Intake kit needs to be filled with valid barcodes in all available slots to ship',
        isError: true });
      return;
    }

    if (this.state.consumableContainerIds.length === 0) {
      this.setState({ isShipmentConfirmation: !!isNext, currentNavIndex: isNext ? 1 : this.state.currentNavIndex });
      return;
    }

    const intakeKitRequest = {
      id: intakeKit.id,
      intake_kit: {
        intake_kit_items_attributes: validIntakeKitItems
      }
    };

    for (const vial of validIntakeKitItems) {
      for (const container of vial.intake_kit_item_containers_attributes) {
        if (container._destroy === '1') {
          const row = this.state.items.findIndex(i => i.itemId === container.id);
          items[row].itemId = null;
        }
      }
    }

    IntakeKitActions.update(intakeKitRequest)
      .done((response) => {

        if (response) {
          const intakeKitItems = response.intake_kit_items;
          for (const intakeKitItem of intakeKitItems) {
            for (const intakeKitItemContainer of intakeKitItem.intake_kit_item_containers) {
              const row = items.findIndex(item => item.barcode === intakeKitItemContainer.barcode
                 && item.containerId === intakeKitItemContainer.container_id);
              if (row !== -1) {
                items[row].prefilledBarcode = intakeKitItemContainer.barcode;
                items[row].itemId = intakeKitItemContainer.id;
              }
            }
          }
        }
        const hasOutbounds = this.state.outboundConsumableContainerIds.length > 0;

        ContainerActions.updateMany(this.state.consumableContainerIds, { status: 'outbound_consumable' })
          .done(() => {
            if (hasOutbounds) {
              ContainerActions.updateMany(this.state.outboundConsumableContainerIds, { status: 'consumable' })
                .done(() => this.setIntakeKitState(items, isNext));
            } else this.setIntakeKitState(items, isNext);
          });
      });
  }

  isDisabled() {
    const { items } = this.state;
    return items.filter(item => item.isValid === true || item.itemId != null).length === 0;
  }

  showValidationMark(row) {
    const item = this.state.items[row];
    if (((item.isValid && !_.isEmpty(item.barcode)) ||  (!_.isEmpty(item.barcode) && item.barcode === item.prefilledBarcode)) && !item.editing) {
      return <span><i className="fa fa-check" style={{ color: 'green' }} /></span>;
    } else if (!_.isEmpty(item.barcode) && item.isValid != null && !item.editing) {
      return <span><i className="fa fa-times" style={{ color: 'red' }} /></span>;
    }
    return null;
  }

  expandableCardHeader() {
    return (
      <div className="col-md-2">
        <Button
          type="secondary"
          onClick={() => { this.setState({ showExpandableCardBody: false }); }}
          className="bulk-upload-button"
          icon="fa fa-cloud-upload-alt"
        >
          Bulk upload barcodes
        </Button>
      </div>
    );
  }

  expandableCardBody() {
    return (
      <CsvUploadPane
        items={this.state.items}
        handleBarcodeUpdate={(...args) => this.handleBarcodeUpdate(...args)}
      />
    );
  }

  getProcessedOnDate(intakeKit) {
    return (
      <div className="col-md-3">
        <p className="processed-on-string">
          Processed on <BaseTableTypes.Time data={intakeKit.admin_processed_at} />
        </p>
      </div>
    );
  }

  renderFormat(intakeKit) {
    return <BaseTableTypes.Text data={this.getFormat(intakeKit)} />;
  }

  renderBarcode(intakeKitItem, row) {
    return (
      <span onClick={e => e.stopPropagation()}>
        {this.state.intakeKit.status !== 'delivered' ? (
          <div className="shipment-container-row__barcode">
            <TextInput
              name="text-input"
              placeholder="Scan barcode"
              value={this.state.items[row].barcode}
              onBlur={(e) => this.barcodeValidate(e, intakeKitItem, row)}
              onChange={(e) => this.barcodeInput(e, row)}
              onKeyDown={e => (e.key === 'Enter' && this.barcodeValidate(e, intakeKitItem, row))}
              disabled={this.state.intakeKit.status === 'delivered'}
            />
          </div>
        ) : <BaseTableTypes.Text data={this.state.items[row].barcode} /> }
        {this.state.intakeKit.status !== 'delivered' &&  this.showValidationMark(row)}
      </span>
    );
  }

  render() {
    const { loading, intakeKit } = this.state;
    const renderType = (intakeKit) => {
      if (intakeKit.get('test_mode')) {
        return <h3><i className="tx-type--warning fas fa-flask test-icon" /></h3>;
      }
      return <i className={classNames('baby-icon', 'aminol-tube')} />;
    };

    if (loading) {
      return (<Spinner />);
    }
    const steps = [];
    const NUM_STEPS = 2;

    const stepFactory = (index) => {
      return {
        title: this.state.navigationList[index],
        iconClass: IntakeKitDetailsPage.navigationIcons[index]
      };
    };

    for (let i = 0; i < NUM_STEPS; i++) {
      steps.push(stepFactory(i));
    }

    return (
      <Page title="Intake Kit">
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.lab_intake_kits()}>Internal shipment</Link>
                  <Link to={Urls.lab_intake_kit(intakeKit.id)}>{intakeKit.name} intake kit request</Link>
                </Breadcrumbs>
            )}
            />
        )}
        />

        <TabLayout className="intake-kit-details-page____tablayout">
          { intakeKit.status !== 'delivered' && (
          <div className="intake-kit-details-page__tracker">
            <PizzaTracker
              steps={steps}
              activeStepIndex={this.state.currentNavIndex}
              onChange={() => {}}
            />
          </div>
          )}
          { this.state.isShipmentConfirmation ?
            (
              <ShipmentConfirmationPage
                intakeKit={this.state.intakeKit}
                containerIds={this.state.containerIds}
                intakeKitNotes={this.state.intakeKit.notes}
                {...this.props}
              />
            ) :
            (
              <React.Fragment>
                <div className="intake-kit-details-page__banner">
                  {this.state.showBanner && intakeKit.status !== 'delivered' && (
                  <Banner
                    bannerType="info"
                    bannerMessage={'Please screw caps before shipping'}
                    onClose={() => { this.setState({ showBanner: false }); }}
                  />
                  )}
                </div>
                <div className="intake-kit-details-page__banner">
                  <Card>
                    <div className="row">
                      <div className="col-md-9">
                        <span
                          className="intake-kit-details-page__banner__table-title"
                        >
                          {intakeKit.name} kit request
                        </span>
                      </div>
                      { intakeKit.status !== 'delivered' ? (
                        <ExpandableCard
                          cardHead={this.expandableCardHeader()}
                          cardBody={this.expandableCardBody()}
                          expanded={this.state.showExpandableCardBody}
                        />
                      ) : this.getProcessedOnDate(intakeKit)
                      }
                    </div>
                  </Card>
                  <List
                    data={Immutable.fromJS(this.state.items)}
                    id="intake-kits-table"
                    loaded
                    disabledSelection
                  >
                    <Column relativeWidth={1} renderCellContent={renderType} header="TYPE" id="type" />
                    <Column relativeWidth={5} renderCellContent={this.renderFormat} header="FORMAT" id="format" />
                    <Column relativeWidth={4} renderCellContent={this.renderBarcode} header="BARCODE" id="barcode" />
                  </List>
                </div>
                { intakeKit.status !== 'delivered' && (
                <div className="intake-kit-details-page__buttons">
                  <ButtonGroup orientation="horizontal">
                    <Button
                      link
                      type="primary"
                      to={Urls.lab_intake_kits()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      height="tall"
                      onClick={() => this.saveForLater()}
                      invert
                      disabled={this.isDisabled()}
                    >
                      Save for later
                    </Button>
                    <Button
                      type="primary"
                      height="tall"
                      onClick={() => this.saveForLater(true)}
                      disabled={this.isDisabled()}
                    >
                      Next
                    </Button>
                  </ButtonGroup>
                </div>
                )}
              </React.Fragment>
            )
          }
        </TabLayout>
      </Page>
    );
  }
}

export default IntakeKitDetailsPage;
