import { Highlighted } from '@transcriptic/amino';
import classNames      from 'classnames';
import PropTypes       from 'prop-types';
import React           from 'react';

class PropertySearchResults extends React.Component {

  static get propTypes() {
    return {
      results:    PropTypes.array,
      query:      PropTypes.string,
      selected:   PropTypes.number,
      onSelected: PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      results: [],
      query: ''
    };
  }

  render() {
    return (
      <div className="results">
        {this.props.results.map((value, index) => {
          return (
            <div
              key={index}
              className={classNames('result', { selected: this.props.selected === index })}
              onClick={() => this.props.onSelected(value)}
            >
              <strong>
                <Highlighted
                  text={value.name}
                  highlight={this.props.query}
                />
              </strong>
            </div>
          );
        })}
      </div>
    );
  }
}

export default PropertySearchResults;
