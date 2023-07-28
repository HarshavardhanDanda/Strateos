import { expect } from 'chai';
import { fromXHR, fromRailsResource, fromJsonApi } from './Errors';

/* eslint-disable quote-props */
/* eslint-disable quotes */

const RAILS_SINGLE_ERROR =
  {
    "name": [
      "can't be blank"
    ]
  };

const RAILS_ONE_FIELD_MULTIPLE_ERRORS =
  {
    "subdomain": [
      "can't be blank",
      "is too short (minimum is 4 characters)",
      "is invalid"
    ]
  };

const RAILS_TWO_FIELDS_MULTIPLE_ERRORS =
  {
    "name": [
      "can't be blank"
    ],
    "subdomain": [
      "can't be blank",
      "is too short (minimum is 4 characters)",
      "is invalid"
    ]
  };

const JSON_API_SINGLE =
  {
    "errors": [
      {
        "title": "Invalid field value",
        "detail": " is not a valid value for subdomain.",
        "code": "103",
        "status": "400"
      }
    ]
  };

const xhr = response => ({ responseJSON: response });
const xhrWithoutJSON = response => ({ ...response });

describe("ajax/Errors", () => {
  describe("#fromXHR", () => {
    it('should handle rails errors', () => {
      expect(fromXHR(xhr(RAILS_SINGLE_ERROR)).length).to.equal(1);
    });

    it('should handle custom errors', () => {
      const err = fromXHR(xhr({ error: 'Foo bar' }));
      expect(err.length).to.equal(1);
      const errors = fromXHR(xhr({ errors: ['Foo', 'Bar'] }));
      expect(errors.length).to.equal(2);
      const errorMessage = fromXHR(xhr({ error_message: 'some service error message' }));
      expect(errorMessage.length).to.equal(1);
      const message = fromXHR(xhr({ message: 'some message' }));
      expect(message.length).to.equal(1);
      const error = fromXHR(xhr({ error_message: 'some service error message', error: 'Foo bar' }));
      expect(error.length).to.equal(1);
      expect(error[0]).to.equal('some service error message');
    });

    it('should extract error message with best effort when response JSON is unavailable', () => {
      let err = fromXHR(xhrWithoutJSON({ status: 503 }), 'error', 'Service Unavailable');
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('Service Unavailable');

      err = fromXHR(xhrWithoutJSON({ status: 504 }), 'error', 'Gateway Timeout');
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('Gateway Timeout');

      err = fromXHR(xhrWithoutJSON({ status: 503 }), 'error');
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('error');

      err = fromXHR(xhrWithoutJSON({ status: 503 }));
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('Error: 503');

      err = fromXHR(xhrWithoutJSON({ status: 504 }));
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('Error: 504');

      err = fromXHR(xhrWithoutJSON({}));
      expect(err.length).to.equal(1);
      expect(err[0]).to.equal('Connection error');
    });

  });

  describe("#fromRailsResource", () => {
    it("should generate single error and one field", () => {
      const errors = fromRailsResource(xhr(RAILS_SINGLE_ERROR));
      expect(errors.length).to.equal(1);
    });

    it("should generate multiple errors single field", () => {
      const errors = fromRailsResource(xhr(RAILS_ONE_FIELD_MULTIPLE_ERRORS));
      expect(errors.length).to.equal(3);
    });

    it("should generate multiple errors with multiple fields", () => {
      const errors = fromRailsResource(xhr(RAILS_TWO_FIELDS_MULTIPLE_ERRORS));
      expect(errors.length).to.equal(4);
    });
  });

  describe("#fromJsonApi", () => {
    const errors = fromJsonApi(xhr(JSON_API_SINGLE));
    expect(errors.length).to.equal(1);
  });
});
