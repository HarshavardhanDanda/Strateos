import _ from 'lodash';

export default function(jsonapi, data, opts) {

  function isComplexType(obj) {
    return Array.isArray(obj) || _.isPlainObject(obj);
  }

  function getValueForRelationship(relationshipData, included) {
    if (opts && relationshipData && opts[relationshipData.type]) {
      const valueForRelationshipFct = opts[relationshipData.type]
        .valueForRelationship;

      return valueForRelationshipFct(relationshipData, included);
    } else {
      return included;
    }
  }

  function findIncluded(relationshipData, ancestry) {
    if (!jsonapi.included || !relationshipData) { return null; }

    const included = _.find(jsonapi.included, {
      id: relationshipData.id,
      type: relationshipData.type
    });

    if (included) {
      // To prevent circular references, check if the record type
      // has already been processed in this thread
      if (ancestry.indexOf(included.type) > -1) {
        return _.extend(extractAttributes(included));
      }

      const attributes = extractAttributes(included);
      const relationships = extractRelationships(included, ancestry + ':' + included.type + included.id);
      return _.extend(attributes, relationships);
    } else {
      return null;
    }
  }

  function keyForAttribute(attribute) {
    if (_.isPlainObject(attribute)) {
      return _.transform(attribute, (result, value, key) => {
        if (isComplexType(value)) {
          result[keyForAttribute(key)] = keyForAttribute(value);
        } else {
          result[keyForAttribute(key)] = value;
        }
      });
    } else if (Array.isArray(attribute)) {
      return attribute.map((attr) => {
        if (isComplexType(attr)) {
          return keyForAttribute(attr);
        } else {
          return attr;
        }
      });
    } else if (_.isFunction(opts.keyForAttribute)) {
      return opts.keyForAttribute(attribute);
    } else {
      return attribute;
    }
  }

  function extractAttributes(from) {
    const dest = keyForAttribute(from.attributes || {});
    if ('id' in from) { dest[opts.id || 'id'] = from.id; }

    if (opts.typeAsAttribute) {
      if ('type' in from) { dest.type = from.type; }
    }
    if ('meta' in from) { dest.meta = keyForAttribute(from.meta || {}); }

    return dest;
  }

  function extractRelationships(from, ancestry) {
    if (!from.relationships) { return; }
    const dest = {};

    Object.keys(from.relationships).forEach((key) => {
      const relationship = from.relationships[key];

      if (relationship.data === null) {
        dest[keyForAttribute(key)] = null;
      } else if (Array.isArray(relationship.data)) {
        const arrayIncludes = relationship.data.map((relationshipData) => {
          return extractIncludes(relationshipData, ancestry);
        });
        if (arrayIncludes) { dest[keyForAttribute(key)] = arrayIncludes; }

        return arrayIncludes;
      } else {
        const includes = extractIncludes(relationship.data, ancestry);
        if (includes) { dest[keyForAttribute(key)] = includes; }

        return includes;
      }
    });

    return dest;
  }

  function extractIncludes(relationshipData, ancestry) {
    const included = findIncluded(relationshipData, ancestry);
    const valueForRelationship = getValueForRelationship(relationshipData,
      included);

    if (valueForRelationship && valueForRelationship.then) {
      throw new Error('Can not pass a promise in valueForRelationship when using deserialzeSync!');
    }

    return valueForRelationship;
  }

  this.perform = function() {
    const attributes = extractAttributes(data);
    const relationships = extractRelationships(data, data.type + data.id);
    let record = _.extend(attributes, relationships);

    // Links
    if (jsonapi.links) {
      record.links = jsonapi.links;
    }

    // If option is present, transform record
    if (opts && opts.transform) {
      record = opts.transform(record);
    }

    return record;
  };
}
