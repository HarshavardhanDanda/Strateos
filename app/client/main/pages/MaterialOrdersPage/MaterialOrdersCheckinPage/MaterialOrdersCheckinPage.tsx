import React from 'react';
import _ from 'lodash';
import { Breadcrumbs, Divider, TextBody, TextSubheading } from '@transcriptic/amino';
import { Link } from 'react-router-dom';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import Urls from 'main/util/urls';
import MaterialOrdersCheckinForm from './MaterialOrdersCheckinForm';

function MaterialOrdersCheckinPage(props) {
  const data = props.location.data;

  if (!data) {
    props.history.replace({ pathname: Urls.material_orders_page() });
    return null;
  }

  const onBulkCheckinSuccess = () => {
    props.history.replace({ pathname: Urls.material_orders_page() });
  };

  return (
    <PageLayout
      PageHeader={(
        <PageHeader
          titleArea={(
            <Breadcrumbs>
              <Link
                to={Urls.material_orders_page()}
              >
                Orders
              </Link>
              <span>Check in</span>
            </Breadcrumbs>
          )}
        />
      )}
    >
      <TabLayout className="material-orders-checkin">
        <div className="tx-stack tx-stack--xlg">
          <div>
            <TextSubheading>
              Check in
            </TextSubheading>
            <Divider isDark />
            <TextBody color="secondary">
              Your selected order items will appear in the table below. Please assign data related to each column.
            </TextBody>
          </div>
          <MaterialOrdersCheckinForm
            data={data}
            onBulkCheckinSuccess={onBulkCheckinSuccess}
          />
        </div>
      </TabLayout>
    </PageLayout>
  );
}

export default MaterialOrdersCheckinPage;
