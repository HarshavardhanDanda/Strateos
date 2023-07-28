import React from 'react';

interface CustomProps {
  onSearchFailed?: Function;
  onSearchPageChange?: Function;
  onSortChange?: Function;
  onSearchFilterChange?: Function;
  onSearchInputChange?: Function;
  page?: Function;
  numPages?: Function;
  pageSize?: Function;
}

export default function withPageWithSearchAndList(WrappedComponent, getCustomPropsForComponent?: (props) => CustomProps) {
  function PageWithSearchAndListHOC(props) {
    const customPropsForComponent = getCustomPropsForComponent && getCustomPropsForComponent(props);

    const onSearchFailed = () => {
      // TODO: Figure out how to handle this, since it did not look like the original implementation in PageWithSearchAndList was doing anything with the state
      // this.setState({ statusCode: xhr.status });
    };

    const onSearchPageChange = (searchPage, onSearchSucceeded = () => {}) => {
      props.actions.onSearchPageChange(onSearchFailed, searchPage, onSearchSucceeded);
    };

    const onSortChange = (sortKey: string, sortDirection: 'asc' | 'desc', onSearchSucceeded = () => {}) => {
      const isDescending = sortDirection === 'desc';
      props.actions.onSortOptionChange(onSearchFailed, sortKey, isDescending, onSearchSucceeded);
    };

    // Selecting one of the search option dropdowns
    const onSearchFilterChange = (options, onSearchSucceeded = () => {}) => {
      props.actions.onSearchFilterChange(onSearchFailed, options, onSearchSucceeded);
    };

    const onSearchInputChange = (query, onSearchSucceeded = () => {}) => {
      props.actions.onSearchInputChange(onSearchFailed, query, onSearchSucceeded);
    };

    const onViewDetailsClicked = (result) => {
      if (props?.actions?.updateState) {
        props.actions.updateState({ currentContainer: result });
      }

      props.history.push(
        props.resultUrl(result.get('id'))
      );
    };

    const page = () => {
      return props.search.get('page', 1);
    };

    const numPages = () => {
      return props.search.get('num_pages', 1);
    };

    const pageSize = () => {
      return props.search.get('per_page', 1);
    };

    return (
      <WrappedComponent
        {...props}
        onSearchFailed={onSearchFailed}
        onSearchPageChange={onSearchPageChange}
        onSortChange={onSortChange}
        onSearchFilterChange={onSearchFilterChange}
        onSearchInputChange={onSearchInputChange}
        onViewDetailsClicked={onViewDetailsClicked}
        page={page}
        numPages={numPages}
        pageSize={pageSize}
        {...customPropsForComponent}
        // DO NOT ADD PROPS HERE. Add them above {...customPropsForComponent}, since custom prop functions need to override the HOC functions
      />
    );
  }

  return PageWithSearchAndListHOC;
}
