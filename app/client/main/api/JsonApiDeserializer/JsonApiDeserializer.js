import _ from 'lodash';
import JsonApiDeserializerUtils from './JsonApiDeserializerUtils';

export default function(opts) {
  if (!opts) { opts = {}; }

  this.deserialize = function(jsonapi) {
    function collection() {
      return jsonapi.data.map((d) => {
        return new JsonApiDeserializerUtils(jsonapi, d, opts).perform();
      });
    }

    function resource() {
      return new JsonApiDeserializerUtils(jsonapi, jsonapi.data, opts).perform();
    }

    if (Array.isArray(jsonapi.data)) {
      return collection();
    } else {
      return resource();
    }
  };
}
