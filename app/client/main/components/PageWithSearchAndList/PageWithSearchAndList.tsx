import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs, Page, Spinner, ZeroState } from '@transcriptic/amino';

import { SearchResultsSidebar } from 'main/components/PageWithSearchAndList';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';

interface ZeroStateProps {
  title: string;
  subTitle?: string | JSX.Element;
  button?: React.ReactNode;
  children?: React.ReactNode;
  hasBorder?: boolean;
  zeroStateSvg?: string;
}

interface Props {
  hasResults: boolean,
  isSearching: boolean,
  zeroStateProps?: ZeroStateProps
  listUrl?: string,
  title?: string,
  statusCode?: number,
  hasPageLayout?: boolean,
  hasPageHeader?: boolean,
  extendSidebar?: boolean,
  renderFilters: Function,
  renderSearchResults: Function,
  modals?: Array<React.ReactElement>,
  beta?: boolean,
  renderPrimaryInfo?: Function,
  /*
   If true then it won't show spinner
   */
  disableSpinner?: boolean;
  theme?: 'white' | 'gray';
  className?: string;
}

export default function PageWithSearchAndList(props: Props) {
  const prevIsSearchingProp = useRef(props.isSearching);
  const [isShowSpinner, setIsShowSpinner] = useState(!props.disableSpinner);

  useEffect(() => {
    // Since the initial value of isSearching is false, we need to check against its previous value to determine that the value has
    // changed from true => false which indicates a return from the api call
    // This code is necessary to display the Spinner from the start and prevent the Zero State component from flashing before the Spinner
    if (!props.isSearching && prevIsSearchingProp.current) {
      setIsShowSpinner(false);
    }
    prevIsSearchingProp.current = props.isSearching;
  }, [props.isSearching]);

  const modals = () => {
    return props.modals || [];
  };

  const renderBeta = () => {
    return <h3 className="tx-type--secondary tx-type--heavy" style={{ display: 'inline-block' }}>(beta)</h3>;
  };

  const renderTitle = () => {
    return (
      <span>
        {props.title}
        {props.beta && renderBeta()}
      </span>
    );
  };

  const documentTitle = () => {
    return props.title + (props.beta ? ' (BETA)' : '');
  };

  const renderTabLayoutContent = () => {
    return (
      <TabLayout className={props.className} wideSidebar={props.extendSidebar} theme={props.theme}>
        {isShowSpinner &&
          <Spinner />
        }
        {!isShowSpinner && !props.hasResults && !props.isSearching && (
          <ZeroState
            button={props.renderPrimaryInfo && props.renderPrimaryInfo()}
            hasBorder
            {...props.zeroStateProps}
          />
        )}
        {!isShowSpinner && props.hasResults && (
          <TabLayoutSidebar>
            <SearchResultsSidebar
              filters={props.renderFilters()}
            />
          </TabLayoutSidebar>
        )}
        {!isShowSpinner && props.hasResults && (
          <div className="samples search-header">
            {props.renderSearchResults()}
          </div>
        )}
      </TabLayout>
    );
  };

  return (
    <>
      {props.hasPageLayout && (
        <Page title={documentTitle()} statusCode={props.statusCode}>
          <PageLayout
            PageHeader={props.hasPageHeader !== false && (
              <PageHeader
                titleArea={(
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  <Breadcrumbs>
                    <Link
                      to={props.listUrl}
                    >
                      {renderTitle()}
                    </Link>
                  </Breadcrumbs>
                )}
                primaryInfoArea={props.renderPrimaryInfo && props.renderPrimaryInfo()}
              />
            )}
            Modals={modals()}
          >
            {renderTabLayoutContent()}
          </PageLayout>
        </Page>
      )}
      {!props.hasPageLayout && renderTabLayoutContent()}
    </>
  );
}

PageWithSearchAndList.defaultProps = { extendSidebar: false, disableSpinner: false };
PageWithSearchAndList.displayName = 'PageWithSearchAndList';
