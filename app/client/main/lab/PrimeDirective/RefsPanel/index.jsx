import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';
import { Link } from 'react-router-dom';

import ConnectToStoresHOC           from 'main/containers/ConnectToStoresHOC';
import { CollapsiblePanel, Button, Table, Column, StatusPill, Card } from '@transcriptic/amino';
import ModalActions                 from 'main/actions/ModalActions';
import ContainerActions             from 'main/actions/ContainerActions';

import LocationPath                 from 'main/components/LocationPath';
import { EditInPlace }              from 'main/components/EditInPlace';
import { ContainerTag }             from 'main/components/InstructionTags/index';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import LocationStore                from 'main/stores/LocationStore';
import ContainerStore               from 'main/stores/ContainerStore';
import ContainerAPI                 from 'main/api/ContainerAPI';
import ContainerType                from 'main/components/ContainerType';
import Urls                         from 'main/util/urls';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import NotificationActions from 'main/actions/NotificationActions';

import './RefsPanel.scss';

class Panel extends React.Component {
  static get propTypes() {
    return {
      run: PropTypes.object.isRequired,
      onRunChange: PropTypes.func.isRequired,
      initiallyCollapsed: PropTypes.bool,
      containers: PropTypes.array,
      containerIds: PropTypes.array,
      isValidUser: PropTypes.bool
    };
  }

  static locationPath(location, position) {
    if (location) {
      const ancestors = location.get('ancestors').toArray();
      const locations = [...ancestors, location];
      let str = locations.map(a => a.get('name')).join(' ');
      if (position) {
        str += ` ${position}`;
      }
      return str;
    }

    return undefined;
  }

  static renderDestiny(ref) {
    if (ref.getIn(['destiny', 'discard'])) {
      return <span><i className="fa fa-trash-alt" /> Discard</span>;
    } else if (ref.getIn(['destiny', 'store'])) {
      const destiny = ref.getIn(['destiny', 'store']).map((k, v) => `${k}: ${v}`).join(', ');
      return `Store ${destiny}`;
    }

    return undefined;
  }

  constructor(props) {
    super(props);
    this.onEditBarcode = this.onEditBarcode.bind(this);

    this.state = {
      orderBy: 'refName',
      orderDesc: false
    };

    this.onLocationSelected = this.onLocationSelected.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
    this.renderRefName = this.renderRefName.bind(this);
    this.renderId = this.renderId.bind(this);
    this.renderCover = this.renderCover.bind(this);
    this.renderLocation = this.renderLocation.bind(this);
    this.renderContainerType = this.renderContainerType.bind(this);
    this.renderDestiny = this.renderDestiny.bind(this);
    this.renderFulfilled = this.renderFulfilled.bind(this);
  }

  componentWillMount() {
    ContainerActions.loadContainers(this.props.containerIds);
  }

  onEditBarcode(barcode, finishEdit, ref) {
    const trimmedBarcode = barcode.trim();
    ContainerAPI.update(ref.getIn(['container', 'id']), {
      barcode: trimmedBarcode || undefined // empty string not allowed
    }).always(finishEdit).done(() => {
      const refIndex = this.props.run.get('refs').findIndex(runRef => runRef.get('name') === ref.get('name'));
      const new_run = this.props.run.setIn(['refs', refIndex, 'container', 'barcode'], trimmedBarcode);
      return this.props.onRunChange(new_run);
    }).fail((...response) => NotificationActions.handleError(...response));
  }

  // TODO: Make this work with immutable
  onLocationSelected(locationId, ref) {
    const containerId = ref.getIn(['container', 'id']);
    // Update container location on server
    ContainerActions.relocate(containerId, locationId);

    // Update container location on PrimeDirective run object
    const run = this.props.run;
    const runRefs = run.get('refs').toJS();
    const foundRef = _.find(
      runRefs, currRef => currRef.container.id === ref.getIn(['container', 'id'])
    );
    foundRef.container.location = LocationStore.getById(locationId).toJS();

    return this.props.onRunChange(run);
  }

  orderedRefs() {
    return this.props.run.get('refs').sort((ref1arg, ref2arg) => {
      let ref1 = ref1arg;
      let ref2 = ref2arg;

      if (this.state.orderDesc) {
        [ref1, ref2] = Array.from([ref2arg, ref1arg]);
      }

      let [str1, str2] = Array.from((() => {
        switch (this.state.orderBy) {
          case 'refName':
            return [ref1.get('name'), ref2.get('name')];
          case 'id': {
            const ref1Barcode = ref1.getIn(['container', 'barcode']);
            const ref2Barcode = ref2.getIn(['container', 'barcode']);

            return [
              `${ref1Barcode} ${ref1.get('container_id')}`,
              `${ref2Barcode} ${ref2.get('container_id')}`
            ];
          }
          case 'location': {
            const location1 = Panel.locationPath(
              ref1.getIn(['container', 'location']),
              ref1.getIn(['container', 'slot', 'row'])
            );
            const location2 = Panel.locationPath(
              ref2.getIn(['container', 'location']),
              ref2.getIn(['container', 'slot', 'row'])
            );
            const device1 = ref1.getIn(['container', 'device', 'id']);
            const device2 = ref2.getIn(['container', 'device', 'id']);

            return [
              location1 || device1 || 'unknown',
              location2 || device2 || 'unknown'
            ];
          }

          case 'container_type':
            return [
              `${ref1.getIn(['container_type', 'id'])}`,
              `${ref2.getIn(['container_type', 'id'])}`
            ];
          case 'destiny':
            return [JSON.stringify(ref1.get('destiny')), JSON.stringify(ref2.get('destiny'))];
          case 'fulfilled':
            return [
              ref1.getIn(['container', 'status']),
              ref2.getIn(['container', 'status'])
            ];
          case 'cover':
            return [
              ref1.getIn(['container', 'cover']),
              ref2.getIn(['container', 'cover'])
            ];

          default:
            return undefined;
        }
      })());

      // append the refname so that equal values will use the secondary sort order of the refnames.
      [str1, str2] = Array.from([`${str1}_${ref1.get('name')}`, `${str2}_${ref2.get('name')}`]);

      return str1.localeCompare(str2);
    });
  }

  onSortChange(id, direction) {
    this.setState({
      orderBy: id,
      orderDesc: direction === 'desc'
    });
  }

  renderRefName(record) {
    return (
      <ContainerTag refName={record.get('name')} run={this.props.run} disableTooltip applyScroll />
    );
  }

  renderId(record) {
    const containerId = record.get('container_id');
    const barcode = record.getIn(['container', 'barcode']);

    return containerId ? (
      <div>
        <EditInPlace
          clearOnEdit={!barcode}
          value={barcode || '(No Barcode)'}
          onSave={(editedBarcode, finishEdit) => this.onEditBarcode(editedBarcode, finishEdit, record)}
        />{' / '}
        <Link to={Urls.container(containerId)}>{containerId}</Link>
        {
          record.getIn(['container', 'status']) === 'inbound' &&
            <div><StatusPill shape="tag" type="danger" text="inbound" /></div>
        }
      </div>
    ) : '-';
  }

  renderCover(record) {
    return record.getIn(['container', 'cover']) || 'Uncovered';
  }

  renderLocation(record) {
    const containerId = record.get('container_id');
    const container = this.props.containers.find(c => c.get('id') === containerId) || Immutable.Map();
    const containerLocation = LocationStore.getById(container.get('location_id'));

    return containerId ? (
      <div className="refs-panel__location">
        {containerLocation && containerLocation.get('ancestors') ? (
          <LocationPath
            location={containerLocation}
            containerId={containerId}
            position={record.getIn(['container', 'slot', 'row'])}
            withLinks
          />
        ) : (
          record.getIn(['container', 'device']) ?
            record.getIn(['container', 'device', 'id'])
            :
            'Unknown location'
        )}
        <div>
          <Button
            size="xsmall"
            height="short"
            onClick={() => ModalActions.open(`${LocationAssignmentModal.MODAL_ID}${containerId}`)}
          >
            Relocate
          </Button>
          <LocationAssignmentModal
            container={record.get('container')}
            initialLocationId={record.getIn(['container', 'location', 'id'])}
            onLocationSelected={locationId => this.onLocationSelected(locationId, record)}
            labIdForFilter={this.props.run.get('lab_id')}
          />
        </div>
      </div>
    ) : '-';
  }

  renderContainerType(record) {
    return (
      <ContainerType
        containerTypeId={record.getIn(['container_type', 'id'])}
      />
    );
  }

  renderDestiny(record) {
    return Panel.renderDestiny(record);
  }

  renderFulfilled(record) {
    return (
      (record.getIn(['container', 'status']) === 'inbound' && record.get('orderable_material_component')) ? (
        <Button
          type="primary"
          disabled
          onClick={() => {
            ModalActions.open('FULFILL_REF_MODAL');
          }}
        >
          {`Fulfill ${record.getIn(['orderable_material_component', 'resource', 'name'])}`}
        </Button>
      ) : (
        record.getIn(['orderable_material_component', 'resource', 'name']) || '-'
      )
    );
  }

  render() {
    const columnProps = {
      sortable: true,
      multiline: true,
      onSortChange: this.onSortChange
    };

    return (
      <Card className="refs-panel">
        <CollapsiblePanel
          title="Refs"
          initiallyCollapsed={this.props.initiallyCollapsed}
          hasUppercaseHeading
        >
          <Table
            id="refs-panel-table"
            loaded
            data={this.orderedRefs()}
            disableBorder
            disabledSelection
          >
            <Column
              id="refName"
              key="refName"
              header="Ref Name"
              renderCellContent={this.renderRefName}
              {...columnProps}
            />
            <Column
              id="id"
              key="id"
              header="Barcode / Container ID"
              renderCellContent={this.renderId}
              disableFormatHeader
              {...columnProps}
            />
            <Column
              id="cover"
              key="cover"
              header="Cover"
              renderCellContent={this.renderCover}
              {...columnProps}
            />
            <Column
              id="location"
              key="location"
              header="Location"
              renderCellContent={this.renderLocation}
              {...columnProps}
            />
            <Column
              id="container_type"
              key="container_type"
              header="Container type"
              renderCellContent={this.renderContainerType}
              {...columnProps}
            />
            <Column
              id="destiny"
              key="destiny"
              header="Destiny"
              renderCellContent={this.renderDestiny}
              {...columnProps}
            />
            <Column
              id="fulfilled"
              key="fulfilled"
              header="Pending Kit Request"
              renderCellContent={this.renderFulfilled}
              {...columnProps}
            />
          </Table>
        </CollapsiblePanel>
      </Card>
    );
  }
}

const getStateFromStores = ({ run }) => {
  const containerIds = run.get('refs')
    .map(ref => ref.get('container_id'))
    .toSet()
    .toJS();

  const containers = ContainerStore.getByIds(containerIds);
  const isValidUser = AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);

  return { containerIds, containers, isValidUser };
};

const ConnectedRefsPanel = ConnectToStoresHOC(Panel, getStateFromStores);
ConnectedRefsPanel.propTypes = {
  run: PropTypes.object.isRequired,
  onRunChange: PropTypes.func.isRequired,
  initiallyCollapsed: PropTypes.bool
};

export default ConnectedRefsPanel;
export {
  ConnectedRefsPanel,
  getStateFromStores,
  Panel
};
