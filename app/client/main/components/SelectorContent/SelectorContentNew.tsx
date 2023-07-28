import React, { useEffect, useRef, useState } from 'react';
import Immutable from 'immutable';
import Classnames from 'classnames';
import { Spinner, ZeroState } from '@transcriptic/amino';
import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { TabLayout } from 'main/components/TabLayout';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';
import './SelectorContent.scss';

interface ZeroStateProps {
  title: string;
  subTitle?: string | JSX.Element;
  button?: React.ReactNode;
  children?: React.ReactNode;
  hasBorder?: boolean;
  zeroStateSvg?: string;
}

interface Props {
  hasResults: boolean;
  isSearching: boolean;
  zeroStateProps?: ZeroStateProps;
  extendSidebar?: boolean;
  isDrawer?: boolean;
  renderFilters: Function;
  renderSearchResults: Function;
  searchPlaceholder?: string;
  testMode?: boolean;
  searchOptions?: Array<object>
  hideSearchBar?: boolean;
  className?: string;
  renderZeroState?: Function;
}

export default function SelectorContentNew(props: Props) {
  const prevIsSearchingProp = useRef(props.isSearching);
  const [isShowSpinner, setIsShowSpinner] = useState(true);

  useEffect(() => {
    // Since the initial value of isSearching is false, we need to check against its previous value to determine that the value has
    // changed from true => false which indicates a return from the api call
    // This code is necessary to display the Spinner from the start and prevent the Zero State component from flashing before the Spinner
    if (!props.isSearching && prevIsSearchingProp.current) {
      setIsShowSpinner(false);
    }
    prevIsSearchingProp.current = props.isSearching;
  }, [props.isSearching]);

  const isEmpty = !props.hasResults && !props.isSearching;

  const renderSearchResultsSideBar = () => {
    return (
      <TabLayoutSidebar key="tab-layout-sidebar-left">
        <SearchResultsSidebar
          key="search-results-sidebar"
          searchOptions={Immutable.fromJS(props.searchOptions)}
          placeholder={props.searchPlaceholder}
          filters={props.renderFilters()}
          showSearch={!props.hideSearchBar}
        />
      </TabLayoutSidebar>
    );
  };

  const renderZeroState = () => {
    if (props.testMode) {
      return <ZeroState title="No containers were found..." />;
    } else if (props.zeroStateProps) {
      return <ZeroState {...props.zeroStateProps} />;
    } else if (props.renderZeroState) {
      return props.renderZeroState();
    }
  };

  return (
    <TabLayout
      className={Classnames('selector-content', props.className)}
      wideSidebar={props.extendSidebar}
      contextType={props.isDrawer ? 'drawer' : 'modal'}
    >
      {isShowSpinner ? (
        <Spinner />
      ) : [
        renderSearchResultsSideBar(),
        <div
          className={Classnames('selector-content__content', {
            'selector-content__content--is-drawer': props.isDrawer,
            'selector-content__content--data': !isEmpty,
            'selector-content__content--empty': isEmpty && !props.zeroStateProps,
          })}
          key="selector-content-body"
        >
          {isEmpty ? (
            renderZeroState()
          ) : (
            props.renderSearchResults()
          )}
        </div>
      ]}
    </TabLayout>
  );

}

SelectorContentNew.defaultProps = { extendSidebar: false, isDrawer: false };
SelectorContentNew.displayName = 'SelectorContent';
