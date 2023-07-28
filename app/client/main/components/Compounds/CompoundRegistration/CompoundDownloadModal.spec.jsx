import React                       from 'react';
import { expect }                  from 'chai';
import sinon                       from 'sinon';
import ModalActions                from 'main/actions/ModalActions';

import { Checkbox, TextBody } from '@transcriptic/amino';
import CompoundDownloadModal from './CompoundDownloadModal';

describe('CompoundDownloadModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  function mount() {
    wrapper = enzyme.shallow(
      <CompoundDownloadModal text={'Compound download modal'} downloadOption={{ csv: true, sdf: true }} />
    );
  }

  it('CompoundDownloadModal should mount', () => {
    mount();
  });

  it('CompoundDownloadModal should open', () => {
    mount();
    ModalActions.open(CompoundDownloadModal.MODAL_ID);
  });

  it('should have two checkboxes', () => {
    mount();
    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes.length).to.equal(2);
  });

  it('should have checkboxes for different download options', () => {
    mount();
    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes.length).to.equal(2);
    expect(wrapper.find(TextBody)).to.have.length(1);
    expect(checkboxes.at(0).props().label).to.equal('Data Summary');
    expect(checkboxes.at(1).props().label).to.equal('SDF');
  });

  it('should return checked for the sdf download checkbox and unchecked for csv checkbox if download option is sdf', () => {
    wrapper = enzyme.shallow(
      <CompoundDownloadModal text={'Compound download modal'} downloadOption={{ csv: false, sdf: true }} />
    );
    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes.at(0).props().checked).to.equal('unchecked');
    expect(checkboxes.at(1).props().checked).to.equal('checked');
  });

  it('should return checked for the csv download checkbox and unchecked for sdf checkbox if download option is csv', () => {
    wrapper = enzyme.shallow(
      <CompoundDownloadModal text={'Compound download modal'} downloadOption={{ csv: true, sdf: false }} />
    );
    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes.at(0).props().checked).to.equal('checked');
    expect(checkboxes.at(1).props().checked).to.equal('unchecked');
  });

  it('should return checked for both sdf and csv checkboxes if both are selected', () => {
    wrapper = enzyme.shallow(
      <CompoundDownloadModal text={'Compound download modal'} downloadOption={{ csv: true, sdf: true }} />
    );
    const checkboxes = wrapper.find(Checkbox);
    expect(checkboxes.at(0).props().checked).to.equal('checked');
    expect(checkboxes.at(1).props().checked).to.equal('checked');
  });
});
