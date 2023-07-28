import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Button, Divider } from '@transcriptic/amino';
import Moment from 'moment';
import DatasetActions from 'main/actions/DatasetActions';
import SessionStore   from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import FeatureStore     from 'main/stores/FeatureStore';
import './ResultsViewContentHeader.scss';

class ResultsViewContentHeader extends React.Component {
  static get propTypes() {
    return {
      name:        PropTypes.string,
      dataset:     PropTypes.instanceOf(Immutable.Map).isRequired,
      instruction: PropTypes.instanceOf(Immutable.Map),
      run:         PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onDestroyDataset = this.onDestroyDataset.bind(this);

    this.state = {};
  }

  // props.name is the refName or the dataset id. Here we might use the analysis title
  nameStr() {
    const { dataset, instruction } = this.props;

    if (instruction) {
      return this.props.name;
    }

    const title = dataset.get('title');

    return title || this.props.name;
  }

  datasetTypeStr() {
    const { instruction } = this.props;

    if (instruction) {
      const op = instruction.getIn(['operation', 'op']);
      return op;
    } else {
      return 'Analysis';
    }
  }

  datasetDetailsStr() {
    const { dataset, instruction } = this.props;

    if (instruction) {
      return instruction.get('id');
    } else {
      return dataset.get('analysis_tool') ? `${dataset.get('analysis_tool')}: version ${dataset.get('analysis_tool_version')}` : '';
    }
  }

  instInfoString() {
    const { dataset, instruction } = this.props;

    const generatedAt = Moment(dataset.get('created_at')).format('h:mm a MMM D, YYYY');

    const warpId = dataset.get('warp_id');
    const warp   = instruction.get('warps').find(w => w.get('id') == warpId);
    const wstart = warp && warp.get('reported_started_at');
    const wcomp  = warp && warp.get('reported_completed_at');
    const istart = instruction.get('started_at');
    const icomp  = instruction.get('completed_at');

    let duration;
    if (wstart && wcomp) {
      duration = new Date(wcomp) - new Date(wstart);
    } else if (istart && icomp) {
      duration = new Date(icomp) - new Date(istart);
    }

    let result = `Generated at ${generatedAt}`;
    if (duration) {
      result = `${result} in ${Math.round(duration / 1000)} seconds`;
    }

    if (warp && warp.get('device_id')) {
      result = `${result} · ${warp.get('device_id')}`;
    }

    return result;
  }

  analysisInfoString() {
    const { dataset } = this.props;

    const generatedAt = Moment(dataset.get('created_at')).format('h:mm a MMM D, YYYY');

    return `Generated at ${generatedAt}`;
  }

  infoString() {
    if (this.props.instruction) {
      return this.instInfoString();
    } else {
      return this.analysisInfoString();
    }
  }

  canDestroyDataset() {
    const { dataset } = this.props;

    if (FeatureStore.hasFeature(FeatureConstants.DELETE_DATASET)) {
      return true;
    }

    const isAnalysis = dataset.get('is_analysis');
    const isOwner    = dataset.get('uploaded_by') == SessionStore.getUser('id');

    // admins and the owner's of the datset can delete Analysis data.
    return isAnalysis && (SessionStore.isAdmin() || isOwner);
  }

  onDestroyDataset() {
    const { dataset, run } = this.props;
    const text = `Are you sure you want to delete dataset ${dataset.get('id')}?`;

    if (confirm(text)) {
      DatasetActions.destroy(dataset.get('id'), run.get('id'));
    }
  }

  render() {
    const { dataset } = this.props;

    return (
      <div className="results-view-content__header">
        <div className="results-view-content__header-headline">
          <div className="results-view-content__header-title">
            <h2 className="results-view-content__header-title-name tx-type--heavy">{this.nameStr()}</h2>
          </div>
          {/**
           * Below choose block is a temporary solution for dataset deletion till:
           * 1. refinement on permission check
           * 2. decision on how to set uploaded_by when a dataset is created by a device
           */}
          <div className="results-view-content__header-actions">

            <Choose>
              <When condition={dataset.get('deleted_at')}>
                <Button
                  icon="fa fa-trash"
                  size="small"
                  disabled
                  type="danger"
                >
                  Destroyed
                </Button>
              </When>
              <Otherwise>
                <If condition={this.canDestroyDataset()}>
                  <Button
                    type="secondary"
                    size="small"
                    icon="fa fa-trash-alt"
                    label="Destroy"
                    onClick={this.onDestroyDataset}
                    link
                  />
                </If>
              </Otherwise>
            </Choose>

          </div>
        </div>

        <p className="tx-type--secondary tx-type--heavy monospace">{dataset.get('id')}</p>

        <div className="results-view-content__header-info">
          <div className="results-view-content__header-type-info">
            <p className="tx-type--heavy">{dataset.get('data_type')}</p>
            <Divider vertical />
            <p className="desc tx-type--heavy monospace">{this.datasetTypeStr()}</p>
            <Divider vertical />
            <p className="desc tx-type--heavy monospace">{this.datasetDetailsStr()}</p>
          </div>

          <div className="results-view-content__header-generated-info">
            <p className="desc">
              {this.infoString()}
            </p>
          </div>
        </div>

        <Divider />
      </div>
    );
  }
}

export default ResultsViewContentHeader;
