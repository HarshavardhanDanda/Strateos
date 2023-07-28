import React from 'react';
import { expect } from 'chai';
import { VerticalNavBar } from '@transcriptic/amino';
import { BrowserRouter as Router } from 'react-router-dom';

// This test should be moved to Amino once we have tests in that package.
describe('VerticalNavBar', () => {
  it('should render without throwing', () => {
    return enzyme.shallow(
      <VerticalNavBar
        links={[
          {
            name: 'Item A',
            url: '/foo1'
          },
          {
            name: 'Item B',
            url: '/foo2'
          },
          {
            name: 'Item C',
            url: '/foo3'
          },
          {
            name: 'Item D',
            url: '/foo4'
          },
          {
            name: 'Item E',
            url: '/foo5'
          }
        ]}
      />
    );
  });

  it('should render no items when not provided a list', () => {
    const navBar = enzyme.shallow(
      <VerticalNavBar />
    );

    const children = navBar.find('.vertical-nav-bar__list').children();

    expect(children).to.have.length(0);
  });

  it('should render five items when provided a list of five items', () => {
    const navBar = enzyme.shallow(
      <VerticalNavBar
        links={[
          {
            name: 'Item A',
            url: '#'
          },
          {
            name: 'Item B',
            url: '#'
          },
          {
            name: 'Item C',
            url: '#'
          },
          {
            name: 'Item D',
            url: '#'
          },
          {
            name: 'Item E',
            url: '#'
          }
        ]}
      />
    );

    const children = navBar.find('.vertical-nav-bar__list').children();

    expect(children).to.have.length(5);
  });

  it('should render icons when provided with icons', () => {
    const navBar = enzyme.mount(
      <Router>
        <VerticalNavBar
          links={[
            {
              name: 'Item A',
              icon: 'fa fa-check',
              url: '/foo'
            },
            {
              name: 'Item B',
              icon: 'fa fa-check',
              url: '/bar'
            }
          ]}
        />
      </Router>
    );

    const icons = navBar.find('.vertical-nav-item__icon');
    expect(icons).to.have.length(2);
    navBar.unmount();
  });

  it('should render additional classes on icons when provided', () => {
    const navBar = enzyme.mount(
      <Router>
        <VerticalNavBar
          links={[
            {
              name: 'Item A',
              icon: 'fa fa-check',
              url: '/foo'
            },
            {
              name: 'Item B',
              icon: 'fa fa-check',
              url: '/bar'
            }
          ]}
        />
      </Router>
    );

    const iconsWithClasses = navBar.find('.fa-check');
    expect(iconsWithClasses).to.have.length(2);
    navBar.unmount();
  });
});
