import { Button, Card, Popover, Tooltip, ItemCheckbox, DropDown, DateTime } from '@transcriptic/amino';
import classNames               from 'classnames';
import Immutable                from 'immutable';
import PropTypes                from 'prop-types';
import React, { PureComponent } from 'react';
import UserStore                from 'main/stores/UserStore';
import UserProfile              from 'main/components/UserProfile/UserProfile';
import FeatureConstants         from '@strateos/features';
import FeatureStore             from 'main/stores/FeatureStore';

import './ContainerRowSpacing.scss';

class ContainerRowCard extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      shouldShowDismissable: false
    };
  }

  aliquotCount() {
    const aliquotCount = this.props.container.get('aliquot_count');
    const aliquots     = this.props.container.get('aliquots');

    if (aliquotCount !== undefined) {
      return aliquotCount;
    } else if (aliquots) {
      return aliquots.size;
    }

    return undefined;
  }

  canShowColumn(column) {
    return this.props.allowedColumns.indexOf(column) !== -1;
  }

  canShowShipmentInfo() {
    const status = this.props.container.get('status');

    return (
      (this.props.shipment !== undefined) &&
      (this.props.shipment.get('checked_in_at') == undefined) &&
      !['destroyed', 'pending_destory'].includes(status)
    );
  }

  showShipmentLabel() {
    return (
      this.canShowShipmentInfo() &&
      this.props.shipment.get('label') != undefined
    );
  }

  showSelectAllWells() {
    return !this.props.isTube && this.props.selectionType === 'ALIQUOT+';
  }

  close() {
    this.setState({ shouldShowDismissable: false });
  }

  shipmentCode() {
    // we use a default string to allow flex-grow to work properly.
    const defaultValue = '';

    if (this.canShowShipmentInfo() && this.props.container.get('shipment_code')) {
      return this.props.container.get('shipment_code') || defaultValue;
    }

    return defaultValue;
  }

  renderContent() {
    return (this.aliquotCount() !== undefined) ? `${this.aliquotCount()} aliquots` : '';
  }

  renderSelectAliquotsCheckbox() {
    return (
      <div onClick={(e) => { e.stopPropagation(); }}>
        <ItemCheckbox
          id={this.props.container.get('id')}
          checkState={this.props.isSelected}
          onChange={() => {
            if (!this.props.isSelected) {
              this.setState({ shouldShowDismissable: true });
            } else {
              this.props.onContainerSelected(this.props.container.get('id'), !this.props.isSelected);
            }
          }}
        />
        <DropDown
          header="Select all aliquots in plate?"
          isOpen={this.state.shouldShowDismissable}
          excludedParentNode={this.targetNode}
          hideDismissable={() => this.close()}
        >
          <span className="search-results-table__select-aliquots tx-inline tx-inline--xxs">
            <a
              onClick={() => {
                this.props.onAllWellsSelected(this.props.container.get('id'));
                this.close();
              }}
            >
              Select
            </a>
            <a onClick={() => this.close()}>Cancel</a>
          </span>
        </DropDown>
      </div>
    );
  }

  renderCreatedBy() {
    const user = UserStore.getById(this.props.container.get('created_by'));
    return (user ?  <UserProfile onModal={this.props.onModal} user={user} /> : '-');
  }

  render() {
    const iconSuffix      = this.props.isTube ? 'tube-icon.svg' : 'plate-icon.svg';
    const iconUrl         = `/images/icons/inventory_browser_icons/${iconSuffix}`;
    const container       = this.props.container;
    const containerTypeId = this.props.containerTypeId;
    const createdAt       = <DateTime timestamp={(container.get('created_at'))} />;
    const updatedAt       = <DateTime timestamp={(container.get('updated_at'))} />;
    const status          = this.props.container.get('status');
    const destructionTime = this.props.container.get('will_be_destroyed_at');

    const customClassNames = classNames(
      'container-row',
      'container-row-spacing',
      'search-results-table__container-row-card',
      this.props.className
    );

    return (
      <Card
        className="container-row-card"
        allowOverflow
        onClick={() => (!this.props.onModal && this.props.onViewDetailsClicked(container))}
      >
        <div className={customClassNames}>
          { (this.props.isSelectable || this.showSelectAllWells()) && (
            <div
              className="container-row-spacing__icon"
              ref={(node) => { this.targetNode = node; }}
            >
              { this.showSelectAllWells() ?
                this.renderSelectAliquotsCheckbox() : (
                  <div onClick={(e) => { e.stopPropagation(); }}>
                    <ItemCheckbox
                      id={this.props.container.get('id')}
                      checkState={this.props.isSelected}
                      onChange={() => this.props.onContainerSelected(
                        this.props.container.get('id'),
                        !this.props.isSelected
                      )}
                    />
                  </div>
                )}
            </div>
          )}
          { this.props.alertText && (
            <div className="alert-indicator">
              <Button icon="fa fa-exclamation" height="short" type="danger" label={this.props.alertText} labelPlacement="right" />
            </div>
          )}

          { this.canShowColumn('type') && (
            <div className="
              container-row-spacing__icon
              search-results-table__icon
              container-row-spacing__column
              tx-inline tx-inline--xxxs"
            >
              <img
                src={iconUrl}
                alt={this.props.isTube ? 'Tube Icon' : 'Plate Icon'}
              />
            </div>
          )}

          {this.canShowColumn('name') && (
            <div className="container-row-spacing__name container-row-spacing__column">
              <Popover
                content={<span>{container.get('label')}</span>}
                placement="bottom"
                trigger="hover"
                onModal={this.props.onModal}
              >
                <p className={classNames({ 'tx-type--warning': container.get('test_mode') })}>
                  {container.get('label')}
                </p>
              </Popover>
              {container.get('test_mode') && (
                <div className="container-row-spacing__status-icon">
                  <Tooltip
                    title="Test Container"
                    placement="bottom"
                  >
                    <i className="tx-type--warning fas fa-flask" />
                  </Tooltip>
                </div>
              )}
            </div>
          )}

          { this.canShowColumn('id') && (
            <div className="container-row-spacing__container-id container-row-spacing__column">
              <p className="search-results-table__container-id desc">{container.get('id')}</p>
            </div>
          )}

          { this.canShowColumn('format') && (
            <div className="container-row-spacing__container-type container-row-spacing__column">
              <p className="desc">{containerTypeId}</p>
            </div>
          )}

          { this.canShowColumn('contents') && (
            <div className="container-row-spacing__container-content container-row-spacing__column">
              <p className="desc">{this.renderContent()}</p>
            </div>
          )}

          { this.canShowColumn('condition') && (
            <div className="container-row-spacing__condition container-row-spacing__column">
              <p className="desc">{container.get('storage_condition')}</p>
            </div>
          )}

          { this.canShowColumn('created') && (
            this.props.justCreated ? (
              <div className="container-row-spacing__created-at container-row-spacing__column">
                <p className="date desc search-results-table__new">Just now</p>
              </div>
            )
              : (
                <div className="container-row-spacing__created-at container-row-spacing__column">
                  <p className="date desc">{createdAt}</p>
                </div>
              )
          )}

          { this.canShowColumn('last used') && (

            this.showShipmentLabel() && (
              <div className="container-row-spacing__created-at container-row-spacing__column">
                <p className="desc search-results-table__shipping-label">
                  {`Please ship ${this.props.shipment.get('label')}`}
                </p>
              </div>
            )((status === 'destroyed') || destructionTime) ? (
              <div className="container-row-spacing__created-at container-row-spacing__column">
                <p className="date container-row-spacing__text desc tx-type--error">
                  {updatedAt}
                </p>
                <div className="container-row-spacing__status-icon">
                  {status === 'destroyed'} ?
                  (
                  <Tooltip
                    title="Destroyed"
                    placement="bottom"
                  >
                    <i className="tx-type--error fa fa-trash" />
                  </Tooltip>
                  )
                  :
                  (
                  <Tooltip
                    title="Pending Destruction"
                    placement="bottom"
                  >
                    <i className="tx-type--error far fa-bomb" />
                  </Tooltip>
                  <span className="search-results-table__modifier-text desc tx-type--error">
                    {' (PENDING)'}
                  </span>
                  )
                </div>
              </div>
              ) :
              (
                <div className="container-row-spacing__last-used container-row-spacing__column">
                  <p className="date desc">{updatedAt}</p>
                </div>
              )
          )
          }

          { this.canShowColumn('code') && (
            <h4 className="container-row-spacing__container-code container-row-spacing__column">
              {this.shipmentCode()}
            </h4>
          )}

          { this.canShowColumn('organization') && FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn(['lab', 'id'])) && (
            <h4 className="container-row-spacing__organization-name container-row-spacing__column">
              <p className="desc">{container.get('organization_name') || '-' }</p>
            </h4>
          )}

          { this.canShowColumn('created by') && (
            <div className="container-row-spacing__created-by container-row-spacing__column">
              {this.renderCreatedBy()}
            </div>
          )}
        </div>
      </Card>
    );
  }
}

ContainerRowCard.propTypes = {
  className:            PropTypes.string,
  container:            PropTypes.instanceOf(Immutable.Map),
  containerTypeId:      PropTypes.string.isRequired,
  allowedColumns:       PropTypes.arrayOf(PropTypes.string),
  isTube:               PropTypes.bool,
  justCreated:          PropTypes.bool,
  onViewDetailsClicked: PropTypes.func,
  shipment:             PropTypes.instanceOf(Immutable.Map),
  alertText:            PropTypes.string,
  isSelected:           PropTypes.bool,
  isSelectable:         PropTypes.bool,
  onContainerSelected:  PropTypes.func,
  selectionType:        PropTypes.string,
  onAllWellsSelected:   PropTypes.func
};

ContainerRowCard.defaultProps = {
  allowedColumns: [
    'name',
    'id',
    'type',
    'format',
    'contents',
    'condition',
    'created',
    'last used',
    'code',
    'created by'
  ]
};

export default ContainerRowCard;
