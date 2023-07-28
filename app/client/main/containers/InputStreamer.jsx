import _ from 'lodash';
import React from 'react';

/*
 * A higher order component which streams a array prop into the
 * child component. This is useful when you want to render a large list
 * of items, but don't want to wait until all of them are rendered before
 * showing something to the user
 */
const InputStreamer = function(Component, propName, opts) {
  let options = opts;
  if (options == undefined) {
    options = {};
  }

  return class AnonymouseInputStreamer extends React.Component {

    constructor(props, context) {
      super(props, context);

      this.streamItems = this.streamItems.bind(this);

      this.state = {
        items: [],
        streamingTimeoutId: undefined
      };
    }

    componentDidMount() {
      this.streamItems();
    }

    componentWillUnmount() {
      clearTimeout(this.state.streamingTimeoutId);
    }

    streamItems() {
      const sourceList  = this.props[propName];
      const currentSize = this.state.items.length;
      const chunkSize   = options.chunkSize != undefined ? options.chunkSize : 1;

      // Add 1 because slice's second index is exclusive
      const newItems = this.state.items.concat(
        sourceList.slice(currentSize, currentSize + chunkSize + 1)
      );

      return this.setState(
        {
          items: newItems
        },
        () => {
          if (this.state.items.length < sourceList.length) {
            const timeoutId = setTimeout(() => this.streamItems(), 0);

            this.setState({
              streamingTimeoutId: timeoutId
            });
          }
        }
      );
    }

    render() {
      // merge state.items and props
      const props = _.extend({}, this.props, {
        [propName]: this.state.items
      });

      return <Component {...props} />;
    }
  };
};

export default InputStreamer;
