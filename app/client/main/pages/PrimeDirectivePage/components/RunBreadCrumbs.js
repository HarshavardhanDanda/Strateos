import { Breadcrumbs } from '@transcriptic/amino';
import Immutable       from 'immutable';
import _               from 'lodash';
import PropTypes       from 'prop-types';
import React           from 'react';
import { Link }        from 'react-router-dom';

class RunBreadCrumbs extends React.Component {

  render() {
    const { runTitle, subTab, runStatus, subdomain } = this.props;

    return (
      <Breadcrumbs>
        <Link
          to={`/${subdomain}/runspage/${subTab}`}
        >
          {'Runs'}
        </Link>
        <Link
          to={`/${subdomain}/runspage/${subTab}`}
        >
          {_.startCase(subTab)}
        </Link>
        <Link
          to={`/${subdomain}/runspage/${subTab}/${runStatus}`}
        >
          {_.startCase(runStatus)}
        </Link>
        <Link
          to={'#'}
        >
          {runTitle}
        </Link>
      </Breadcrumbs>
    );
  }
}

RunBreadCrumbs.propTypes = {
  runTitle: PropTypes.string,
  location: PropTypes.instanceOf(Immutable.Map)
};

export default RunBreadCrumbs;
