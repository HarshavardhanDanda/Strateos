import Immutable from 'immutable';
import React     from 'react';
import Urls      from 'main/util/urls';

import { HierarchyPath } from '@transcriptic/amino';

type Props = {
  location: Immutable.Map<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  position?: number;
  containerId?: string;
}

// Creates a location path in the form of "ancestor1 -> ancestor2 -> name"
function LocationPath(props: Props) {
  const ancestors = props.location.get('ancestors', Immutable.List());

  const ancestorNameIds = ancestors.map(a => [
    a.get('name', '-'),
    a.get('id')
  ]);

  const nameIds = ancestorNameIds.push([
    props.location.get('name', '-'),
    props.location.get('id')
  ]);

  const locationPathSteps = nameIds.map((nameId, index) => {
    const [locationName, locationId] = Array.from(nameId);
    const isLast = index === nameIds.size - 1;

    return {
      name: isLast && props.position != undefined
        ? `${locationName} (${props.position})`
        : locationName,
      link: isLast && props.containerId != undefined
        ? Urls.container(props.containerId)
        : Urls.location(locationId),
      id: locationId
    };
  }).toJS();

  return <HierarchyPath steps={locationPathSteps} />;
}

export default LocationPath;
