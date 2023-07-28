import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Link } from 'react-router-dom';

import PackageActions             from 'main/actions/PackageActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout }              from 'main/components/TabLayout';
import RowWrappedGrid             from 'main/components/grid';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import PackageStore               from 'main/stores/PackageStore';
import SessionStore               from 'main/stores/SessionStore';
import Urls                       from 'main/util/urls';

import { ZeroState, Page, Breadcrumbs } from '@transcriptic/amino';

import FeatureConstants from '@strateos/features';
import AcsControls      from  'main/util/AcsControls';
import AddPackageCard from './AddPackageCard';
import PackageCard    from './PackageCard';

const propTypes = {
  packages: PropTypes.instanceOf(Immutable.Iterable),
  reservedNames: PropTypes.instanceOf(Immutable.Iterable)
};

class PackagesPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusCode: undefined
    };
  }

  componentDidMount() {
    PackageActions.loadAll()
      .fail(xhr => this.setState({ statusCode: xhr.status }));
  }

  render() {
    const canUploadPackages = AcsControls.isFeatureEnabled(FeatureConstants.CREATE_PACKAGE_PROTOCOL);
    const hasPackages = this.props.packages.count() > 0;
    const showZeroState = !canUploadPackages && !hasPackages;

    return (
      <Page title="Packages" statusCode={this.state.statusCode}>
        <PageLayout
          theme="gray"
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.packages()}>Packages</Link>
                </Breadcrumbs>
              )}
              primaryInfoArea={(
                <p className="hint tx-type--invert">
                  <i className="far fa-question-circle" />
                  {' Have questions? Check out the '}
                  <a
                    href="https://developers.strateos.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >developer docs
                  </a>
                  {' or view the '}
                  <a href={`/${SessionStore.getOrg().get('subdomain')}/vendor/materials`}>
                    provisionable resources
                  </a>.
                </p>
              )}
            />
          )}
        >
          <TabLayout>
            <div className="packages-page">
              <div className="wrapped-card-page">
                <RowWrappedGrid gridClassname="packages">

                  <If condition={canUploadPackages}>
                    <AddPackageCard reservedNames={this.props.reservedNames} />
                  </If>

                  <If condition={hasPackages}>
                    {
                      this.props.packages.map((_package) => {
                        return (
                          <PackageCard key={_package.get('id')} _package={_package} />
                        );
                      })
                    }
                  </If>

                  <If condition={showZeroState}>
                    <ZeroState
                      title="No packages found."
                      subTitle="You currently do not have permission to upload new packages.
                                If you would like to onboard a new protocol, please contact
                                your organization's administrator
                                or the Strateos sales team. A package is a collection of protocols."
                      hasBorder
                    />
                  </If>

                </RowWrappedGrid>
              </div>
            </div>
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}
PackagesPage.propTypes = propTypes;

const getStateFromStores = () => {
  const org           = SessionStore.getOrg();
  const packages      = PackageStore.getByOrgId(org && org.get('id'));
  const reservedNames = packages && packages.map((_package) => {
    return PackageStore.nameWithoutDomain(_package.get('name'));
  });

  return { packages, reservedNames };
};

export default ConnectToStores(PackagesPage, getStateFromStores);
