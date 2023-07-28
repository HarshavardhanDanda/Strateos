import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import {
  Card,
  KeyValueList,
  Molecule,
  MolecularFormula,
  Popover,
  Tag,
  DateTime,
  StatusPill
} from '@transcriptic/amino';

import UserProfile from 'main/components/UserProfile';
import HazardPopoverTags from 'main/components/Hazards/HazardPopoverTags';
import { getHazardsFromCompound } from 'main/util/Hazards';
import  LibraryPopoverTags from 'main/components/Compounds/LibraryPopoverTags';

import './Compounds.scss';

function CompoundName({ name, reference_id, id }) {
  return name || reference_id || id;
}

CompoundName.propTypes = {
  name: PropTypes.string,
  reference_id: PropTypes.string,
  id: PropTypes.string
};

class CompoundHeading extends React.Component {
  renderFlags() {
    const { compound } = this.props;

    return <HazardPopoverTags hazards={getHazardsFromCompound(compound)} zeroStateText="None" />;
  }

  renderLabels() {
    const { compound } = this.props;
    const labels = compound.get('labels', Immutable.List([])).toJS();
    const content = labels.map(tag => (
      <Tag
        key={tag.name}
        text={tag.name}
        icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
        iconType={(tag.organization_id ? 'far' : 'fa')}
      />
    ));
    if (labels.length > 1) {
      return (
        <Popover
          content={content}
          placement="bottom"
          trigger="hover"
          onModal={!!this.props.onModal}
        >
          <p className="tx-type--secondary">
            {labels.length}
            <i className="fas fa-tags compound-results__labels" />
          </p>
        </Popover>
      );
    } else if (labels.length === 1) {
      return (
        <Popover
          content={content}
          placement="bottom"
          trigger="hover"
          onModal={!!this.props.onModal}
          showWhenOverflow
        >
          {content}
        </Popover>
      );
    } else {
      return <p className="tx-type--secondary">No labels applied</p>;
    }
  }

  renderLibraries() {
    const { libraries, onModal } = this.props;
    return <LibraryPopoverTags libraries={libraries || []} onModal={onModal} />;
  }

  render() {
    const { compound, createdByUser, canViewLibraries } = this.props;
    const externalIDs = compound.get('external_system_ids');
    const externalIDsJS = externalIDs && externalIDs.toJS();
    const firstObj = externalIDsJS && externalIDsJS[0];
    const firstExternalID = firstObj && firstObj.external_system_id;
    return (
      <div className="compound-heading">
        <div>
          <h3 className="tx-type--heavy"><CompoundName {...compound.toJS()} /></h3>
          <p className="tx-type--secondary">
            <KeyValueList
              isHorizontalLayout
              entries={[
                { key: 'REF. ID', value: compound.get('reference_id') },
                { key: 'ID', value: compound.get('id') },
                { key: 'HAZARD', value: this.renderFlags() },
                { key: 'EXTERNAL SYSTEM ID', value: firstExternalID || '-' },
                { key: 'Library', value: this.renderLibraries() }
              ].filter((kv) => (kv.key === 'Library' ? canViewLibraries : true))}
            />
          </p>
        </div>

        <div className="compound-heading__right">
          <div className="desc">
            <If condition={!!createdByUser}>
              <UserProfile user={createdByUser} label="" showDetails />
              <span>
                {' registered this on '}
                <DateTime timestamp={compound.get('created_at')} format="absolute-format" />
              </span>
            </If>
          </div>
          <div>
            {this.renderLabels()}
          </div>
        </div>
      </div>
    );
  }
}

CompoundHeading.propTypes = {
  compound: PropTypes.instanceOf(Immutable.Map).isRequired,
  createdByUser: PropTypes.instanceOf(Immutable.Map),
  canViewLibraries: PropTypes.bool,
  libraries: PropTypes.arrayOf(PropTypes.object),
  onModal: PropTypes.bool
};

CompoundHeading.defaultProps = {
  onLabelClick: () => {},
  onModal: false
};

class CompoundDetail extends React.Component {
  render() {

    const compound = this.props.compound;

    const customPropertiesList = Object.entries(compound.get('properties').toJS())
      .map(([key, value]) => ({ key, value }));
    const propList = [
      { key: 'Formula', value: (<p><MolecularFormula formula={compound.get('formula')} /></p>) },
      { key: 'MW', value: compound.get('molecular_weight') },
      { key: 'C-LOGP', value: compound.get('clogp') },
      { key: 'TPSA', value: compound.get('tpsa') },
      { key: 'EXACT MASS', value: compound.get('exact_molecular_weight') }
    ].concat(customPropertiesList);

    const search_score = compound.get('search_score');
    const labels = compound.get('labels').toJS().map(label => label.name);

    return (
      <Card>
        <If condition={this.props.showMolecule && !!compound.get('smiles')}>
          <div className="compound-detail__segment">
            <Molecule SMILES={compound.get('smiles')} width={160} height={100} />
          </div>
        </If>

        <div className="compound-detail__segment">
          <div>
            <h3 className="tx-type--heavy"><CompoundName {...compound.toJS()} /></h3>
            <If condition={_.isNumber(search_score)}>
              <div>
                <span className="search-score">
                  &nbsp;
                  <StatusPill
                    type="action"
                    text={search_score.toFixed(2)}
                    shape="tag"
                  />
                </span>
              </div>
            </If>
          </div>
          <p className="tx-type--secondary monospace">
            {compound.get('id')}
            {compound.get('reference_id') ? ` \u2022 ${compound.get('reference_id')}` : ''}
          </p>
          <KeyValueList isHorizontalLayout entries={propList} />
        </div>

        <div className="compound-detail__segment--right">
          <div>
            <Choose>
              <When condition={compound.get('organization_id')}>
                <StatusPill
                  type="danger"
                  text="Private"
                  shape="tag"
                />
              </When>
              <Otherwise>
                <StatusPill
                  type="success"
                  text="Public"
                  shape="tag"
                />
              </Otherwise>
            </Choose>
          </div>
          {labels.map((group, index) => (
            <StatusPill
              key={`${group}-${index}`}
              text={group}
              shape="tag"
            />
          ))}
        </div>
      </Card>
    );

  }
}

CompoundDetail.propTypes = {
  showMolecule: PropTypes.bool,
  compound: PropTypes.any.isRequired
};

CompoundDetail.defaultProps = {
  showMolecule: true,
  searchScore: ''
};

export { CompoundDetail, CompoundHeading, CompoundName };
