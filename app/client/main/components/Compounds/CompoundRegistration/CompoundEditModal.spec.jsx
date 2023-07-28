import React                       from 'react';
import { expect }                  from 'chai';
import sinon                       from 'sinon';
import { fromJS }                  from 'immutable';
import CompoundAPI                 from 'main/api/CompoundAPI';
import ModalActions                from 'main/actions/ModalActions';
import { Button, LabeledInput } from '@transcriptic/amino';
import { threadBounce } from 'main/util/TestUtil';
import { SinglePaneModal }   from 'main/components/Modal';

import CompoundEditModal from './CompoundEditModal';
import CompoundEditForm from './CompoundEditForm';

const testCompound = fromJS({
  formula: 'C33H35FN2O5',
  molecular_weight: 558.65,
  exact_molecular_weight: 558.612345,
  organization_id: 'org13',
  created_at: '2019-06-21T16:02:44.543-07:00',
  tpsa: 111.79,
  smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
  name: 'faketest',
  created_by: 'u17e2q4752a4r',
  clogp: 6.31360000000001,
  properties: {},
  labels: [{ name: 'foo', organization_id: 'org13' }, { name: 'bar', organization_id: 'org13' }],
  type: 'compounds',
  id: 'cmpl1d9e6adftu9fy',
  inchi_key: 'XUKUURHRXDUEBC-UHFFFAOYSA-N',
  reference_id: 'myrefid',
  external_system_ids: [{ external_system_id: 'ext4' }],
  flammable: true
});

const libraries = [
  { id: 'gz', attributes: { name: 'Guangzhou Library' } },
  { id: 'tp', attributes: { name: 'Taipei Library' } },
];

describe('CompoundEditModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  function mount() {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} />
    );
  }

  it('CompoundEditModal should mount', () => {
    mount();
  });

  it('CompoundEditModal should open', () => {
    mount();
    ModalActions.open(CompoundEditModal.MODAL_ID);
  });

  it('CompoundEditModal should send correct update', () => {
    mount();

    const update =  sandbox.stub(CompoundAPI, 'update');

    wrapper.setState({ compoundName: 'testingNameUpdate' });
    wrapper.instance().updateCompound();

    expect(update.called).to.equal(true);
    expect(update.lastCall.args[1].name).to.equal('testingNameUpdate');
    expect(update.lastCall.args[1].labels).to.eql(testCompound.get('labels').toJS());
    expect(update.lastCall.args[1].reference_id).to.equal(testCompound.get('reference_id'));
  });

  it('CompoundEditModal should show the libraries', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} canEditLibrary />
    );
    const libraryButton = wrapper.find(CompoundEditForm).dive().find(LabeledInput).findWhere((node) => node.prop('label') === 'Libraries')
      .find(Button);
    expect(libraryButton.dive().text()).to.be.equal('2 linked libraries');
  });

  it('CompoundEditModal should open the drawer when we click on button', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} canEditLibrary />
    );
    expect(wrapper.state('libraryDrawerOpen')).to.be.equal(false);
    const libraryButton = wrapper.find(CompoundEditForm).dive().find(LabeledInput).findWhere((node) => node.prop('label') === 'Libraries')
      .find(Button);
    libraryButton.simulate('click');
    expect(wrapper.state('libraryDrawerOpen')).to.be.equal(true);
  });

  it('CompoundEditModal should not render the drawer if user do not have EDIT_LIBRARY permission', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} />
    );
    expect(wrapper.find(SinglePaneModal).props().hasDrawer).to.be.undefined;

  });

  it('CompoundEditModal should reset the libraries on click on cancel button in drawer', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} canEditLibrary />
    );
    expect(wrapper.state('libraryDrawerOpen')).to.be.false;
    const libraryButton = wrapper.find(CompoundEditForm).dive().find(LabeledInput).findWhere((node) => node.prop('label') === 'Libraries')
      .find(Button);
    libraryButton.simulate('click');
    expect(wrapper.state('libraryDrawerOpen')).to.be.true;
    wrapper.find(SinglePaneModal).props().drawerChildren.props.updateLibrariesSelected(['gz', 'tp']);
    expect(wrapper.state().librariesSelected).to.deep.equal(['gz', 'tp']);
    const footerButtons =  enzyme.shallow(wrapper.find(SinglePaneModal).props().drawerFooterChildren).find(Button);

    footerButtons.at(0).simulate('click');
    expect(wrapper.state().librariesSelected.length).to.equal(0);
    expect(wrapper.state('libraryDrawerOpen')).to.be.false;
  });

  it('CompoundEditModal should reset fields on click on cancel button', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal
        compound={testCompound}
        compoundLabels={testCompound.get('labels').toJS()}
        compoundName={testCompound.get('name')}
        compoundReferenceId={testCompound.get('reference_id')}
        compoundExternalId={testCompound.getIn(['external_system_ids', 0, 'external_system_id'])}
        onChange={() => {}}
        hazardFlags={['flammable']}
      />
    );
    wrapper.setState({
      compoundName: 'Test compound',
      compoundLabels: [{ name: 'label1', organization_id: 'org13' }, { name: 'label2', organization_id: 'org13' }],
      compoundReferenceId: 'ref3',
      compoundExternalId: 'ext2',
      hazardFlags: ['Toxic']
    });
    const footerButtons =  wrapper.find(SinglePaneModal).props().footerRenderer().props.children;
    footerButtons[0].props.onClick();
    expect(wrapper.state().compoundName).to.equal(testCompound.get('name'));
    expect(wrapper.state().compoundLabels).to.deep.equal(testCompound.get('labels').toJS());
    expect(wrapper.state().compoundReferenceId).to.equal(testCompound.get('reference_id'));
    expect(wrapper.state().compoundExternalId).to.equal(testCompound.getIn(['external_system_ids', 0, 'external_system_id']));
    expect(wrapper.state().hazardFlags).to.contain('Flammable');
  });

  it('CompoundEditModal should call corresponding api method for adding and removing libraries on click on Looks Good button', async () => {
    const addLibrarySpy = sandbox.stub(CompoundAPI, 'addLibrariesToCompound').resolves({});
    const removeLibrarySpy = sandbox.stub(CompoundAPI, 'removeLibrariesFromCompound').resolves({});
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} canEditLibrary />
    );
    expect(wrapper.state('libraryDrawerOpen')).to.be.false;
    const libraryButton = wrapper.find(CompoundEditForm).dive().find(LabeledInput).findWhere((node) => node.prop('label') === 'Libraries')
      .find(Button);
    libraryButton.simulate('click');
    expect(wrapper.state('libraryDrawerOpen')).to.be.true;
    wrapper.find(SinglePaneModal).props().drawerChildren.props.updateLibrariesSelected(['gz', 'lib3']);
    expect(wrapper.state().librariesSelected).to.deep.equal(['gz', 'lib3']);
    const footerButtons =  enzyme.shallow(wrapper.find(SinglePaneModal).props().drawerFooterChildren).find(Button);

    footerButtons.at(1).simulate('click');
    const expectedLibrariesToBeAdded = ['lib3'];
    const expectedLibrariesToBeRemoved = ['tp'];
    await threadBounce(2);

    expect(addLibrarySpy.calledOnceWithExactly(expectedLibrariesToBeAdded, testCompound.get('id'))).to.be.true;
    expect(removeLibrarySpy.calledOnceWithExactly(expectedLibrariesToBeRemoved, testCompound.get('id'))).to.be.true;
    expect(wrapper.state('libraryDrawerOpen')).to.be.false;
  });

  it('CompoundEditModal should not show the library field if user do not have permissions', () => {
    wrapper = enzyme.shallow(
      <CompoundEditModal compound={testCompound} libraries={libraries} canEditLibrary={false} />
    );
    const libraryField = wrapper.find(CompoundEditForm).dive().find(LabeledInput).findWhere((node) => node.prop('label') === 'Libraries');
    expect(libraryField.exists()).to.be.false;
  });

  it('CompoundEditModal should clear fields', () => {
    wrapper = enzyme.shallow(<CompoundEditModal compound={testCompound} canEditExternalSystemId />);

    const update =  sandbox.stub(CompoundAPI, 'update');
    wrapper.setState({
      compoundName: '',
      compoundReferenceId: '',
      compoundExternalId: '',
    });
    wrapper.instance().updateCompound();
    expect(update.called).to.equal(true);
    expect(update.lastCall.args[1].name).to.equal('');
    expect(update.lastCall.args[1].external_system_id).to.eql('');
    expect(update.lastCall.args[1].reference_id).to.equal('');
  });

  it('should not send external system id when user is not a scientist', () => {
    mount();
    const update =  sandbox.stub(CompoundAPI, 'update');
    wrapper.instance().updateCompound();

    expect(update.called).to.equal(true);
    expect(update.lastCall.args[1]).to.not.have.property('external_system_id');
  });

  it('should send external system id when user is a scientist', () => {
    wrapper = enzyme.shallow(<CompoundEditModal compound={testCompound} canEditExternalSystemId />);
    const update =  sandbox.stub(CompoundAPI, 'update');
    wrapper.instance().updateCompound();

    expect(update.called).to.equal(true);
    expect(update.lastCall.args[1]).to.have.property('external_system_id');
  });

});
