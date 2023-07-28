import React, { useEffect, useState } from 'react';

import { Banner, Button, ButtonSelect, DataTable } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';
import CSVUtil from 'main/util/CSVUtil';
import ReactUtil from 'main/util/ReactUtil';
import { todayInFormat } from 'main/util/TimeUtil';

import './BulkActionReportModal.scss';

const MODAL_ID = 'BULK_ACTION_REPORT_MODAL';

type DataRow = {
  [key: string]: string | React.ReactNode;
  isError?: boolean;
};
type Data = DataRow[];
type Status = 'error' | 'success';

interface Props {
  title?: string;
  errorBanner?: string;
  headers: string[];
  errorHeaders?: string[];
  successHeaders?: string[];
  data: Data;
  buttonText?: string;
  fileText?: string;
  showDownloadButton?: boolean;
  isAllErrors?: boolean;
}

function BulkActionReportModal(props: Props) {

  const [visibleStatus, setVisibleStatus] = useState<Status>('success');

  const isShowingErrorsOnly = props.isAllErrors || visibleStatus === 'error';

  const getGeneratedTableData = (shouldGetStringFormat?: boolean): { successData: Data, errorData: Data } => {
    const successData = [];
    const errorData = [];
    props.data.forEach((row) => {
      const rowData: { [key: string]: React.ReactNode } = {};
      Object.keys(row).forEach((key) => {
        if (key !== 'isError') {
          const value = row[key];
          if (React.isValidElement(value) && shouldGetStringFormat) {
            rowData[key] = ReactUtil.getStringFromComponent(value);
          } else {
            rowData[key] = value;
          }
        }
      });
      if (props.isAllErrors || row.isError) {
        errorData.push(rowData);
      } else {
        successData.push(rowData);
      }
    });
    return { successData, errorData };
  };

  const initialData = getGeneratedTableData();

  const [errorData, setErrorData] = useState<Data>(initialData.errorData);
  const [successData, setSuccessData] = useState<Data>(initialData.successData);

  useEffect(() => {
    const { successData, errorData } = getGeneratedTableData();
    setSuccessData(successData);
    setErrorData(errorData);
  }, [props.data]);

  const onOpen = () => setVisibleStatus('success');

  const closeModal = () => {
    ModalActions.close(MODAL_ID);
  };

  const onDownload = () => {
    const downloadStatus = visibleStatus === 'success' ? 'successes' : 'errors';
    CSVUtil.downloadCSVFromJSON({
      fields: getTableHeaders(),
      data: getTableDataForCsv()
    }, `${props.fileText}_${downloadStatus}_${todayInFormat('DD_MM_YYYY')}`);
  };

  const getTableHeaders = () => {
    let headers = [...props.headers];
    if (isShowingErrorsOnly) {
      headers = headers.filter(header => !props.successHeaders.includes(header));
    } else {
      headers = headers.filter(header => !props.errorHeaders.includes(header));
    }
    return headers;
  };

  const getTableData = () => {
    return isShowingErrorsOnly ? errorData : successData;
  };

  const getTableDataForCsv = () => {
    const shouldGetStringFormat = true;
    const { successData, errorData } = getGeneratedTableData(shouldGetStringFormat);
    return isShowingErrorsOnly ? errorData : successData;
  };

  const shouldShowErrorBanner = () => {
    return props.errorBanner && !!errorData.length;
  };

  const renderFooter = () => {
    return (
      <div className="modal__footer">
        <Button
          type="secondary"
          size="small"
          heavy
          onClick={closeModal}
        >
          {props.buttonText || 'close'}
        </Button>
      </div>
    );
  };

  return (
    <SinglePaneModal
      modalId={MODAL_ID}
      title={props.title}
      modalClass="bulk-action-report-modal"
      modalBodyClass="bulk-action-report-modal__body"
      modalSize="xlg"
      footerRenderer={renderFooter}
      closeOnClickOut={false}
      onOpen={onOpen}
    >
      {shouldShowErrorBanner() && (
        <div className="bulk-action-report-modal__banner">
          <Banner
            bannerType="error"
            bannerMessage={props.errorBanner}
          />
        </div>
      )}
      {!props.isAllErrors && (
        <div className="bulk-action-report-modal__status">
          <ButtonSelect
            activeSelect={visibleStatus}
            height="short"
            options={[
              {
                id: 'success',
                label: `Successes (${successData.length})`,
              },
              {
                id: 'error',
                label: `Failures (${errorData.length})`,
              }
            ]}
            onSelect={(status: Status) => setVisibleStatus(status)}
          />
        </div>
      )}
      <div className="bulk-action-report-modal__data-table">
        <DataTable
          headers={getTableHeaders()}
          data={getTableData()}
          theme="white"
        />
      </div>
      {props.showDownloadButton && (
        <div className="bulk-action-report-modal__download">
          <Button
            icon="fa fa-download"
            size="small"
            type="default"
            height="short"
            onClick={onDownload}
          >Download
          </Button>
        </div>
      )}
    </SinglePaneModal>
  );
}

BulkActionReportModal.MODAL_ID = MODAL_ID;

BulkActionReportModal.defaultProps = {
  title: 'Bulk action report',
  buttonText: 'close',
  fileText: 'bulk_action',
  showDownloadButton: false,
  isAllErrors: false,
  headers: [],
  errorHeaders: [],
  successHeaders: []
};

export default BulkActionReportModal;
