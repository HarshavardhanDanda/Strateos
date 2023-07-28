import React      from 'react';
import PropTypes  from 'prop-types';
import _          from 'lodash';
import { Button, LabeledInput } from '@transcriptic/amino';

import SessionStore      from 'main/stores/SessionStore';
import CompoundsTagInput from 'main/pages/CompoundsPage/CompoundsTagInput.jsx';

import './CompoundsBulkLabelsDrawer.scss';

class CompoundBulkLabelsDrawer extends React.Component {

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'bulkAttachLabels',
      'create',
      'remove'
    );

    this.state = {
      tags: []
    };
  }

  bulkAttachLabels() {
    const { selectedRows, compounds, onBulkAddition } = this.props;
    const selectedIds = Object.keys(selectedRows);
    const records = _.cloneDeep(compounds);
    const mapByIds = records.reduce((acc, label, key) => ({ ...acc, [label.id]: key }), {});
    selectedIds.forEach((ind) => {
      const record = records[mapByIds[ind]];
      record.labels = record.labels ? record.labels : [];
      const names = record.labels.reduce((acc, label) => ({ ...acc, [label.name]: true }), {});
      this.state.tags.forEach((tag) => {
        if (!names[tag]) {
          record.labels.push({
            name: tag,
            organization_id: SessionStore.getOrg().get('id')
          });
        }
      });
    });
    if (onBulkAddition) {
      onBulkAddition(records);
    }
  }

  create(tag) {
    this.setState(prevState => ({ tags: [...prevState.tags, tag] }));
  }

  remove(tag) {
    this.setState(prevState => ({ tags: _.pull(prevState.tags, tag) }));
  }

  render() {
    return (
      <div className="labels-drawer__add-labels">
        <LabeledInput label="Labels">
          <CompoundsTagInput
            onCreate={this.create}
            onRemove={this.remove}
            tags={this.state.tags}
            placeholder=""
          />
        </LabeledInput>
        <div className="labels-drawer__drawer-options">
          <Button
            type="success"
            size="medium"
            heavy
            onClick={this.bulkAttachLabels}
          >
            Add Labels
          </Button>
        </div>
      </div>
    );
  }
}

CompoundBulkLabelsDrawer.propTypes = {
  compounds: PropTypes.array.isRequired,
  selectedRows: PropTypes.object.isRequired,
  onBulkAddition: PropTypes.func
};

export default CompoundBulkLabelsDrawer;
