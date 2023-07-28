import Immutable   from 'immutable';
import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

import { Card, DateTime } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import PackageStore from 'main/stores/PackageStore';

import './PackageCard.scss';

class PackageCard extends React.Component {
  render() {
    const { _package } = this.props;
    const release_count = _package.get('release_count');
    const name = PackageStore.nameWithoutDomain(_package.get('name'));

    return (
      <Card
        to={Urls.package(_package.get('id'))}
        className="package-card container-rect grid-element"
      >
        <div className="card__header">
          <p className="card__title">{name}</p>
        </div>
        <div className="card__footer">
          <div className="detail">
            <span className="desc">{`${release_count} ${inflect(
              'release',
              release_count
            )}`}
            </span>
          </div>
          <div className="detail">
            <span className="desc">
              Created <DateTime
                timestamp={_package.get('created_at')}
                format="absolute-format"
              />
            </span>
          </div>
        </div>
      </Card>
    );
  }
}

PackageCard.propTypes = {
  _package: PropTypes.instanceOf(Immutable.Map).isRequired
};

export default PackageCard;
