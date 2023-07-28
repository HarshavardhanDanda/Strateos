import React from 'react';

interface CustomProps {
  onSearchFailed?: Function;
  onSearchPageChange?: Function;
  onSearchFilterChange?: Function;
  onSearchInputChange?: Function;
  onSearchSimilarityChange?: Function;
  onSortChange?: Function;
  page?: Function;
  numPages?: Function;
  pageSize?: Function;
}

export default function withSelectorContent(WrappedComponent, getCustomPropsForComponent?:(props) => CustomProps) {
  function SelectorContentHOC(props) {
    const customPropsForComponent = getCustomPropsForComponent && getCustomPropsForComponent(props);

    const onSearchFailed = () => {
      // TODO: Figure out how to handle this, since it did not look like the original implementation in PageWithSearchAndList was doing anything with the state
      // this.setState({ statusCode: xhr.status });
    };

    const onSortChange = (sortKey: string, sortDirection: 'asc' | 'desc', onSearchSucceeded = () => {}) => {
      const isDescending = sortDirection === 'desc';
      props.actions.onSortOptionChange(onSearchFailed, sortKey, isDescending, onSearchSucceeded);
    };

    // Selecting specific page in paginated results
    const onSearchPageChange = (searchPage, onSearchSucceeded = () => {}) => {
      props.actions.onSearchPageChange(onSearchFailed, searchPage, onSearchSucceeded);
    };

    // Selecting one of the search option dropdowns
    const onSearchFilterChange = (options, onSearchSucceeded = () => {}) => {
      props.actions.onSearchFilterChange(onSearchFailed, options, onSearchSucceeded);
    };

    // Searching the text input by query
    const onSearchInputChange = (query, onSearchSucceeded = () => {}) => {
      props.actions.onSearchInputChange(onSearchFailed, query, onSearchSucceeded);
    };

    const onSearchSimilarityChange = (query, onSearchSucceeded = () => {}) => {
      props.actions.onSearchSimilarityChange(onSearchFailed, query, onSearchSucceeded);
    };

    const onVisibleColumnChange = (visibleColumns) => {
      if (props.actions.onVisibleColumnChange) {
        props.actions.onVisibleColumnChange(visibleColumns);
      }
    };

    const getPage = () => {
      return props.search.get('page', 1);
    };

    const getNumPages = () => {
      return props.search.get('num_pages', 1);
    };

    const getPageSize = () => {
      return props.search.get('per_page', 1);
    };

    return (
      <WrappedComponent
        {...props}
        onSortChange={onSortChange}
        onSearchPageChange={onSearchPageChange}
        onSearchFilterChange={onSearchFilterChange}
        onSearchInputChange={onSearchInputChange}
        onSearchSimilarityChange={onSearchSimilarityChange}
        onVisibleColumnChange={onVisibleColumnChange}
        onSearchFailed={onSearchFailed}
        page={getPage}
        numPages={getNumPages}
        pageSize={getPageSize}
        {...customPropsForComponent}
      />
    );
  }

  return SelectorContentHOC;
}
