import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import AliquotActions        from 'main/actions/AliquotActions';
import ModalActions          from 'main/actions/ModalActions';
import BulkInputModal        from 'main/components/csv';
import ContainerTypeHelper   from 'main/helpers/ContainerType';
import { Select, Button, ButtonGroup }            from '@transcriptic/amino';
import ContainerStore        from 'main/stores/ContainerStore';
import ContainerAPI from 'main/api/ContainerAPI';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class AdminPanel extends React.Component {
  static get propTypes() {
    return {
      container:     PropTypes.instanceOf(Immutable.Map).isRequired,
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor() {
    super();

    _.bindAll(
      this,
      'onClickMarkAvailable',
      'onClickMarkReturned',
      'onClickResetAliquots',
      'onChangeCover',
      'onChangeStorageCondition'
    );
  }

  onClickMarkReturned() {
    if (!confirm('Mark this container as being returned to customer?')) {
      return;
    }

    ContainerAPI.update(this.props.container.get('id'), {
      status: 'returned'
    });
  }

  onClickMarkAvailable() {
    if (!confirm('Mark this container as being available for use in runs?')) {
      return;
    }

    ContainerAPI.update(this.props.container.get('id'), {
      status: 'available'
    });
  }

  onChangeCover(e) {
    const val = e.target.value;

    if (!confirm(`Really change cover status to ${val}?`)) {
      return;
    }

    /* eslint-disable no-null/no-null */
    // Ajax requests filter out 'undefined' values so we must use 'null' here
    const container = {
      cover: val == 'uncovered' ? null : val
    };
    /* eslint-enable no-null/no-null */

    ContainerAPI.update(this.props.container.get('id'), container);
  }

  onChangeStorageCondition(e) {
    const storage_condition = e.target.value;
    const message =
      `Really change storage conditon to ${storage_condition}?\n\n` +
      'Please note that if there are any existing runs, they will overwrite ' +
      'this value upon completion and you\'ll need to set it again.';
    if (!confirm(message)) {
      return;
    }
    ContainerAPI.update(this.props.container.get('id'), { storage_condition: storage_condition });
  }

  onClickResetAliquots() {
    ModalActions.open(BulkInputModal.MODAL_ID);
  }

  // Destroy existing aliquots for this container and create new ones from csv text box
  importWellConfiguration(wellData) {
    const id = this.props.container.get('id');

    AliquotActions.destroyAliquotsByContainer(id).done(() => {
      const aliquots = wellData.map(([index, name, volume_ul]) => {
        const helper = new ContainerTypeHelper({
          col_count: this.props.containerType.get('col_count')
        });

        const robotIndex = helper.robotWell(index);

        // TODO: investigate why we need to nest in `aliquot` key
        return {
          aliquot: {
            name, volume_ul, well_idx: robotIndex
          }
        };
      });

      AliquotActions.createAliquots(this.props.container.get('id'), aliquots);
    });
  }

  render() {
    const lines = ['A1, my_label, 20', 'A2, other_label, 0'];

    const lids = this.props.containerType
      .get('acceptable_lids')
      .concat(['uncovered'])
      .map(lid => ({ value: lid }));

    return (
      <div className="tx-stack tx-stack--md">
        <div className="form-group tx-stack tx-stack--xxs">
          <h3 className="tx-type--secondary">Container Status</h3>
          <ButtonGroup orientation="horizontal">
            <Button
              type="default"
              disabled={
                  !['available', 'pending_return'].includes(
                    this.props.container.get('status')
                  )}
              onClick={this.onClickMarkReturned}
            >
              Mark as Returned
            </Button>
            <Button
              type="default"
              disabled={this.props.container.get('status') === 'available'}
              onClick={this.onClickMarkAvailable}
            >
              Mark as Available
            </Button>
          </ButtonGroup>
        </div>
        <div className="form-group tx-stack tx-stack--xxs">
          <h3 className="tx-type--secondary">Cover Status</h3>
          <Select
            name="Cover"
            onChange={this.onChangeCover}
            value={this.props.container.get('cover') || 'uncovered'}
            options={lids.toJS()}
            disabled={lids.length === 1}
          />
        </div>
        <div className="form-group tx-stack tx-stack--xxs">
          <h3 className="tx-type--secondary">Storage Condition</h3>
          <Select
            name="Storage Condition"
            onChange={this.onChangeStorageCondition}
            value={this.props.container.get('storage_condition')}
            options={ContainerStore.validStorageConditions}
          />
        </div>
        {AcsControls.isFeatureEnabled(FeatureConstants.DESTROY_CONTAINER_RESET_ALL_ALIQUOTS) && this.props.containerType.get('well_count') > 1 && (
          <div className="reset-aliquots form-group tx-stack tx-stack--xxs">
            <h3 className="tx-type--secondary">Reset Aliquots via CSV</h3>
            <div>
              <BulkInputModal
                onImport={wellData => this.importWellConfiguration(wellData)}
                title={'Input CSV As Well_Index, Well_Label, Volume'}
                placeholder_text={lines.join('\n')}
              />
              <Button
                type="danger"
                size="large"
                onClick={this.onClickResetAliquots}
              >
                Destroy & Reset All Aliquots
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AdminPanel;
