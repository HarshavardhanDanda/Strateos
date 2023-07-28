import _ from 'lodash';
import React, { useState, useCallback, useEffect } from 'react';
import { TypeAheadInput } from '@transcriptic/amino';

import SynthesisRequestAPI from 'main/api/SynthesisRequestAPI';
import SynthesisProgramAPI from 'main/api/SynthesisProgramAPI';

interface Props {
  onChange: Function,
  synthesisIdSelected: string,
  entityType: string
}

function SynthesisTypeAhead(props: Props) {
  const { synthesisIdSelected, onChange, entityType } = props;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // To clear local state query and suggestions when filter is reset.
  useEffect(() => {
    if (!synthesisIdSelected) {
      query && setQuery('');
      !_.isEmpty(suggestions) && setSuggestions([]);
    }
  }, [synthesisIdSelected]);

  const fetchSuggestions = (value) => {
    const api = entityType === 'synthesis-program' ? SynthesisProgramAPI : SynthesisRequestAPI;
    api.index({
      version: 'v1',
      filters: {
        name: value,
      },
      sortBy: ['name']
    }).then(res => {
      const suggestions = (res && res.data) ?
        res.data.map(synthesis => ({ name: synthesis.attributes.name, id: synthesis.id })) : [];
      setSuggestions(suggestions);
    });
  };

  const debouncedSearch = useCallback(_.debounce(fetchSuggestions, 200), []);

  const onTextInputChange = (e) => {
    if (e.target === undefined) return;
    const { value } = e.target;
    if (_.isEmpty(value)) {
      onClear();
    } else {
      setQuery(value);
      debouncedSearch(value);
    }
  };

  const onClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange({ id: '', name: '' });
  };

  const onSelect = (queryText: string) => {
    setQuery(queryText);
    let synthesis = suggestions.find(suggestion => suggestion.name === queryText);
    synthesis = synthesis || { id: '', name: '' };
    onChange(synthesis);
  };

  return (
    <div>
      <TypeAheadInput
        name="text-input"
        value={query}
        placeholder={entityType === 'synthesis-program' ? 'Search by program name' : 'Search by request name'}
        suggestions={suggestions.map(s => s.name)}
        onChange={onTextInputChange}
        onSuggestedSelect={onSelect}
        onClear={onClear}
      />
    </div>
  );
}

export default SynthesisTypeAhead;
