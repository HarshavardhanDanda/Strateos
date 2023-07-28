import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import Moment from 'moment';
import { ButtonGroup, Column, Card, Tooltip, List, Section, Spinner } from '@transcriptic/amino';

import RunAPI from 'main/api/RunAPI';
import RunStore from 'main/stores/RunStore';
import { TabLayout } from 'main/components/TabLayout';
import AjaxButton from 'main/components/AjaxButton';
import TisoReservationActions from 'main/actions/TisoReservationActions';
import BaseTableTypes from 'main/components/BaseTableTypes';

import './TisosPage.scss';

const initialSelectedState = {};
class ContainersTable extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      sentIds: [],
      loadingRuns: true,
      recentRuns: Immutable.Map(),
      selected: {}
    };
  }

  componentDidMount() {
    this.getRuns();
  }

  getRuns() {
    const recentRuns = new Map();
    this.props.containers.forEach(async container => {
      const request = {
        filters: {
          container: container.id
        },
        fields: {
          runs: [
            'created_at'
          ]
        }
      };

      const payload = await RunAPI.index(request);
      const relatedRunIds = Immutable.fromJS(payload.data.map(entity => entity.id));

      if (!relatedRunIds.isEmpty()) {
        const runs = RunStore.getByIds(relatedRunIds);
        const recentRun = runs.sortBy(run => -Moment(run.get('created_at'))).first();
        recentRuns.set(container.id, recentRun);
      }
    });
    this.setState({
      recentRuns: recentRuns,
      loadingRuns: false,
      selected: initialSelectedState
    });
  }

  onSelectAll(selectedRows, wc, tiso) {
    const selectedContainer = { ...this.state.selected };
    selectedContainer[wc][tiso] = selectedRows;
    this.setState({ selected: selectedContainer });
  }

  onSelectRow(selectedRows, wc, tiso) {
    const selectedContainer = { ...this.state.selected };
    selectedContainer[wc][tiso] = selectedRows;
    this.setState({ selected: selectedContainer });
  }

  checkActionButtonStatus(wc) {
    if (this.state.selected[wc]) {
      const selectedContainer = this.selectedContainersId(wc);
      return !selectedContainer.length > 0;
    } else return true;
  }

  selectedContainersId(wc) {
    const selectedContainer = [];
    Object.values(this.state.selected[wc])
      .filter(val => Object.keys(val).length !== 0)
      .map(val => Object.keys(val).map(element => selectedContainer.push(element.toString())));
    return selectedContainer;
  }

  confirm(message) {
    return confirm(message);
  }

  renderIdRecord(record) {
    const container = record.get('container').toJS();
    return <BaseTableTypes.ContainerUrl data={container} showId />;
  }

  renderBarcodeRecord(record) {
    return record.get('barcode') ? <p>{record.get('barcode')}</p> : <p>—</p>;
  }

  renderContainerRecord(record) {
    const container = record.get('container').toJS();
    return <BaseTableTypes.ContainerUrl data={container} />;
  }

  renderRunRecord(record) {
    return <BaseTableTypes.Run data={record.get('recent_run_id')} runStatus={record.get('status')} />;
  }

  renderOrganizationRecord(record) {
    const org = (record.get('organization') || Immutable.Map()).toJS();
    return <p>{org.subdomain}</p>;
  }

  renderContainerTypeRecord(record) {
    return <BaseTableTypes.ContainerTypeId data={record.get('container_type_id')} />;
  }

  renderSlotRecord(record) {
    const slot = record.get('slot');
    return slot ? <span>{`Col ${slot.get('col')} / Row ${slot.get('row')}`}</span> : <p>—</p>;
  }

  render() {
    if (this.state.loadingRuns) {
      return <Spinner />;
    }
    let tisoContainers = _.sortBy(this.props.containers, c => c.device_id);
    tisoContainers = tisoContainers.map((c) => {
      const container = _.pick(c, 'id', 'label');
      const recent_run = this.state.recentRuns.get(c.id);
      const recent_run_id = recent_run ? recent_run.get('id') : '';
      const workCellNumber = c.device_id ? c.device_id.substr(0, 3) : 'Missing Location';
      const tisoNumber = c.device_id ? c.device_id.substr(4) : '';
      return {
        container,
        workCellNumber,
        tisoNumber,
        recent_run_id,
        ...c
      };
    });
    tisoContainers = _.groupBy(tisoContainers, 'workCellNumber');

    // eslint-disable-next-line react/no-unstable-nested-components
    const TisoActions = (result) => {
      const id = result.get('id').toString();
      if (this.state.sentIds.includes(id)) {
        return <span>Request sent</span>;
      } else {
        return (
          <ButtonGroup size="small" orientation="horizontal">
            <Tooltip
              title="Retrieve"
              placement="bottom"
              slim
            >
              <AjaxButton
                type="secondary"
                className="tisos-page__action-button"
                icon="fas fa-hand-holding-box"
                size="small"
                height="short"
                link
                action={() => {
                  TisoReservationActions.submitRetrieve(id);
                  return this.setState({
                    sentIds: this.state.sentIds.concat(id)
                  });
                }}
              />
            </Tooltip>

            <Tooltip
              title="Manually Remove"
              placement="bottom"
              slim
            >
              <AjaxButton
                type="secondary"
                className="tisos-page__action-button"
                size="small"
                height="short"
                icon="fas fa-times"
                confirmMessage="Really manually retrieve this container?"
                link
                action={() => {
                  TisoReservationActions.submitManual(id);
                  return this.setState({
                    sentIds: this.state.sentIds.concat(id)
                  });
                }}
              />
            </Tooltip>

            <Tooltip
              title="Discard"
              placement="bottom"
              slim
            >
              <AjaxButton
                type="secondary"
                className="tisos-page__action-button"
                size="small"
                height="short"
                icon="fas fa-trash-alt"
                confirmMessage="Really throw away this container?"
                link
                action={() => {
                  TisoReservationActions.submitDiscard(id);
                  return this.setState({
                    sentIds: this.state.sentIds.concat(id)
                  });
                }}
              />
            </Tooltip>
          </ButtonGroup>
        );
      }
    };

    const BulkTisoActions = (wc) => {
      const clearSelectedState = { ...this.state.selected };
      clearSelectedState[wc] = initialSelectedState[wc];
      return [
        {
          title: 'Retrieve',
          icon: 'far fa-hand-holding-box',
          action: () => {
            const id = this.selectedContainersId(wc);
            TisoReservationActions.submitRetrieveMany(id);
            return this.setState({
              sentIds: this.state.sentIds.concat(id),
              selected: clearSelectedState
            });
          },
          disabled: this.checkActionButtonStatus(wc)
        },
        {
          title: 'Manually remove',
          icon: 'far fa-times',
          action: () => {
            const message = 'Really manually retrieve this container?';
            if (this.confirm(message)) {
              const id = this.selectedContainersId(wc);
              TisoReservationActions.submitManualMany(id);
              return this.setState({
                sentIds: this.state.sentIds.concat(id),
                selected: clearSelectedState
              });
            }
          },
          disabled: this.checkActionButtonStatus(wc)
        },
        {
          title: 'Discard',
          icon: 'far fa-trash-alt',
          action: () => {
            const message = 'Really throw away this container?';
            if (this.confirm(message)) {
              const id = this.selectedContainersId(wc);
              TisoReservationActions.submitDiscardMany(id);
              return this.setState({
                sentIds: this.state.sentIds.concat(id),
                selected: clearSelectedState
              });
            }
          },
          disabled: this.checkActionButtonStatus(wc)
        }
      ];
    };

    return (
      <TabLayout theme="gray">
        <div className="tx-stack tx-stack--xxlg">
          { Object.keys(tisoContainers).map((wc) => {
            tisoContainers[wc] = _.groupBy(tisoContainers[wc], 'tisoNumber');
            initialSelectedState[wc] = {};
            return (
              <Card className="tx-stack" key={wc}>
                <Section title={wc}>
                  {Object.keys(tisoContainers[wc]).map((tiso) => {
                    initialSelectedState[wc][tiso] = {};
                    return (
                      <div className="tx-stack__block--xlg" key={tiso}>
                        {tiso && <h4 className="tx-type--secondary">{`${tiso.slice(0, -1)}-${tiso.slice(-1)}`}</h4>}
                        <List
                          onSelectRow={(record, willBeChecked, selectedRows) => this.onSelectRow(selectedRows, wc, tiso)}
                          onSelectAll={(selectedRows) => this.onSelectAll(selectedRows, wc, tiso)}
                          data={Immutable.fromJS(tisoContainers[wc][tiso])}
                          loaded
                          selected={this.state.selected[wc] ? this.state.selected[wc][tiso] : {}}
                          id={`tisos-container-table ${wc} ${tiso}`}
                          disableCard
                          actions={BulkTisoActions(wc)}
                        >
                          <Column renderCellContent={this.renderIdRecord} header="ID" id="1" disableFormatHeader />
                          <Column renderCellContent={this.renderBarcodeRecord} header="barcode" id="2" />
                          <Column renderCellContent={this.renderContainerRecord} header="container" id="3" />
                          <Column renderCellContent={this.renderRunRecord} header="recent run" id="4" />
                          <Column renderCellContent={this.renderOrganizationRecord} header="organization" id="5" />
                          <Column renderCellContent={this.renderContainerTypeRecord} header="container type" id="6" />
                          <Column renderCellContent={this.renderSlotRecord} header="slot" id="7" />
                          <Column renderCellContent={TisoActions} header="actions"  id="8" />
                        </List>
                      </div>
                    );
                  })}
                </Section>
              </Card>
            );
          })}
        </div>
      </TabLayout>
    );
  }
}

ContainersTable.propTypes = {
  containers: PropTypes.array
};

export default ContainersTable;
