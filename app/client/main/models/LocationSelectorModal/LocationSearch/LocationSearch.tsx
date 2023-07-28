import React, { useCallback, useEffect, useState } from 'react';
import { TextBody, TypeAheadInput } from '@transcriptic/amino';
import Immutable from 'immutable';
import _ from 'lodash';

import LocationsAPI from 'main/api/LocationsAPI';

import './LocationSearch.scss';

type Location = Immutable.Map<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Results = Immutable.List<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface Props {
  onSelect: (location: Location) => void;
  labId?: string;
}

function LocationSearch(props: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(undefined);
  const [results, setResults] = useState<Results>(Immutable.List());

  const { onSelect, labId } = props;

  const debouncedSearch = useCallback(_.debounce(q => searchQuery(q), 200), []);

  useEffect(() => {
    setLoading(false);
  }, [results]);

  const getLocationPath = (location: Location) => {
    const names = location
      .get('ancestors')
      .map(ancestor => ancestor.get('name'));

    return `(${names.join(' --> ')})`;
  };

  const renderSuggestion = (location: { name: string, path: string }) => (
    <div className="location-search__suggestion">
      <div className="location-search__name">
        <TextBody>{location.name}</TextBody>
      </div>
      <div className="location-search__path">
        <TextBody color="secondary">{location.path}</TextBody>
      </div>
    </div>
  );

  const searchQuery = (query: string) => {
    const jsonFormat = 'short';

    return LocationsAPI.searchLocationsByName(query, jsonFormat, labId)
      .done((locations) => {
        setResults(Immutable.fromJS(locations));
      });
  };

  const onSearch = (event) => {
    const value = event.target.value;
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
      debouncedSearch(value);
    }
  };

  const onSuggestionSelect = (selected: { id: string, value: string }) => {
    const id = selected.id;
    const selectedLocation: Location = results.find((location: Location) => location.get('id') === id);
    if (selectedLocation) {
      setQuery(selectedLocation.get('name'));
      onSelect(selectedLocation);
    }
  };

  let suggestions;
  if (results.size) {
    suggestions = results.map((location: Location) => {
      return location.merge({
        value: location.get('id'),
        name: location.get('name'),
        path: getLocationPath(location),
      });
    }).sortBy(location => location.get('name'));
  }

  return (
    <TypeAheadInput
      placeholder="Search location"
      value={query}
      isSearching={loading}
      suggestions={results.size ? suggestions.toJS() : []}
      renderSuggestion={renderSuggestion}
      onChange={onSearch}
      onSuggestedSelect={onSuggestionSelect}
      disableClearIcon
      matchTargetWidth
    />
  );
}

export default LocationSearch;
