import React             from 'react';
import { shallow }       from 'enzyme';
import Immutable         from 'immutable';
import sinon             from 'sinon';
import { expect }          from 'chai';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import labConsumerData from 'main/test/labconsumer/testData.json';
import IntakeKitView      from './IntakeKitsView';

describe('IntakeKitView tests', () => {
  const sandbox = sinon.createSandbox();
  let page;

  const mockLabConsumers = Immutable.fromJS([labConsumerData[0]]);

  beforeEach(() => {
    sandbox.stub(LabConsumerActions, 'loadLabsForCurrentOrg').returns({ done: (cb) => cb() });
    sandbox.stub(LabConsumerStore, 'getAllForCurrentOrg').returns(mockLabConsumers);
  });

  afterEach(() => {
    if (sandbox) { sandbox.restore(); }
    if (page) { page.unmount(); }
  });
  const org = Immutable.Map({
    subdomain: 'transcriptic'
  });
  const intakeKits = Immutable.fromJS([
    {
      admin_processed_at: null,
      bag_count: 8,
      commercial_invoice_url: { url: null, text: 'Invoice' },
      created_at: '2021-03-02T22:46:39.423-08:00',
      easy_post_label_url: { url: 'https://easypost-files.s3-us-west-2.amazonaws.com/…bel/20210303/d1a4c7046cb340588884ea56f0b2d0a7.png', text: 'Label' },
      id: 'ik1ffyqzjpug892',
      lab: { id: 'lb1fdrvmzhe6jt3', type: 'labs', name: 'Menlo Park', operated_by_id: 'org13', address_id: 'addr188rr9ukd7ry' },
      organization: { subdomain: 'transcriptic' },
      organization_id: 'org13'
    }
  ]);

  it('should render without errors', () => {
    page = shallow(<IntakeKitView
      intakeKits={intakeKits}
      org={org}
      history={{}}
    />);
    page.setState({ loading: false });
  });

  it('should set labOperatorName and labAddress on initial mount', () => {
    page = shallow(<IntakeKitView
      intakeKits={intakeKits}
      org={org}
      history={{}}
    />).dive();

    expect(page.state().labOperatorName).to.equal('Strateos');
  });

  it('should have gray as TabLayout background color', () => {
    page = shallow(<IntakeKitView
      intakeKits={intakeKits}
      org={org}
      history={{}}
    />);
    const tabLayout = page.dive().find('TabLayout');

    expect(tabLayout.length).to.equals(1);
    expect(tabLayout.props().theme).to.equals('gray');
  });
});
