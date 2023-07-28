import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import immutable from 'immutable';
import _ from 'lodash';
import { CollapsiblePanel, Divider } from '@transcriptic/amino';
import ResultsViewSidebar from './ResultsViewSidebar';

const measurements = [
  {
    analysis_tool: null,
    analysis_tool_version: null,
    attachments: [
      {
        bucket: 'transcriptic-analytical-data',
        key: 'd13ndzd2gjkjuz',
        name: 'data-sap-06-ct1e7snxzzrbd6n-700000TME-LCMS_QDXUHFNADI1-0.zip'
      }
    ],
    data_type: 'file',
    deleted_at: null,
    id: 'd13ndzd2gjkjuz',
    instruction_id: 'i1ezzv9tpwepp8',
    is_analysis: false,
    run_id: null,
    title: null,
    uploaded_by: null,
    warp_id: 'w13ndzd2bfmpgd',
  },
  {
    analysis_tool: null,
    analysis_tool_version: null,
    attachments: [
      {
        bucket: 'transcriptic-analytical-data',
        key: 'd13ndzd2gjkjaa',
        name: 'data-sap-06-ct1e7snxzzrbd6n-700000TME-LCMS_QDXUHFNADI2-0.zip'
      }
    ],
    data_type: 'file',
    deleted_at: null,
    id: 'd13ndzd2gjkjaa',
    instruction_id: 'i1ezzv9tpwepp9',
    is_analysis: false,
    run_id: null,
    title: null,
    uploaded_by: null,
    warp_id: 'w13ndzd2bfmpdd',
  },
  {
    analysis_tool: null,
    analysis_tool_version: null,
    attachments: [
      {
        bucket: 'transcriptic-analytical-data',
        key: 'd13ndzd2gjkjbb',
        name: 'data-sap-06-ct1e7snxzzrbd6n-700000TME-LCMS_QDXUHFNADI3-0.zip'
      }
    ],
    data_type: 'file',
    deleted_at: null,
    id: 'd13ndzd2gjkjbb',
    instruction_id: 'i1ezzv9tpwepp8',
    is_analysis: false,
    run_id: null,
    title: null,
    uploaded_by: null,
    warp_id: 'w13ndzd2bfmpdc',
  }];

const analyses = [
  {
    analysis_tool: 'PostRunContainerSummary',
    analysis_tool_version: '1.0',
    attachments: [
      {
        bucket: 'transcriptic-uploads',
        key: 'uploads/29f17135-edf2-40b3-bf13-7ca5e8ed3312/post_run_container_summary_files.zip',
        name: 'post_run_container_summary_files.zip'
      }
    ],
    created_at: '2020-10-28T12:56:22.032-07:00',
    data_type: 'file',
    deleted_at: null,
    id: 'd1f24v4wvkxjk1',
    instruction_id: null,
    is_analysis: true,
    run_id: 'r1ezzv9tpqrq23',
    title: 'post_run_container_summary_files',
    uploaded_by: 'u1dy3m5avan3mg',
    warp_id: null
  },
  {
    analysis_tool: 'PostRunContainerSummary',
    analysis_tool_version: '1.0',
    attachments: [
      {
        bucket: 'transcriptic-uploads',
        key: 'uploads/29f17135-edf2-40b3-bf13-7ca5e8ed3313/post_run_container_summary_files.zip',
        name: 'post_run_container_summary_files.zip'
      }
    ],
    created_at: '2020-10-28T12:57:24.03-07:00',
    data_type: 'file',
    deleted_at: null,
    id: 'd1f24v4wvkxjk2',
    instruction_id: null,
    is_analysis: true,
    run_id: 'r1ezzv9tpqrq23',
    title: 'post_run_container_summary_files_2',
    uploaded_by: 'u1dy3m5avan3mg',
    warp_id: null
  }
];

const analysesList = immutable.fromJS(analyses);
const datasets = immutable.fromJS([...measurements, ...analyses]);

const datasetsByRefname = {
  Eng_3: immutable.fromJS(measurements[0]),
  Eng_1: immutable.fromJS(measurements[1]),
  Eng_2: immutable.fromJS(measurements[2])
};

const createdDatasetsByRefname = {
  Eng_3: immutable.fromJS({ ...measurements[0], created_at: '2020-11-02T12:51:59.360-07:00' }),
  Eng_1: immutable.fromJS({ ...measurements[1], created_at: '2020-11-02T12:52:59.360-07:00' }),
  Eng_2: immutable.fromJS({ ...measurements[2], created_at: '2020-11-02T12:53:59.360-07:00' }),
};

const partialCreatedDatasetsByRefname = {
  Eng_3: immutable.fromJS({ ...measurements[0], created_at: '2020-11-02T12:51:59.360-07:00' }),
  Eng_1: immutable.fromJS({ ...measurements[1] }),
  Eng_2: immutable.fromJS({ ...measurements[2], created_at: '2020-11-02T12:53:59.360-07:00' }),
};

const projectId = 'p1ekufyy9v23sc';
const runId = 'r1ezzv9tpqrq23';
const runStatus = 'complete';
const runView = 'queue';

describe('ResultViewSidebar', () => {
  let resultViewSideBar;

  beforeEach(() => {
    resultViewSideBar = shallow((
      <ResultsViewSidebar
        runView={runView}
        runStatus={runStatus}
        runId={runId}
        projectId={projectId}
        datasets={datasets}
        datasetsByRefname={datasetsByRefname}
        changeSelectedPanel={() => { }}
        analyses={analysesList}
      />
    ));
  });

  afterEach(() => {
    if (resultViewSideBar) {
      resultViewSideBar.unmount();
    }
  });

  it('should display both measurement and analysis sections', () => {
    expect(resultViewSideBar.find('CollapsiblePanel')).to.have.lengthOf(2);
    expect(resultViewSideBar.find('CollapsiblePanel').at(0).props().title).to.equal('Measurements');
    expect(resultViewSideBar.find('CollapsiblePanel').at(1).props().title).to.equal('Analyses');
  });

  it('should display the download all datasets button', () => {
    expect(resultViewSideBar.find('Button')).to.have.lengthOf(1);
  });

  it('download all button should have the link to the url to download all datasets of that run', () => {
    const zipUrl = `/api/runs/${runId}/zip_data`;
    expect(resultViewSideBar.find('Button').props().to).to.equal(zipUrl);
  });

  it('accordion should collapse with fa-chevron-right icon by default', () => {
    expect(resultViewSideBar.find('CollapsiblePanel').at(0)
      .dive()
      .find('i')
      .prop('className')).to.includes('fa-chevron-right');
    expect(resultViewSideBar.find('CollapsiblePanel').at(1)
      .dive()
      .find('i')
      .prop('className'))
      .to.includes('fa-chevron-right');
  });

  it('should have measurements items sorted by reference name (ASC) when created_at time is unavailable', () => {
    const items = resultViewSideBar.find('CollapsiblePanel').at(0).find('SidebarListItem');

    expect(items.length).to.equal(3);
    expect(items.at(0).prop('name')).to.equal('Eng_1');
    expect(items.at(1).prop('name')).to.equal('Eng_2');
    expect(items.at(2).prop('name')).to.equal('Eng_3');
  });

  it('should have measurements items sorted by complete time (DESC) when created_at time is available', () => {
    resultViewSideBar.setProps({ datasetsByRefname: createdDatasetsByRefname });
    const items = resultViewSideBar.find('CollapsiblePanel').at(0).find('SidebarListItem');

    expect(items.length).to.equal(3);
    expect(items.at(0).prop('name')).to.equal('Eng_2');
    expect(items.at(1).prop('name')).to.equal('Eng_1');
    expect(items.at(2).prop('name')).to.equal('Eng_3');
  });

  it('should have measurements items sorted by created_at time (DESC) then alpha-numeric (ASC) with partial created', () => {
    resultViewSideBar.setProps({ datasetsByRefname: partialCreatedDatasetsByRefname });
    const items = resultViewSideBar.find('CollapsiblePanel').at(0).find('SidebarListItem');

    expect(items.length).to.equal(3);
    expect(items.at(0).prop('name')).to.equal('Eng_2');
    expect(items.at(1).prop('name')).to.equal('Eng_3');
    expect(items.at(2).prop('name')).to.equal('Eng_1');
  });

  it('should have analyse items sorted by created_at time (DESC)', () => {
    const items = resultViewSideBar.find('CollapsiblePanel').at(1).find('SidebarListItem');

    expect(items.length).to.equal(2);
    expect(items.at(0).prop('name')).to.equal('post_run_container_summary_files_2');
    expect(items.at(1).prop('name')).to.equal('post_run_container_summary_files');
  });

  it('should have Divider components for each CollapsiblePanel component', () => {
    expect(resultViewSideBar.find(Divider)).to.have.length(2);
    expect(resultViewSideBar.find(CollapsiblePanel)).to.have.length(2);
  });
});
