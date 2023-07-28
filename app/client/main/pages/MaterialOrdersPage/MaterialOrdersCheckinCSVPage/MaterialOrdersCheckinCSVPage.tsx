import React, { useState } from 'react';
import { Breadcrumbs, PizzaTracker, ButtonGroup, Button, Banner } from '@transcriptic/amino';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import _ from 'lodash';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import GenericCSVUploadPane from 'main/components/GenericCSVUploadPane';
import Urls from 'main/util/urls';
import csv_template from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinCSVPage/template/csv_template.json';
import FieldMapper from 'main/components/FieldMapper';
import CommonUiUtil from 'main/util/CommonUiUtil';
import FIELDS, { keys } from './CsvCheckinFields';
import MaterialOrdersCheckinCSVForm from './MaterialOrdersCheckinCSVForm';
import './MaterialOrdersCheckinCSVPage.scss';

const STEPS = {
  FIRST: 0,
  SECOND: 1,
  THIRD: 2
};

function MaterialOrdersCheckinCSVPage(props) {
  const [activeStepIndex, setActiveStepIndex] = useState(STEPS.FIRST);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState(undefined);
  const [showBanner, setShowBanner] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [transformedData, setTransformedData] = useState(null);

  const handleBannerMsg = (bannerType, bannerMsg) => {
    setShowBanner(true);
    setBannerType(bannerType);
    setBannerMessage(bannerMsg);
  };

  const handleError = errorState => {
    if (!errorState && bannerType === 'error') {
      setShowBanner(false);
    }
  };

  const shouldDisableStep = (step: number) => {
    if (step === STEPS.SECOND) {
      return !csvData;
    }

    if (step === STEPS.THIRD) {
      return !transformedData;
    }

    return false;
  };

  const handleBackClick = () => {
    const index = activeStepIndex - 1;
    handleStepChange(index);
  };

  const handleStepChange = (destinationIndex) => {
    if (activeStepIndex === STEPS.THIRD) {
      const message = 'Changing the mapping may result in losing your changes. Are you sure you want to continue?';
      if (!CommonUiUtil.confirmWithUser(message)) {
        return;
      }
    }
    setActiveStepIndex(destinationIndex);
  };

  const handleNextClick = () => {
    const nextIndex = activeStepIndex + 1;
    setActiveStepIndex(nextIndex);
  };

  const handleCsvDataChange = (csvData) => {
    setCsvData(csvData);
  };

  const handleFieldMapChange = (fieldMap, updatedTransformedData, isValid) => {
    if (isValid) {
      setTransformedData(updatedTransformedData);
    } else {
      setTransformedData(null);
    }
  };

  const handleCheckinSuccess = () => {
    props.history.replace({ pathname: Urls.material_orders_page() });
  };

  const isMissingDataForKey = (key, transformedData) => {
    return !transformedData.every(item => {
      return key && item[key];
    });
  };

  const fieldMapErrorCheck = (fieldMap, transformedData) => {
    const orderIdKey = keys.vendorOrderId;
    const skuKey = keys.sku;
    const volumeKey = keys.volume;
    const massKey = keys.mass;
    const isQuantityError = !fieldMap[volumeKey] && !fieldMap[massKey];
    const isOrderError = isMissingDataForKey(orderIdKey, transformedData);
    const isSkuError = isMissingDataForKey(skuKey, transformedData);
    const quantityError = 'Either volume or mass is required';
    const requiredError = 'Data is required for this column';
    return {
      ...(isQuantityError && {
        [volumeKey]: quantityError,
        [massKey]: quantityError
      }),
      ...(isOrderError && {
        [orderIdKey]: requiredError
      }),
      ...(isSkuError && {
        [skuKey]: requiredError
      })
    };
  };

  const validateCsv = (data) => {
    const uniqueFieldForGroup = 'Group Item Name';
    const containGroup = data.some(row => row[uniqueFieldForGroup]);
    const containIndividual = data.some(row => !row[uniqueFieldForGroup]);
    const isError = containGroup && containIndividual;
    return {
      isError: isError,
      errorMessage: 'File must contain only Individual or only Group orders. Group orders are specified in the "Group Item Name" column.'
    };
  };

  const steps = [
    {
      title: 'Upload file',
      iconClass: 'far fa-cloud-arrow-up'
    },
    {
      title: 'Field mapping',
      iconClass: 'fa-solid fa-table-columns',
      disabled: shouldDisableStep(STEPS.SECOND)
    },
    {
      title: 'Preview',
      iconClass: 'far fa-file-chart-column',
      disabled: shouldDisableStep(STEPS.THIRD)
    }
  ];

  const renderBackButton = () => {
    return (
      <Button
        type="secondary"
        to={activeStepIndex === STEPS.FIRST && Urls.material_orders_page()}
        onClick={activeStepIndex > STEPS.FIRST && handleBackClick}
      >
        Back
      </Button>
    );
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
              <span>Check in via CSV import</span>
            </Breadcrumbs>
          )}
        />
      )}
    >
      <TabLayout className="material-orders-checkin-csv-import">
        <div className="tx-stack tx-stack--xlg">
          <PizzaTracker
            steps={steps}
            activeStepIndex={activeStepIndex}
            onChange={handleStepChange}
          />

          {showBanner && (
            <Banner
              bannerType={bannerType}
              bannerMessage={bannerMessage}
              onClose={() => setShowBanner(false)}
            />
          )}

          <div className={
            classNames('material-orders-checkin-csv-page__screen', {
              'material-orders-checkin-csv-page__screen--active': activeStepIndex === STEPS.FIRST
            })}
          >
            <GenericCSVUploadPane
              template={csv_template}
              handleBannerMsg={handleBannerMsg}
              handleError={handleError}
              setCSVData={handleCsvDataChange}
              showRetry={false}
              handleReset={() => setCsvData(null)}
              validateCsvData={validateCsv}
            />
          </div>

          <div className={
            classNames('material-orders-checkin-csv-page__screen', {
              'material-orders-checkin-csv-page__screen--active': activeStepIndex === STEPS.SECOND
            })}
          >
            {csvData && (
              <FieldMapper
                data={csvData}
                fields={FIELDS}
                onChange={handleFieldMapChange}
                getCustomError={fieldMapErrorCheck}
              />
            )}
          </div>

          <div className={
            classNames('material-orders-checkin-csv-page__screen', {
              'material-orders-checkin-csv-page__screen--active': activeStepIndex === STEPS.THIRD
            })}
          >
            {transformedData && (
              <MaterialOrdersCheckinCSVForm
                transformedData={transformedData}
                backButton={renderBackButton()}
                onBulkCheckinSuccess={handleCheckinSuccess}
                disableErrorDisplay={activeStepIndex !== STEPS.THIRD}
              />
            )}
          </div>

          <div className="material-orders-checkin-csv-page__buttons">
            <ButtonGroup orientation="horizontal">
              {activeStepIndex !== STEPS.THIRD && renderBackButton()}

              {activeStepIndex < STEPS.THIRD && (
                <Button
                  type="primary"
                  onClick={handleNextClick}
                  disabled={shouldDisableStep(activeStepIndex + 1)}
                >
                  Next
                </Button>
              )
            }
            </ButtonGroup>
          </div>
        </div>
      </TabLayout>
    </PageLayout>
  );
}

export default MaterialOrdersCheckinCSVPage;
