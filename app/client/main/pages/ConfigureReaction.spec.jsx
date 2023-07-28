import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import { BrowserRouter } from 'react-router-dom';

import { Button, Spinner } from '@transcriptic/amino';

import LaunchRequestAPI from 'main/api/LaunchRequestAPI';
import ProjectStore from 'main/stores/ProjectStore';
import Autocomplete from 'main/components/Autocomplete';
import ConfigureReaction from './ConfigureReaction';

const defaultProps = {
  match: {
    params: {
      launchRequestId: 'lr123'
    }
  }
};

describe('ConfigureReaction', () => {
  it('should render empty without throwing', () => {
    const wrapper = mount(<ConfigureReaction {...defaultProps} />);
    wrapper.unmount();
  });

  it('should render a spinner while fetching the launch request', () => {
    // In this test we want to see that if we have a valid launch request id as a prop
    // then we'll show a spinner as the page loads the launch request

    // Fake the LaunchRequest api to never return
    sinon.stub(LaunchRequestAPI, 'get').callsFake(() => {
      // Fake ajax promise
      return {
        then: () => {}, // wait forever
        fail: () => {}
      };
    });
    const wrapper = mount(<ConfigureReaction {...defaultProps} />);
    expect(wrapper.find(Spinner).length).to.equal(1);

    // cleanup
    wrapper.unmount();
    sinon.restore();
  });

  it('should render the whole page when a launch request and project are found', () => {
    // Fake the LaunchRequest fetch
    const fakeLr = { id: 'lr123', protocol_id: 'pr123' };
    sinon.stub(LaunchRequestAPI, 'get').callsFake(() => {
      // Fake ajax promise
      return {
        then: (cb) => cb({ data: { attributes: fakeLr } }),
        fail: (cb) => cb()
      };
    });

    // Fake the project store
    sinon.stub(ProjectStore, 'findByName').callsFake(() => {
      return Immutable.fromJS({
        id: 'pr123'
      });
    });

    // At this point we should have all data to render the page
    const wrapper = mount(
      <BrowserRouter>
        <ConfigureReaction initialSearch="a" {...defaultProps} />
      </BrowserRouter>
    );

    // The 'Configure' button
    expect(wrapper.find(Button).length).to.equal(1);

    // The project selector
    expect(wrapper.find(Autocomplete).length).to.equal(1);

    // cleanup
    wrapper.unmount();
    sinon.restore();
  });
});
