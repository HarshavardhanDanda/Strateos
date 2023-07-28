import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { BrowserRouter as Router } from 'react-router-dom';
import ReactionsPage from './index';

describe('Reactions page test', () => {
  let reactions;

  afterEach(() => {
    if (reactions) reactions.unmount();
  });

  it('Check if Page is Present', () => {
    reactions = shallow(
      <Router>
        <ReactionsPage />
      </Router>
    );
    expect(reactions.find('#reactions-app')).to.exist;
  });
});
