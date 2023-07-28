import classnames from 'classnames';
import Immutable  from 'immutable';
import $          from 'jquery';
import keycode    from 'keycode';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Loading } from 'main/components/page';

import './Search.scss';

class SimpleSearchInput extends React.Component {

  static get propTypes() {
    return {
      delay:          PropTypes.number,
      minLength:      PropTypes.number,
      results:        PropTypes.instanceOf(Immutable.Iterable),
      queryChanged:   PropTypes.func.isRequired,
      resultSelected: PropTypes.func.isRequired,
      resultToStr:    PropTypes.func.isRequired
    };
  }

  static get defaultProps() {
    return {
      queryChanged() {},
      delay: 250
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onFocus         = this.onFocus.bind(this);
    this.onChange        = this.onChange.bind(this);
    this.onClick         = this.onClick.bind(this);
    this.onKeyDown       = this.onKeyDown.bind(this);
    this.onResultClicked = this.onResultClicked.bind(this);
    this.onSelectResult  = this.onSelectResult.bind(this);

    this.state = {
      focused: false,
      disabled: false,
      selectedResult: undefined, // Holds the selected search result
      query: ''
    };
  }

  componentDidMount() {
    this.debouncedQueryChanged = _.debounce(this.props.queryChanged, this.props.delay);
  }

  onClick(_e) {
    if (this.state.disabled) {
      this.setState({ disabled: false });
      this.onFocus();
    }
  }

  onChange(e) {
    const oldValue  = this.state.query;
    const { value } = e.target;

    this.setState({ query: value, selectedResult: undefined });

    const minLength = this.props.minLength != undefined ? this.props.minLength : 1;

    if (value.length >= minLength) {
      this.debouncedQueryChanged(value, oldValue);
    }
  }

  onKeyDown(e) {
    switch (keycode(e)) {
      case 'enter':
        this.onSelectResult();
        break;
      case 'down':
        this.changeSelectedIndex(1);
        break;
      case 'up':
        this.changeSelectedIndex(-1);
        break;
      default:
        break;
    }
  }

  onResultClicked(result) {
    this.setState({ selectedResult: result }, this.onSelectResult);
  }

  onBlur() {
    this.setState({ focused: false }, () => {
      $(this.searchInput).blur();
    });
  }

  onFocus() {
    this.setState({ focused: true }, () => {
      $(this.searchInput).focus();
    });
  }

  onSelectResult() {
    const size = (this.props.results != undefined) ? this.props.results.size : 0;

    if (size > 0 && this.state.selectedResult != undefined) {
      this.setState({ disabled: true });
      this.props.resultSelected(this.state.selectedResult);
      this.onBlur();
    } else {
      this.props.resultSelected(this.state.selectedResult);
    }
  }

  indexOfSelectedResult() {
    if (this.state.selectedResult == undefined) {
      return -1;
    }

    return this.props.results.indexOf(this.state.selectedResult);
  }

  changeSelectedIndex(amt) {
    const size = (this.props.results != undefined) ? this.props.results.size : 0;
    let index  = this.indexOfSelectedResult();

    if (size > 0) {
      index += amt;

      if (index < 0) {
        index = 0;
      }

      if (index > size - 1) {
        index = size - 1;
      }

      this.setState({ selectedResult: this.props.results.get(index) });
    }
  }

  inputValue() {
    if (this.state.disabled && this.state.selectedResult != undefined) {
      return this.props.resultToStr(this.state.selectedResult);
    } else {
      return this.state.query;
    }
  }

  isLoading() {
    return !(_.isEmpty(this.state.query) || this.props.results != undefined);
  }

  noResults() {
    const size = (this.props.results != undefined) ? this.props.results.size : 0;

    return !_.isEmpty(this.state.query) && size === 0;
  }

  render() {
    return (
      <div className="simple-search">
        <SearchBar
          ref={(node) => { this.searchInput = node; }}
          style={{ cursor: this.state.disabled ? 'pointer' : 'auto' }}
          value={this.inputValue()}
          disabled={this.state.disabled}
          onClick={this.onClick}
          onChange={this.onChange}
          onFocus={this.onFocus}
          onKeyDown={this.onKeyDown}
        />
        <If condition={!_.isEmpty(this.state.query) && this.state.focused}>
          <div className="simple-search-results-with-triangle">
            <div className="triangle-up" />
            <div className="simple-search-results-container">
              <Choose>
                <When condition={this.isLoading()}><Loading /></When>
                <When condition={this.noResults()}>
                  <div className="search-results loading">No Results</div>
                </When>
                <Otherwise>
                  <SimpleSearchResults
                    results={this.props.results}
                    selectedResult={this.state.selectedResult}
                    resultToStr={this.props.resultToStr}
                    onClick={this.onResultClicked}
                  />
                </Otherwise>
              </Choose>
            </div>
          </div>
        </If>
      </div>
    );
  }
}

class SimpleSearchResults extends React.Component {

  static get propTypes() {
    return {
      selectedResult: PropTypes.instanceOf(Immutable.Map),
      results:        PropTypes.instanceOf(Immutable.Iterable),
      resultToStr:    PropTypes.func.isRequired,
      onClick:        PropTypes.func.isRequired
    };
  }

  isActive(result) {
    return this.props.selectedResult === result;
  }

  createOnClick(result) {
    return _e => this.props.onClick(result);
  }

  render() {
    return (
      <div className="simple-search-results">
        {this.props.results.map((r, i) => {
          const value = this.props.resultToStr(r);

          return (
            <div
              key={i} // eslint-disable-line react/no-array-index-key
              className={classnames('simple-search-result', { active: this.isActive(r) })}
              onClick={this.createOnClick(r)}
            >
              {value}
            </div>
          );
        })}
      </div>
    );
  }
}

// A text input with a search icon.
class SearchBar extends React.Component {

  static get propTypes() {
    return {
      style:    PropTypes.shape({
        inline: PropTypes.bool, // Render in-line with padding
        bare:   PropTypes.bool // Render standalone component
      })
    };
  }

  static get defaultProps() {
    return {
      style: { inline: true, bare: false }
    };
  }

  render() {
    const { inline, bare } = this.props.style;
    const props            = _.extend({ placeholder: 'Search' }, this.props);

    return (
      <div className={classnames('search-bar', { inline, bare })}>
        <i className="fa fa-sm fa-search" />
        <input {...props} />
      </div>
    );
  }
}

export { SimpleSearchInput, SearchBar };
