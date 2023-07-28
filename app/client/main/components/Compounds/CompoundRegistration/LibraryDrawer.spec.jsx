import { Button, Select, StatusPill, Tag } from '@transcriptic/amino';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import React from 'react';
import LibraryAPI from 'main/api/LibraryAPI';
import _         from 'lodash';
import LibraryDrawer from './LibraryDrawer';

describe('LibraryDrawer', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const updateLibrariesSelectedSpy = sandbox.spy();
  const libraries = [
    { id: 'lib1', name: 'Library_1' },
    { id: 'lib2', name: 'Library_2' },
  ];

  const props = {
    libraries,
    updateLibrariesSelected: updateLibrariesSelectedSpy
  };

  beforeEach(() => {
    sandbox.stub(LibraryAPI, 'getLibraries').returns({ done: (cb) => {
      cb({
        data: [
          {
            id: 'lib1',
            type: 'libraries',
            attributes: {
              name: 'Library_1'
            }
          },
          {
            id: 'lib2',
            type: 'libraries',
            attributes: {
              name: 'Library_2'
            }
          },
          {
            id: 'lib3',
            type: 'libraries',
            attributes: {
              name: 'Library_3'
            }

          }] });
      return { fail: () => {} };
    }
    });
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('Should display the linked libraries', () => {
    wrapper = shallow(<LibraryDrawer {...props} />);
    expect(wrapper.state().libraries.length).to.equal(2);
    libraries.forEach((library, index) => {
      expect(wrapper.find(Tag).at(index).prop('text')).to.equal(library.name);
    });
  });

  it('Should display zero linked libraries when libraries are empty', () => {
    wrapper = shallow(<LibraryDrawer
      updateLibrariesSelected={updateLibrariesSelectedSpy}
      libraries={[]}
    />);
    expect(wrapper.state().libraries.length).to.equal(0);
    expect(wrapper.find('div').at(2).text()).to.equal('0 Libraries Linked');
  });

  it('Should remove tag when click on x icon of that tag', () => {
    wrapper = shallow(<LibraryDrawer {...props} />);
    expect(wrapper.find(Tag).at(0).props().text).to.equal('Library_1');
    const tagCancelButton = wrapper.find(Tag).at(0).dive().find(StatusPill)
      .dive()
      .find(Button);
    tagCancelButton.simulate('click', {
      stopPropagation: () => undefined,
    });
    expect(wrapper.state().libraries.length).to.equal(1);
    expect(wrapper.find(Tag).length).to.equal(1);
    expect(wrapper.find(Tag).props().text).to.equal('Library_2');
    expect(updateLibrariesSelectedSpy.calledWith(_.map(wrapper.state().libraries, 'id'))).to.be.true;
  });

  it('Should be able to search select input', () => {
    wrapper = shallow(<LibraryDrawer {...props} />);
    const selectInput = wrapper.find(Select);
    expect(selectInput.props().isSearchEnabled).to.be.true;
  });

  it('Should be able to see org libraries in select fields suggestions', () => {
    wrapper = shallow(<LibraryDrawer {...props} />);

    const libraryOptions = [
      { name: 'Library_1', value: 'lib1' },
      { name: 'Library_2', value: 'lib2' },
      { name: 'Library_3', value: 'lib3' }];

    expect(wrapper.find(Select).props().options).to.deep.equals(libraryOptions);
  });

  it('Should add an tag when select an option from library select input', () => {
    wrapper = shallow(<LibraryDrawer {...props} />);

    const initialLibraries = [
      { id: 'lib1', name: 'Library_1' },
      { id: 'lib2', name: 'Library_2' }
    ];
    expect(wrapper.state().libraries).to.deep.equal(initialLibraries);
    expect(wrapper.find(Tag).length).to.equal(2);
    initialLibraries.forEach((library, index) => {
      expect(wrapper.find(Tag).at(index).prop('text')).to.equal(library.name);
    });
    const selectInput = wrapper.find(Select);
    const option = { value: 'lib3', name: 'Library_3' };
    selectInput.prop('onChange')({ target: { value: option.value } }, option);

    const updatedLibraries =  [
      { id: 'lib1', name: 'Library_1' },
      { id: 'lib2', name: 'Library_2' },
      { id: 'lib3', name: 'Library_3' }
    ];
    expect(wrapper.state().libraries).to.deep.equal(updatedLibraries);
    expect(wrapper.find(Tag).length).to.equal(3);
    updatedLibraries.forEach((library, index) => {
      expect(wrapper.find(Tag).at(index).prop('text')).to.equal(library.name);
    });
    expect(updateLibrariesSelectedSpy.calledWith(_.map(updatedLibraries, 'id'))).to.be.true;
  });

});
