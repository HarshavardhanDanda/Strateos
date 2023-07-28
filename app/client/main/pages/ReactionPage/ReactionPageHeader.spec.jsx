import React from 'react';
import enzyme from 'enzyme';
import Moment from 'moment';
import { Profile, StatusPill, DateTime } from '@transcriptic/amino';
import { expect } from 'chai';
import { PageHeader } from 'main/components/PageLayout';
import ReactionPageHeader from './ReactionPageHeader';

describe('ReactionPageHeader', () => {
  const props = {
    status: 'CREATED',
    user: { name: 'John Doe' },
    timestamp: new Date(),
    materialsResolved: false
  };

  it('should render header information', () => {
    const header = enzyme.shallow(<ReactionPageHeader {...props} />);
    expect(header).to.be.ok;
    expect(status).to.be.a('string');
    expect(header.prop('primaryInfoArea').length).to.equal(4);

    const pageHeader = header.find(PageHeader);
    expect(pageHeader.length).to.equal(1);

    const profile = pageHeader.dive().find(Profile);
    expect(profile.prop('name')).to.equal(props.user.name);

    const label = pageHeader.dive().find(StatusPill);
    expect(label.prop('type')).to.be.a('string');
  });

  it('should display local time', () => {
    const timestamp = '2021-10-02T04:42:00Z';
    const wrapper = enzyme.shallow(
      <DateTime
        key="submission-time-key"
        timestamp={Moment.utc(timestamp).local()}
        format="absolute-format"
      />
    );
    expect(wrapper.find('span').text()).to.deep.equal('Oct 1, 2021');
  });
});
