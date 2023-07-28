import React from 'react';
import enzyme, { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {
  Button,
  Select,
  TextInput,
} from '@transcriptic/amino';
import { threadBounce } from 'main/util/TestUtil';
import BatchAPI from 'main/api/BatchAPI.js';
import LibraryAPI from 'main/api/LibraryAPI';
import ReactionPageConfiguration from './ReactionPageConfiguration';
import ReactionAPI from './ReactionAPI';

enzyme.configure({ adapter: new Adapter() });

describe('ReactionPageConfiguration', () => {
  const setActiveStepIndex = sinon.spy();
  const sandbox = sinon.createSandbox();

  const users = [
    { id: '90xcn34', name: 'Test ox tail tomato soup' },
    { id: '219sd79', name: 'Test citrus potato chips' },
    { id: '98123vy', name: 'ultrasoft tissue box' },
  ];
  const compoundWithCOI = {
    data: {
      attributes: {
        external_system_ids: [{
          organization_id: 'sea salt crema',
          external_system_id: 'interest rate'
        }]
      }
    }
  };

  const batchCCPConfigs = [{
    config_definition: {
      default: '',
      editable: true,
      label: 'Project Id',
      options: [
        { value: '20220225', name: 'GIPR cAMP / AG 384' },
        { value: '20220226', name: 'GIPR cAMP / PAM THIQ 384' },
        { value: '20220227', name: 'GIPR cAMP / L337c BETP 384' },
        { value: '20220228', name: 'GIPR cAMP / L337c BETP 384' },
        { value: '20220229', name: 'GIPR cAMP / L337c BETP 384' },
      ],
      type: 'choice',
      unique: false,
      validation_regexp: ''
    },
    context_type: 'Batch',
    id: 'ccpc1grhget2werv4',
    key: 'project_id',
    label: 'Project id',
    organization_id: 'sea salt crema',
  }];

  const ccp = [{
    id: 'ccp1grhjzxmcht3u',
    context_type: 'Batch',
    context_id: 'bat1grh9pbt38mxm',
    value: '20220225',
    key: 'project_id'
  }];

  const reaction = {
    product_type: 'FINAL_PRODUCT',
    temperature: 'Ambient',
    containerType: ['A1 Vial'],
    solvent: 'DMSO',
    form: 'DMSO',
    concentration: 10,
    compound: compoundWithCOI,
    external_system_id: 'sea salt crema',
    users: users,
    requester: {},
    batchCCPConfigs: Immutable.fromJS(batchCCPConfigs),
    ccp: Immutable.fromJS(ccp),
    products: [{ compound: { linkId: 'winterOlympic' } }],
    libraries: [
      { id: 'gz', attributes: { name: 'Guangzhou Library' } },
      { id: 'tp', attributes: { name: 'Taipei Library' } },
    ]
  };

  const synthesisPrograms = [{ value: 'sp1',   name: 'test_1'  },
    { value: 'sp2',  name: 'test_2' }];

  afterEach(() => {
    sandbox.restore();
  });

  const setReaction = sinon.spy();

  const createReactionPageConfiguration = (setActiveStepIndex, reaction, setReaction, synthesisPrograms = [], props = {}) => {
    return mount(
      <ReactionPageConfiguration
        setActiveStepIndex={setActiveStepIndex}
        reaction={reaction}
        setReaction={setReaction}
        synthesisPrograms={synthesisPrograms}
        {...props}
      />
    );
  };

  const reactionPageConfiguration = createReactionPageConfiguration(
    setActiveStepIndex,
    reaction,
    setReaction
  );

  it('External project name is blank by default', () => {
    const projectName = reactionPageConfiguration.find('TypeAheadInput').at(1).prop('value');
    expect(projectName).to.equal('');
  });

  it('External system id field is read-only if external_system_id is available', () => {
    const externalCOIID = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(5).find(TextInput);
    expect(externalCOIID.prop('disabled')).to.equal(true);
  });

  it('External system id field is editable if external_system_id is not available', async () => {
    const updatedReaction = { ...reaction, external_system_id: '' };
    const setReaction = sinon.spy();
    const event = { target: { value: 'seaweed' } };
    const reactionPageConfig = createReactionPageConfiguration(
      setActiveStepIndex,
      updatedReaction,
      setReaction
    );
    const externalCOIID = reactionPageConfig.find('.reaction-page-configuration__inputs').at(5);
    expect(externalCOIID.find(TextInput).prop('disabled')).to.equal(false);

    reactionPageConfig.find('.reaction-page-configuration__inputs').at(5).find(TextInput).simulate('focus');
    reactionPageConfig.find('.reaction-page-configuration__inputs').at(5).find(TextInput).simulate('change', event);
    await threadBounce(2);

    expect(setReaction.calledWith({
      ...reaction,
      external_system_id: event.target.value
    }));
  });

  it('Product type is final by default', () => {
    const productType = reactionPageConfiguration.find('.reaction-page-configuration__item-group').at(0);
    const defaultType = productType.find('Radio').at(0);
    expect(defaultType.prop('label')).to.equal('Final Product');
    expect(defaultType.find('input').prop('checked')).to.equal(true);
  });

  it('User can choose between final product and intermediate product under product type', async () => {
    sandbox.stub(BatchAPI, 'update').resolves();
    const event = { target: { value: 'INTERMEDIATE_PRODUCT' } };
    const productType = reactionPageConfiguration.find('.reaction-page-configuration__item-group').at(0);
    const options = productType.find('Radio');
    expect(options).have.lengthOf(2);
    expect(options.at(0).text().trim()).to.equal('Final Product');
    expect(options.at(1).text().trim()).to.equal('Intermediate Product');

    reactionPageConfiguration.find('.reaction-page-configuration__item-group').at(0).find('RadioGroup').prop('onChange')(event);
    await threadBounce(2);

    expect(setReaction.calledWith({
      ...reaction,
      productType: event.target.value
    }));
  });

  it('Requester dropdown displays available options in an alphabetical order and requester input field renders selected option', async () => {
    sandbox.stub(ReactionAPI, 'updateProject').resolves();
    const setReaction = sinon.spy();
    const reactionPageConfiguration = createReactionPageConfiguration(
      setActiveStepIndex,
      reaction,
      setReaction
    );

    reactionPageConfiguration.find('TypeAheadInput').at(0).prop('onChange')({ target: { value: 'Test' } });
    reactionPageConfiguration.find('TypeAheadInput').at(0).update();
    const options = reactionPageConfiguration.find('TypeAheadInput').at(0).prop('suggestions');

    expect(options.length).to.equal(2);

    expect(options[0].name).to.equal(users[1].name);
    expect(options[1].name).to.equal(users[0].name);

    const selectedRequester = {
      value: users[1].id,
      name: users[1].name,
    };

    reactionPageConfiguration.find('TypeAheadInput').at(0).prop('onSuggestedSelect')(selectedRequester);
    await threadBounce(2);

    expect(setReaction.calledWith({
      ...reaction,
      requester: selectedRequester
    }));

  });

  it('Storage conditions include Temperature, Solvent, Container Type and Concentration.', () => {
    const storageCondition = reactionPageConfiguration.find('DataTable');
    expect(storageCondition.prop('data').includes('Temperature'));
    expect(storageCondition.prop('data').includes('Solvent'));
    expect(storageCondition.prop('data').includes('Container Type'));
    expect(storageCondition.prop('data').includes('Concentration'));
  });

  it('Next button sets active step index to 1', () => {
    const nextButton = reactionPageConfiguration.find(Button).at(4);
    expect(nextButton.text()).to.equal('Next');
    nextButton.simulate('click');
    expect(setActiveStepIndex.calledOnce).to.equal(true);
    expect(setActiveStepIndex.alwaysCalledWith(1)).to.equal(true);
  });

  it('User can view libraries associated with the product compound', () => {
    const libraries = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(4).find('Tag');
    expect(libraries).to.have.lengthOf(2);
    expect(libraries.at(0).text()).to.equal(reaction.libraries[0].attributes.name);
    expect(libraries.at(1).text()).to.equal(reaction.libraries[1].attributes.name);
  });

  it('User can create a library and associate the product compound with the new library', async () => {
    const newLibrary = { data: { id: 'mv', attributes: { name: 'Mountain View Library' } } };
    sandbox.stub(LibraryAPI, 'createLibrary').returns(newLibrary);
    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(4).find('input');
    input.simulate('input', { target: { value: newLibrary.data.attributes.name } });
    input.simulate('keyup', { key: 'Enter' });
    await threadBounce(2);
    const updatedLibraries = [...reaction.libraries, newLibrary.data];
    expect(setReaction.calledWith({
      ...reaction,
      libraries: updatedLibraries
    }));
  });

  it('User cannot create a library if the library is associated with the product compound', () => {
    const setReaction = sandbox.spy();
    const reactionPageConfiguration = createReactionPageConfiguration(
      setActiveStepIndex,
      reaction,
      setReaction
    );

    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(4).find('input');
    input.simulate('input', { target: { value: reaction.libraries[0].attributes.name } });
    input.simulate('keyup', { key: 'Enter' });
    expect(setReaction.calledOnce).to.equal(false);
  });

  it('User can disassociate the product compound with a library', async () => {
    sandbox.stub(LibraryAPI, 'removeCompoundsFromLibrary').resolves();
    const libraryToRemove = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(4).find('Tag').at(0);
    libraryToRemove.find(Button).simulate('click');
    await threadBounce(2);
    const updatedLibraries = [...reaction.libraries];
    updatedLibraries.splice(0, 1);
    expect(setReaction.calledWith({
      ...reaction,
      libraries: updatedLibraries
    }));
  });

  it('should show synthesis program selector', () => {
    const reactionPageConfiguration = createReactionPageConfiguration(
      setActiveStepIndex,
      reaction,
      setReaction,
      synthesisPrograms
    );
    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(3);
    const label = input.find('label');
    const selectComponent = input.find(Select);

    expect(label.text()).to.equal('Synthesis Program');
    expect(selectComponent.length).to.equal(1);
    expect(selectComponent.props().options).to.deep.equal(synthesisPrograms);
  });

  it('should be disabled if there are no synthesis program', () => {
    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(3);
    const selectComponent = input.find(Select);

    expect(selectComponent.props().disabled).to.be.true;
  });

  it('should have a default value set in synthesis program selector if a default synthesis program value is passed', () => {
    const reactionPageConfiguration = createReactionPageConfiguration(
      setActiveStepIndex,
      reaction,
      setReaction,
      synthesisPrograms,
      { selectedSynthesisProgram: synthesisPrograms[0].value }
    );
    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(3);
    const selectComponent = input.find(Select);

    expect(selectComponent.props().value).to.equal(synthesisPrograms[0].value);
  });

  it('should call onSelectSynthesisProgram prop if synthesis program selection is changed', () => {
    const onSelectSynthesisProgramStub = sandbox.spy();
    const eventData = { target: { value: synthesisPrograms[0].id } };
    const reactionPageConfiguration = createReactionPageConfiguration(
      setActiveStepIndex,
      reaction,
      setReaction,
      synthesisPrograms,
      { onSelectSynthesisProgram: onSelectSynthesisProgramStub }
    );
    const input = reactionPageConfiguration.find('.reaction-page-configuration__inputs').at(3);
    const selectComponent = input.find(Select);
    selectComponent.props().onChange(eventData);

    expect(onSelectSynthesisProgramStub.calledOnce).to.be.true;
    expect(onSelectSynthesisProgramStub.args[0][0]).to.deep.equal(eventData);
  });
});
