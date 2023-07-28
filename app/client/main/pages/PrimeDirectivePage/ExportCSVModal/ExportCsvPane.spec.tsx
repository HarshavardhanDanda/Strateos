import React from 'react';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import { expect } from 'chai';
import sinon from 'sinon';
import ExecutionSupportArtifactActions  from 'main/actions/ExecutionSupportArtifactActions';
import { TextSubheading, Button, Table } from '@transcriptic/amino';
import { MultiStepModalPane } from 'main/components/Modal';
import NotificationActions from 'main/actions/NotificationActions';
import ExportCsvPane from './ExportCsvPane';

const instructions = [
  {
    id: 'i1eg7pvdcaa001',
    operation: {
      op: 'spin'
    },
    refs: [{
      container_id: 'c1'
    }],
    generates_execution_support_artifacts: true
  },
  {
    id: 'i1eg7pvdcaa002',
    operation: {
      op: 'sanger_sequence'
    },
    refs: [{
      container_id: 'c1'
    }],
    generates_execution_support_artifacts: true
  },
  {
    id: 'i1eg7pvdcaa003',
    operation: {
      op: 'sanger_sequence'
    },
    refs: [{
      container_id: 'c1'
    }],
    generates_execution_support_artifacts: true
  }
];

const responseEsa =
  {
    data: [
      {
        id: 'esa1apm8z5bjpy54eb2',
        attributes: {
          name: 'Sanger_file_3.csv',
          comment: null,
          operation: 'sanger_sequence',
          status: 'generated',
          created_at: '2022-12-01T00:50:01.362-08:00',
          presigned_url: 'www.randomUrl.com'
        }
      }
    ],
    meta: {
      record_count: 2
    }
  };

describe('ExportCsvPane', () => {
  let exportCsvPane;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    exportCsvPane = shallow(<ExportCsvPane
      instructions={Immutable.fromJS(instructions)}
      selectedInstructionType={'sanger_sequence'}
      runId={'r1ieuwr324'}
    />);
  });

  afterEach(() => {
    sandbox.restore();
    exportCsvPane.unmount();
  });

  it('should render exportcsv pane subheading', () => {
    expect(exportCsvPane.find(TextSubheading)).to.have.length(1);
    const heading = exportCsvPane.find(TextSubheading).dive().find('Text').dive()
      .find('h2');
    expect(heading.children().text()).to.includes('Generated data');
  });

  it('should render pane regenrate button', () => {
    const button = exportCsvPane.find(Button);
    expect(exportCsvPane.find(Button)).to.have.length(1);
    expect(button.children().text()).to.equal('Regenerate');
  });

  it('should render regenerate button and call action when its clicked', () => {
    const regenerateExecutionSupportArtifact = sandbox.stub(ExecutionSupportArtifactActions, 'regenerateExecutionSupportArtifact').returns({
      done: () => {
        return { fail: () => ({}) };
      },
    });
    const button = exportCsvPane.find(Button).at(0);
    expect(button).to.have.length(1);
    expect(button.children().text()).to.equal('Regenerate');
    button.simulate('click');
    expect(regenerateExecutionSupportArtifact.calledOnce).to.be.true;
  });

  it('should have two table columns, one is sortable ', () => {
    expect(exportCsvPane.find(Table)).to.have.length(1);
    expect(exportCsvPane.find(Table).find('Column').length).to.equal(2);
    const col1 = exportCsvPane.find(Table).find('Column').at(0);
    expect(col1.props().header).to.equal('File name');
    const col2 = exportCsvPane.find(Table).find('Column').at(1);
    expect(col2.props().header).to.equal('Generated on');
    expect(col2.props().sortable).to.equal(true);
  });

  it('should render empty table', () => {
    expect(exportCsvPane.find(Table)).to.have.length(1);
    expect(exportCsvPane.find(Table).first().prop('data').size).to.equal(0);
  });

  it('should render esa table for selected instruction', () => {
    const fetchExecutionSupportArtifacts = sandbox.stub(ExecutionSupportArtifactActions, 'fetchExecutionSupportArtifacts');
    fetchExecutionSupportArtifacts.returns({
      done: (cb) => {
        cb(responseEsa);
        return { fail: () => ({}) };
      }
    });
    const wrapper = mount(<ExportCsvPane
      instructions={Immutable.fromJS(instructions)}
      selectedInstructionType={'sanger_sequence'}
      runId={'r1ieuwr324'}
    />);
    expect(wrapper.find(Table)).to.have.length(1);
    const bodyCell1 = wrapper.find(Table).find('BodyCell').at(1);
    expect(bodyCell1.find('Text').props().data).to.equal('Sanger_file_3.csv');
    const bodyCell2 = wrapper.find(Table).find('BodyCell').at(2);
    expect(bodyCell2.find('Text').props().data).to.equal('12/01/22, 3:50 AM');
  });

  it('should make a API call again when scroll reaches the bottom', () => {
    const fetchExecutionSupportArtifacts = sandbox.stub(ExecutionSupportArtifactActions, 'fetchExecutionSupportArtifacts');
    fetchExecutionSupportArtifacts.returns({
      done: (cb) => {
        cb(responseEsa);
        return { fail: () => ({}) };
      }
    });
    const wrapper = mount(<ExportCsvPane
      instructions={Immutable.fromJS(instructions)}
      selectedInstructionType={'sanger_sequence'}
      runId={'r1ieuwr324'}
    />);
    const targetEvent = {
      target: { scrollTop: 100, scrollHeight: 50, clientHeight: 50 },
    };
    wrapper.find('.export-csv-pane__table').simulate('scroll', targetEvent);
    expect(fetchExecutionSupportArtifacts.calledTwice).to.be.true;
  });

  it('should trigger export button and give notification', () => {
    const fetchExecutionSupportArtifacts = sandbox.stub(ExecutionSupportArtifactActions, 'fetchExecutionSupportArtifacts');
    fetchExecutionSupportArtifacts.returns({
      done: (cb) => {
        cb(responseEsa);
        return { fail: () => ({}) };
      }
    });
    const downloadSelectedEsa = sandbox.stub(NotificationActions, 'createNotification').returns({
      done: () => {
        return { fail: () => ({}) };
      },
    });
    const wrapper = mount(<ExportCsvPane
      instructions={Immutable.fromJS(instructions)}
      selectedInstructionType={'sanger_sequence'}
      runId={'r1ieuwr324'}
    />);
    wrapper.find(Table).props().onSelectRow(null, null, { esa1: true, esa2: true });
    wrapper.update();
    expect(wrapper.find(Table).props().selected).to.deep.equal({ esa1: true, esa2: true });
    wrapper.find(MultiStepModalPane).prop<Function>('beforeNavigateNext')();
    const notification: { text?: string } = downloadSelectedEsa.getCall(0).args[0];
    expect(notification.text).to.equal('Downloading run instruction execution file. Your download should automatically start within seconds. If it does not, restart the download.');
    expect(downloadSelectedEsa.calledOnce).to.be.true;
  });
});
