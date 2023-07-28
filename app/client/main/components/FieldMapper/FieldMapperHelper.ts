import Immutable from 'immutable';
import _ from 'lodash';
import { FieldMapperData, ErrorMap, ScoreItem, ScoreMap, Field } from './types';

const isKeyInUse = (key: string, scoreMap: ScoreMap): [string, ScoreItem] => {
  return Object.entries(scoreMap).find(([_key, { value }]: [string, ScoreItem]) => value === key);
};

const setScore = (key: string, match: string, score: number, scoreMap: ScoreMap) => {
  scoreMap[key] = {
    value: match,
    score: score
  };
};

const resetScore = (key: string, scoreMap: ScoreMap, data: FieldMapperData) => {
  scoreMap[key] = {
    value: null,
    score: null
  };
  assignBestMatchToScoreMap(key, scoreMap, data);
};

const countSharedWords = (string1: string, string2: string): number => {
  const countWords = (key: string) => _.words(key).map(word => word.toLowerCase());
  return _.intersection(countWords(string1), countWords(string2)).length;
};

const calculateOverlappingCharacters = (string1: string, string2: string): number => {
  return (string1.toLowerCase().match(new RegExp('[' + string2.toLowerCase() + ']', 'g')) || []).join('').length;
};

const calculateScore = (key: string, match: string) => {
  const equal = key === match;

  if (equal) {
    // if strings are equal, give the highest score
    return 1000;
  }

  const intersection = countSharedWords(key, match);

  if (!intersection) {
    return 0;
  }

  return calculateOverlappingCharacters(key, match);
};

const setScoreIfHigher = (key: string, match: string, score: number, scoreMap: ScoreMap, data: FieldMapperData) => {
  const isHigher = score > (scoreMap[key] ? scoreMap[key].score : 0);
  const assigned = isKeyInUse(match, scoreMap);

  if (!isHigher) {
    return;
  }

  // handles if key has already been mapped to another field
  if (assigned) {
    const [assignedKey, assignedValue] = assigned;
    if (score > assignedValue.score) {
      resetScore(assignedKey, scoreMap, data);
    } else {
      return;
    }
  }

  setScore(key, match, score, scoreMap);
};

const assignBestMatchToScoreMap = (key: string, scoreMap: ScoreMap, data: FieldMapperData) => {
  const dataKeys = Object.keys(data[0]);
  dataKeys.forEach((dataKey) => {
    if (!key.length || !dataKey.length) {
      return false;
    }
    const score = calculateScore(key, dataKey);
    if (score) {
      setScoreIfHigher(key, dataKey, score, scoreMap, data);
    }
  });
};

const constructInitialFieldMap = (fields: Field[], data: FieldMapperData) => {
  const fieldNames = fields.map(field => field.display);
  const requiredFieldNames = fields.filter(field => field.required).map(item => item.display);
  const orderedFields = _.uniq([...requiredFieldNames.sort(), ...fieldNames.sort()]);
  const scoreMap = constructScoreMapForFieldMatches(fields, data);
  return Immutable.fromJS(orderedFields.map(key => {
    const requiredField = requiredFieldNames.includes(key);
    const bestKeyMatch = scoreMap[key] && scoreMap[key].value;
    return {
      id: key,
      key: key,
      value: bestKeyMatch || null,
      enabled: requiredField || !!bestKeyMatch,
      required: requiredField
    };
  }));
};

/**
 * Constructs a map of how well the keys from the data matches specified fields. Better matches get a higher score.
 * It is an unsophisticated mapping attempt. More complex mapping, for example partial words or anagrams, will not be
 * successfully matched.
 */
const constructScoreMapForFieldMatches = (fields: Field[], data: FieldMapperData) => {
  const scoreMap = {};
  fields.forEach(field => {
    const key = field.display;
    assignBestMatchToScoreMap(key, scoreMap, data);
  });
  return scoreMap;
};

const buildSimplifiedFieldMap = (fieldMap) => {
  const map = {};
  fieldMap.forEach((item) => {
    const key = item.get('key');
    const enabled = item.get('enabled');
    if (enabled) {
      map[key] = item.get('value');
    }
  });
  return map;
};

const buildTransformedData = (fieldMap, data: FieldMapperData) => {
  const dataCopy = _.cloneDeep(data);
  const transformedKeys = _.invert(buildSimplifiedFieldMap(fieldMap));
  dataCopy.forEach((row, idx) => {
    const dataKeys = Object.keys(row);
    dataKeys.forEach((dataKey) => {
      const key = transformedKeys[dataKey];
      if (key) {
        const cache = dataCopy[idx][dataKey];
        delete dataCopy[idx][dataKey];
        dataCopy[idx][key] = cache;
      }
    });
  });
  return dataCopy;
};

const isRequiredFieldError = (field) => {
  return field.get('required') && !field.get('value');
};

const isEmptyFieldError = (field) => {
  return field.get('enabled') && !field.get('value');
};

const buildErrorMap = (fieldMap): ErrorMap => {
  const errorMap = {};
  fieldMap.forEach(field => {
    if (isEmptyFieldError(field)) {
      errorMap[field.get('key')] = 'Must select value for enabled column';
    }
    if (isRequiredFieldError(field)) {
      errorMap[field.get('key')] = 'Required column';
    }
  });
  return _.isEmpty(errorMap) ? null : errorMap;
};

const FieldMapperHelper = {
  constructInitialFieldMap,
  constructScoreMapForFieldMatches,
  buildSimplifiedFieldMap,
  buildTransformedData,
  buildErrorMap
};

export default FieldMapperHelper;
