import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { Button } from '@transcriptic/amino';

import BulkActionReportModal from 'main/components/BulkActionReportModal';
import CSVUtil from 'main/util/CSVUtil';
import { todayInFormat } from 'main/util/TimeUtil';

describe('BulkActionReportModal', () => {
  let sandbox;
  let wrapper;

  const data = [
    {
      'header-1': 'value-1',
      'header-2': 'value-2',
      'header-3': 'value-3'
    },
    {
      'header-1': 'value-1',
      'header-2': 'value-2',
      'header-3': 'value-3'
    }
  ];

  const dataWithStatus: { [key: string]: React.ReactNode }[] = [
    { ...data[0], isError: true, 'error-header-1': 'Some error reason', 'error-header-2': 'Some other error reason' },
    { ...data[0] },
    { ...data[0], isError: true, 'error-header-1': 'Some error reason' },
  ];

  const props = {
    title: 'Test title for bulk reporting',
    headers: ['header-1', 'header-2', 'header-3'],
    data: data
  };

  const getModal = () => wrapper.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal');

  const getDownloadButton = () => getModal().dive().find(Button).filterWhere(button => button.props().children === 'Download');

  const getDataTable = () => getModal().dive().find('DataTable');

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should contain Single Pane Modal', () => {
    wrapper = shallow(<BulkActionReportModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
  });

  it('should render extra large modal', () => {
    wrapper = shallow(<BulkActionReportModal {...props} />);
    expect(wrapper.find('ConnectedSinglePaneModal').prop('modalSize')).to.equal('xlg');
  });

  it('should render title and subtext', () => {
    wrapper = shallow(<BulkActionReportModal {...props} isAllErrors errorBanner="optional banner message" />);
    const singlePaneModal = getModal();
    expect(singlePaneModal.props().title).to.equal('Test title for bulk reporting');
    expect(singlePaneModal.dive().find('Banner').prop('bannerMessage')).to.equal('optional banner message');
    expect(wrapper.find('ConnectedSinglePaneModal')).to.length(1);
  });

  it('should have button with close as text as default when no prop is passed', () => {
    wrapper = shallow(<BulkActionReportModal {...props} />);
    const modalFooterButton = getModal().dive().find(Button);
    expect(modalFooterButton).to.have.length(1);
    expect(modalFooterButton.dive().text()).to.equal('close');
  });

  it('should have button text as passed as prop', () => {
    wrapper = shallow(<BulkActionReportModal {...props} buttonText="alternate text" />);
    const modalFooterButton = getModal().dive().find(Button);
    expect(modalFooterButton).to.have.length(1);
    expect(modalFooterButton.dive().text()).to.equal('alternate text');
  });

  it('should render download button', () => {
    wrapper = shallow(<BulkActionReportModal {...props} showDownloadButton />);
    expect(getDownloadButton()).to.have.length(1);
  });

  it('should not render download button by default', () => {
    wrapper = shallow(<BulkActionReportModal {...props} />);
    expect(getDownloadButton()).to.have.length(0);
  });

  it('should pass correct values to dataTable based on props', () => {
    wrapper = shallow(<BulkActionReportModal {...props} buttonText="alternate text" />);
    const dataTable = getDataTable();
    expect(dataTable.props().headers).to.eql(['header-1', 'header-2', 'header-3']);
    expect(dataTable.props().data).to.eql([
      {
        'header-1': 'value-1',
        'header-2': 'value-2',
        'header-3': 'value-3'
      },
      {
        'header-1': 'value-1',
        'header-2': 'value-2',
        'header-3': 'value-3'
      }
    ]
    );
  });

  it('should download CSV when download is clicked', () => {
    wrapper = shallow(<BulkActionReportModal {...props} showDownloadButton />);
    const downloadCSVFromJSONStub = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    getDownloadButton().simulate('click');

    expect(downloadCSVFromJSONStub.calledOnceWith(
      { fields: ['header-1', 'header-2', 'header-3'],
        data: [
          {
            'header-1': 'value-1',
            'header-2': 'value-2',
            'header-3': 'value-3'
          },
          {
            'header-1': 'value-1',
            'header-2': 'value-2',
            'header-3': 'value-3'
          }
        ]
      })).to.be.true;
  });

  it('should download CSV with correct name when "Successes" download button is clicked', () => {
    wrapper = shallow(<BulkActionReportModal {...props} showDownloadButton fileText="test_action" />);
    const downloadCSVFromJSONStub = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    getDownloadButton().simulate('click');
    const formattedDate = todayInFormat('DD_MM_YYYY');
    expect(downloadCSVFromJSONStub.args[0][1]).to.be.eql('test_action_successes_' + formattedDate);
  });

  it('should download CSV with correct name when "Failures" download button is clicked', () => {
    wrapper = shallow(<BulkActionReportModal {...props} data={dataWithStatus} showDownloadButton />);
    const downloadCSVFromJSONStub = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    getModal().dive().find('ButtonSelect').prop('onSelect')('error');
    getDownloadButton().simulate('click');
    const formattedDate = todayInFormat('DD_MM_YYYY');
    expect(downloadCSVFromJSONStub.args[0][1]).to.be.eql('bulk_action_errors_' + formattedDate);
  });

  it('should download CSV with default name when action prop is not passed', () => {
    wrapper = shallow(<BulkActionReportModal {...props} showDownloadButton />);
    const downloadCSVFromJSONStub = sandbox.stub(CSVUtil, 'downloadCSVFromJSON');
    getDownloadButton().simulate('click');
    const formattedDate = todayInFormat('DD_MM_YYYY');
    expect(downloadCSVFromJSONStub.args[0][1]).to.be.eql('bulk_action_successes_' + formattedDate);
  });

  it('should display buttons for toggling between successful and failed rows', () => {
    wrapper = shallow(<BulkActionReportModal {...props} data={dataWithStatus} />);
    expect(getModal().dive().find('ButtonSelect').length).to.equal(1);
    expect(getModal().dive().find('ButtonSelect').prop('options')[0].label).to.equal('Successes (1)');
    expect(getModal().dive().find('ButtonSelect').prop('options')[1].label).to.equal('Failures (2)');
  });

  it('should display all data rows without toggle when "isAllErrors" is true', () => {
    wrapper = shallow(<BulkActionReportModal {...props} data={data} isAllErrors />);
    expect(getModal().dive().find('ButtonSelect').length).to.equal(0);
    expect(getDataTable().prop('data').length).to.equal(2);
  });

  it('should display success rows only when "Successes" button is selected', () => {
    wrapper = shallow(<BulkActionReportModal {...props} data={dataWithStatus} />);
    expect(getDataTable().props().data.length).to.equal(1);
  });

  it('should display error rows only when "Failures" button is selected', () => {
    wrapper = shallow(<BulkActionReportModal {...props} data={dataWithStatus} />);
    getModal().dive().find('ButtonSelect').prop('onSelect')('error');
    expect(getDataTable().props().data.length).to.equal(2);
  });

  it('should only display error column when error rows are visible', () => {
    wrapper = shallow(
      <BulkActionReportModal
        {...props}
        data={dataWithStatus}
        headers={['header-1', 'error-header-1', 'header-2', 'header-3', 'error-header-2']}
        errorHeaders={['error-header-1', 'error-header-2']}
      />
    );
    expect(getDataTable().props().headers).to.deep.equal(['header-1', 'header-2', 'header-3']);
    getModal().dive().find('ButtonSelect').prop('onSelect')('error');
    expect(getDataTable().props().headers).to.deep.equal(['header-1', 'error-header-1', 'header-2', 'header-3', 'error-header-2']);
    expect(getDataTable().props().data[0]['error-header-1']).to.equal('Some error reason');
    expect(getDataTable().props().data[0]['error-header-2']).to.equal('Some other error reason');
  });
});
