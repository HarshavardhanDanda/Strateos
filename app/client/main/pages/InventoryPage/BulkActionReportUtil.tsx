import React from 'react';
import _ from 'lodash';
import { DateTime } from '@transcriptic/amino';
import { CONTAINER_STATUS } from 'main/util/ContainerUtil';

interface Container {
  id: string;
  barcode: string;
  label: string;
  status: string;
  updated_at: string;
  organization?: string;
  location_id?: string;
  errors?: {
    title: string;
    detail: string;
  }[];
}

interface Error {
  title: string;
  detail: string;
  code: string;
  source: string;
  status: string;
}

const ACROSS_PAGES_ACTIONS = {
  DOWNLOAD: 'download',
  DESTROY: 'destroy',
  DELETE: 'delete',
  TRANSFER: 'transfer',
  RELOCATE: 'relocate'
};

const MULTI_PER_PAGE_ACTIONS = {
  TRANSFER: 'multi_transfer',
  RELOCATE: 'relocate_many'
};

const BulkActionReportUtil = {
  ACROSS_PAGES_ACTIONS: ACROSS_PAGES_ACTIONS,

  MULTI_PER_PAGE_ACTIONS: MULTI_PER_PAGE_ACTIONS,

  getHeaders: (action:string) => {
    switch (action) {
      case ACROSS_PAGES_ACTIONS.DOWNLOAD:
      case ACROSS_PAGES_ACTIONS.DESTROY:
      case ACROSS_PAGES_ACTIONS.DELETE:
        return ['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason'];
      case ACROSS_PAGES_ACTIONS.TRANSFER:
      case MULTI_PER_PAGE_ACTIONS.TRANSFER:
        return ['Id', 'Label', 'Barcode', 'Status', 'Organization', 'Updated at', 'Reason'];
      case ACROSS_PAGES_ACTIONS.RELOCATE:
      case MULTI_PER_PAGE_ACTIONS.RELOCATE:
        return ['Id', 'Label', 'Barcode', 'Status', 'Location', 'Updated at', 'Reason'];
      default:
        return [];
    }
  },

  getErrorHeaders: (action: string) => {
    switch (action) {
      case ACROSS_PAGES_ACTIONS.DOWNLOAD:
      case ACROSS_PAGES_ACTIONS.DESTROY:
      case ACROSS_PAGES_ACTIONS.DELETE:
      case ACROSS_PAGES_ACTIONS.TRANSFER:
      case MULTI_PER_PAGE_ACTIONS.TRANSFER:
      case ACROSS_PAGES_ACTIONS.RELOCATE:
      case MULTI_PER_PAGE_ACTIONS.RELOCATE:
        return ['Reason'];
      default:
        return [];
    }
  },

  getErrorText: (action: string) => {
    switch (action) {
      case ACROSS_PAGES_ACTIONS.DOWNLOAD:
        return 'One or more containers could not be downloaded';
      case ACROSS_PAGES_ACTIONS.DESTROY:
        return 'One or more containers could not be destroyed';
      case ACROSS_PAGES_ACTIONS.DELETE:
        return 'One or more containers could not be deleted';
      case ACROSS_PAGES_ACTIONS.TRANSFER:
        return 'One or more containers could not be transferred';
      case MULTI_PER_PAGE_ACTIONS.TRANSFER:
        return 'One or more containers has invalid status or are scheduled for runs';
      case ACROSS_PAGES_ACTIONS.RELOCATE:
      case MULTI_PER_PAGE_ACTIONS.RELOCATE:
        return 'One or more containers could not be relocated';
      default:
        return '';
    }
  },

  getFileText: (action: string) => {
    switch (action) {
      case ACROSS_PAGES_ACTIONS.DOWNLOAD:
      case ACROSS_PAGES_ACTIONS.DESTROY:
      case ACROSS_PAGES_ACTIONS.DELETE:
        return `${action}_containers`;
      case ACROSS_PAGES_ACTIONS.TRANSFER:
      case MULTI_PER_PAGE_ACTIONS.TRANSFER:
        return 'transfer_containers';
      case ACROSS_PAGES_ACTIONS.RELOCATE:
      case MULTI_PER_PAGE_ACTIONS.RELOCATE:
        return 'relocate_containers';
      default:
        return '';
    }
  },

  buildReport: (
    response: {
      data: {
        attributes: {
          result_success: Container[],
          result_errors: Container[]
        }
      }
    }
  ): { [key: string]: JSX.Element }[] => {
    const reportData = [];

    const formattedContainer = (container: Container, reason?: string, isError?: boolean) => ({
      Id: container.id,
      Barcode: container.barcode || '-',
      Label: container.label || '-',
      Organization: container.organization || '-',
      Location: container.location_id || '-',
      'Updated at': container.updated_at ? <DateTime timestamp={container.updated_at} format="absolute-format" /> : '-',
      Status: CONTAINER_STATUS[container.status] || '-',
      Reason: reason,
      isError: isError,
    });

    response.data.attributes.result_success.forEach((container) => {
      reportData.push(formattedContainer(container, '-', false));
    });
    response.data.attributes.result_errors.forEach((container) => {
      if (!_.isEmpty(container.errors)) {
        container.errors.forEach(err => {
          reportData.push(formattedContainer(container, err.detail, true));
        });
      }
    });

    return reportData;
  },

  getErrorMsgIfFailedWithErrors: (
    response: {
      data: {
        attributes: {
          result_success: Container[],
          result_errors: Container[],
          failed_with_errors: Error
        }
      }
    }) : string => {
    const failedWithErrors = response && _.get(response, ['data', 'attributes', 'failed_with_errors']);
    const errorMsg = _.get(failedWithErrors, ['code']) === '500'
      ? _.get(failedWithErrors, ['title'])
      : _.get(failedWithErrors, ['detail']);
    return errorMsg || '';
  },

};

export default BulkActionReportUtil;
