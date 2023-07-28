import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ContainerStore from 'main/stores/ContainerStore';
import mockBulkRequestResponsePartialSuccess from 'main/test/container/bulkActions/mockBulkRequestResponsePartialSuccess.json';
import mockMultiTransferResponsePartialSuccess from 'main/test/container/bulkActions/mockMultiTransferResponsePartialSuccess.json';
import mockMultiRelocateResponsePartialSuccess from 'main/test/container/bulkActions/mockMultiRelocateResponsePartialSuccess.json';
import mockBulkDownloadResponseFailedWithErrorsCode500 from 'main/test/container/bulkActions/mockBulkDownloadResponseFailedWithErrorsCode500.json';
import mockBulkDownloadResponseFailedWithErrorsCode400 from 'main/test/container/bulkActions/mockBulkDownloadResponseFailedWithErrorsCode400.json';
import BulkActionReportUtil from './BulkActionReportUtil';

describe('BulkActionReportUtil', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.fromJS({
      id: 'container-id',
      barcode: 'ABC123',
      label: 'Some label',
      container_type_shortname: 'a1-vial',
      organization_name: 'Strateos',
      created_at: '2021-02-03T08:36:23.086-08:00',
    }));
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should return headers', () => {
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Organization', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.TRANSFER)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Organization', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Location', 'Updated at', 'Reason']);
    expect(BulkActionReportUtil.getHeaders(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.RELOCATE)).to.deep.equal(['Id', 'Label', 'Barcode', 'Status', 'Location', 'Updated at', 'Reason']);
  });

  it('should return error headers', () => {
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.TRANSFER)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE)).to.deep.equal(['Reason']);
    expect(BulkActionReportUtil.getErrorHeaders(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.RELOCATE)).to.deep.equal(['Reason']);
  });

  it('should return error text', () => {
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD)).to.deep.equal('One or more containers could not be downloaded');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY)).to.deep.equal('One or more containers could not be destroyed');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE)).to.deep.equal('One or more containers could not be deleted');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER)).to.deep.equal('One or more containers could not be transferred');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.TRANSFER)).to.deep.equal('One or more containers has invalid status or are scheduled for runs');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE)).to.deep.equal('One or more containers could not be relocated');
    expect(BulkActionReportUtil.getErrorText(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.RELOCATE)).to.deep.equal('One or more containers could not be relocated');
  });

  it('should return file text', () => {
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DOWNLOAD)).to.deep.equal('download_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DESTROY)).to.deep.equal('destroy_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.DELETE)).to.deep.equal('delete_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.TRANSFER)).to.deep.equal('transfer_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.TRANSFER)).to.deep.equal('transfer_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.ACROSS_PAGES_ACTIONS.RELOCATE)).to.deep.equal('relocate_containers');
    expect(BulkActionReportUtil.getFileText(BulkActionReportUtil.MULTI_PER_PAGE_ACTIONS.RELOCATE)).to.deep.equal('relocate_containers');
  });

  it('should build report for selected containers', () => {
    const report = BulkActionReportUtil.buildReport(mockBulkRequestResponsePartialSuccess);
    expect(report[0].Id).to.equal('ct101');
    expect(report[2].Id).to.equal('ct103');
    expect(report[0].Barcode).to.equal('AA_101');
    expect(report[2].Barcode).to.equal('AA_103');
    expect(report[0].Label).to.equal('container_name_1');
    expect(report[2].Label).to.equal('container_name_3');
    expect(report[0].Organization).to.equal('Strateos');
    expect(report[1].Organization).to.equal('-');
    expect(report[0].Location).to.equal('loc1');
    expect(report[1].Location).to.equal('-');
    expect(report[0].Status).to.equal('Returned');
    expect(report[2].Status).to.equal('Destroyed');
    expect(report[0].Reason).to.equal('-');
    expect(report[2].Reason).to.equal('Container with id ct103 not found');
    expect(report[0]['Updated at'].props.timestamp).to.equal('2023-02-21T00:45:22.002-08:00');
    expect(report[2]['Updated at'].props.timestamp).to.equal('2023-02-21T00:45:22.002-08:00');
  });

  it('should build report for (multi) transferring selected containers on a single page', () => {
    const report = BulkActionReportUtil.buildReport(mockMultiTransferResponsePartialSuccess);
    expect(report[0].Id).to.equal('ct123');
    expect(report[0].Barcode).to.equal('bar123');
    expect(report[0].Organization).to.equal('Strateos');
    expect(report[0].Label).to.equal('container_1');
    expect(report[0].Status).to.equal('Available');
    expect(report[0]['Updated at'].props.timestamp).to.equal('2023-02-21T00:45:22.002-08:00');

    expect(report[1].Id).to.equal('ct124');
    expect(report[1].Barcode).to.equal('bar456');
    expect(report[1].Organization).to.equal('Strateos');
    expect(report[1].Label).to.equal('container_2');
    expect(report[1].Status).to.equal('Available');
    expect(report[1]['Updated at'].props.timestamp).to.equal('2023-02-21T00:45:22.002-08:00');
    expect(report[1].Reason).to.equal('container ct124, Multiple tubes cannot be in a single box cell');
  });

  it('should build report for (multi) relocating selected containers on a single page', () => {
    const report = BulkActionReportUtil.buildReport(mockMultiRelocateResponsePartialSuccess);
    expect(report[0].Id).to.equal('c1');
    expect(report[0].Barcode).to.equal('bar1');
    expect(report[0].Location).to.equal('loc1');
    expect(report[0].Label).to.equal('Sample relocation container 1');
    expect(report[0].Status).to.equal('Available');
    expect(report[0]['Updated at'].props.timestamp).to.equal('2023-04-05T23:59:41.147-07:00');

    expect(report[1].Id).to.equal('c2');
    expect(report[1].Barcode).to.equal('bar2');
    expect(report[1].Location).to.equal('loc2');
    expect(report[1].Label).to.equal('Sample relocation container 2');
    expect(report[1].Status).to.equal('Available');
    expect(report[1]['Updated at'].props.timestamp).to.equal('2023-03-29T04:44:07.580-07:00');
    expect(report[1].Reason).to.equal('Multiple tubes cannot be in a single box cell.');
  });

  it('should return the error title when failed_with_errors fails with a 500 code', () => {
    const errorMsg = BulkActionReportUtil.getErrorMsgIfFailedWithErrors(mockBulkDownloadResponseFailedWithErrorsCode500);
    expect(errorMsg).to.equal('Internal Server Error');
  });

  it('should return the error detail when failed_with_errors fails with a 4xx code', () => {
    const errorMsg = BulkActionReportUtil.getErrorMsgIfFailedWithErrors(mockBulkDownloadResponseFailedWithErrorsCode400);
    expect(errorMsg).to.equal('User not authorized to perform this action');
  });

  it('should return an empty string failed_with_errors is null', () => {
    const errorMsg = BulkActionReportUtil.getErrorMsgIfFailedWithErrors(mockBulkRequestResponsePartialSuccess);
    expect(errorMsg).to.equal('');
  });
});
