import _     from 'lodash';
import React from 'react';

import getDisplayName from 'main/containers/getDisplayName';
import { safeFail } from 'main/util/ajax';

// An HOC that handles AJAX requests. Error notificiations will display if
// there is an error.
const AjaxHOC = function(Component) {
  return class AjaxedComponent extends React.Component {
    static get displayName() {
      return `Ajaxed${getDisplayName(Component)}`;
    }

    static get propType() {
      return {};
    }

    constructor(props, context) {
      super(props, context);

      this.onAction = this.onAction.bind(this);
      this.onLoad   = this.onLoad.bind(this);
      this.onError  = this.onError.bind(this);

      this.state = this.getInitialState();
    }

    getInitialState() {
      return {
        hasLoaded: false, // Answers: Has this HOC ever loaded?
        loading: false,
        error: undefined,
        data: undefined,
        xhr: undefined
      };
    }

    componentWillUnmount() {
      // cancel the XHR if the abort method is exposed
      if (this.state.xhr && this.state.xhr.abort) {
        this.state.xhr.abort();
      }
    }

    onAction(action, e) {
      const xhr = action(e);

      if (xhr != undefined) {
        safeFail(xhr.then(this.onLoad), this.onError);

        this.setState({
          loading: true,
          xhr
        });
      }

      return xhr;
    }

    onLoad(data) {
      this.setState(
        _.extend(this.getInitialState(), {
          loading: false,
          hasLoaded: true,
          data
        })
      );
    }

    onError(...response) {
      this.setState(
        _.extend(this.getInitialState(), {
          loading: false,
          hasLoaded: true,
          error: response[0]
        })
      );
    }

    render() {
      const props = _.extend({}, this.state, this.props, {
        onAction: this.onAction
      });

      return <Component {...props} />;
    }
  };
};

export default AjaxHOC;
