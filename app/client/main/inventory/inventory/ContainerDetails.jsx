import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';
import { Link }       from 'react-router-dom';

import Urls           from 'main/util/urls';

import ContainerType from 'main/components/ContainerType';
import UserStore      from 'main/stores/UserStore';
import UserProfile from 'main/components/UserProfile/UserProfile';
import { KeyValueList } from '@transcriptic/amino';

function ContainerDetails(props) {
  function getContainerID(container, resource, runRef, link) {
    if (container) {
      if (link) {
        return (
          <Link to={Urls.container(container.get('id'))}>{container.get('id')}</Link>
        );
      }
      return container.get('id');
    } else if (resource) {
      if (link) {
        return <em>(new {resource.get('name')})</em>;
      }
      return (
        <em>
          <span>(new</span>
          <a href={Urls.resource(resource.get('id'))}>{resource.get('name')}</a>
          <span>)</span>
        </em>
      );
    } else if (runRef.get('container_id')) {
      return <span>{runRef.get('container_id')}</span>;
    }
    return (<em>(new)</em>);
  }

  function getBarcode(container) {
    if (container) {
      const barcode = container.get('barcode');
      return barcode || 'None';
    } else {
      return 'None';
    }
  }

  function getCreatedBy(container) {
    if (container) {
      const user = UserStore.getById(container.get('created_by'));
      return (user ?  <UserProfile user={user} showDetails /> : '-');
    } else {
      return 'None';
    }
  }

  function getDestination(runRef) {
    if (runRef.getIn(['destiny', 'discard'])) {
      return 'discard';
    }
    return `${runRef.getIn(['destiny', 'store', 'where'])} ${runRef.getIn(['destiny', 'store', 'shaking']) ?
      '(shaking)' : ''}`;
  }

  return (

    <KeyValueList
      entries={[
        {
          key: 'Ref Name',
          value: props.runRef.get('name')
        },
        {
          key: 'Container Name',
          value: props.container ? props.container.get('label') : 'None'
        },
        {
          key: 'Container',
          value: getContainerID(props.container, props.resource, props.runRef, true),
          valueOverflow: getContainerID(props.container, props.resource, props.runRef, false)
        },
        {
          key: 'Barcode',
          value: getBarcode(props.container)
        },
        {
          key: 'Type',
          value: <ContainerType containerTypeId={props.containerType && props.containerType.get('id')} />,
          valueOverflow: props.containerType ? props.containerType.get('id') : 'Unknown'
        },
        {
          key: 'Vendor',
          value: props.containerType ? props.containerType.get('vendor') : 'Unknown'
        },
        {
          key: 'Catalog No.',
          value: props.containerType ? props.containerType.get('catalog_number') : 'Unknown'
        },
        {
          key: 'Destination',
          value: getDestination(props.runRef)
        },
        {
          key: 'Created By',
          value: getCreatedBy(props.container)
        }
      ]}
    />
  );
}

ContainerDetails.propTypes = {
  container: PropTypes.instanceOf(Immutable.Map),
  resource: PropTypes.instanceOf(Immutable.Map),
  runRef: PropTypes.instanceOf(Immutable.Map).isRequired,
  containerType: PropTypes.instanceOf(Immutable.Map),
  runView: PropTypes.string
};

export default ContainerDetails;
