import { Highlighted } from '@transcriptic/amino';
import classNames      from 'classnames';
import PropTypes       from 'prop-types';
import React           from 'react';

class ContainerSearchResults extends React.Component {

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
        {this.props.results.map((container, index) => {
          return (
            <div
              key={container.id}
              className={classNames('result', { selected: this.props.selected === index })}
              onClick={() => this.props.onSelected(container)}
            >
              <strong>
                <Highlighted
                  text={`${container.id} | ${container.label} | ${container.barcode || container.suggested_user_barcode}`}
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

export default ContainerSearchResults;
