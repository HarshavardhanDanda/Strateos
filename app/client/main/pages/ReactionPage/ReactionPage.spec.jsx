import React from 'react';
import enzyme from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { ReactionPreview, Page, Spinner, Select } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import ProjectActions from 'main/actions/ProjectActions';
import RunActions from 'main/actions/RunActions';
import CompoundAPI from 'main/api/CompoundAPI.js';
import BatchAPI from 'main/api/BatchAPI.js';
import LibraryAPI from 'main/api/LibraryAPI';
import SynthesisProgramAPI from 'main/api/SynthesisProgramAPI';
import AccessControlActions from 'main/actions/AccessControlActions';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import { thennable, threadBounce } from 'main/util/TestUtil';
import { BrowserRouter } from 'react-router-dom';
import ReactionAPI from './ReactionAPI';
import ReactionPage from './ReactionPage';
import * as ChemicalReactionAPIBadMock from './ChemicalReactionAPIBadMock';
import { reactionWithoutRunCreated } from './ChemicalReactionAPIMock';
import ReactionPageConfiguration from './ReactionPageConfiguration';

// todo: add more tests
describe('Reaction Page', () => {
  const reaction = reactionWithoutRunCreated;
  const sandbox = sinon.createSandbox();
  let synthesisProgramApiStub;
  const synthesisPrograms = [{ id: 'sp1', attributes: { name: 'test_1' } },
    { id: 'sp2', attributes: { name: 'test_2' } }];
  const batch = {
    data: {
      id: 'bat1grh9pbt38mxm',
      type: 'batches',
      attributes: {
        contextual_custom_properties: [
          {
            id: 'ccp1grhjzxmcht3u',
            context_id: 'bat1grh9pbt38mxm',
            context_type: 'Batch',
            key: 'project_id',
            value: '3355'
          }
        ],
        product_type: 'FINAL_PRODUCT'
      },
      relationships: {
        synthesis_program: {
          data: {
            id: 'sp1'
          }
        }
      }
    }
  };

  beforeEach(() => {
    const user = {
      created_at: '2019-08-15T11:28:49.246-07:00',
      email: 'testing@strateos.com',
      id: 'u1dffycuxmnb2n',
      name: 'tester',
      two_factor_auth_enabled: true,
    };
    const compound = {
      data: {
        attributes: {
          external_system_ids: [{
            organization_id: 'sea salt crema',
            external_system_id: 'systemID'
          }],
          contextual_custom_properties: [],
          organization_id: 'sea salt crema'
        }
      }
    };
    const permissions = [
      { id: '09cxmew', userId: '219sd79', contextId: 'sea salt crema' },
      { id: '09wemdf', userId: '90xcn34', contextId: 'sea salt crema' },
    ];
    const users =  [
      { id: '219sd79', name: 'citrus potato chips' },
      { id: '90xcn34', name: 'ultrasoft tissue box' },
    ];

    const orgCCPConfigs = {
      data: [{
        id: 'ccpc1grhget2werv4',
        type: 'contextual_custom_properties_configs',
        attributes: {
          context_type: 'Batch',
          config_definition: {
            default: '',
            editable: true,
            label: 'Project Id',
            type: 'choice',
            unique: false,
            validation_regexp: '',
            options: [
              { value: '3355', name: 'Suzhou Industrial Park Project' },
              { value: '3325', name: 'Guangzhou Intangible Cultural Heritage Safeguarding Project' },
            ]
          },
          key: 'project_id',
        }
      }]
    };
    sandbox.stub(ReactionAPI, 'get').returns(thennable(reactionWithoutRunCreated));
    sandbox.stub(CompoundAPI, 'get').returns(thennable(compound));
    sandbox.stub(LibraryAPI, 'getLibraries').returns({ data: [] });
    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns(thennable(orgCCPConfigs));
    sandbox.stub(AccessControlActions, 'loadPermissions').returns(thennable(permissions));
    sandbox.stub(UserActions, 'loadUsers').returns(thennable(users));
    sandbox.stub(UserActions, 'load').returns(thennable(user));
    sandbox.stub(ProjectActions, 'load').resolves({ name: 'test_project' });
    sandbox.stub(RunActions, 'load').resolves();
    synthesisProgramApiStub = sandbox.stub(SynthesisProgramAPI, 'getSynthesisProgramByOrganization').returns({ data: synthesisPrograms });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should render the reaction preview', () => {
    const limitingReagent = reaction.reactants.filter(reactant => reactant.limiting)[0].compound;

    const nonLimitingReagents = reaction.reactants.filter(reactant => !reactant.limiting);
    const reactionSummary = enzyme.shallow(
      <ReactionPreview
        limitingReagent={limitingReagent}
        nonLimitingReagent={nonLimitingReagents[0].compound}
        additionalReagents={reaction.solvents.map(solvent => solvent.resource.name)}
        reactionTime={reaction.conditions.duration}
        reactionTemperature={reaction.conditions.temperature}
        finalProduct={reaction.products[0].compound}
      />
    );
    expect(reactionSummary).to.be.ok;
    reactionSummary.unmount();
  });

  it('should 404 when the reaction cannot be fetched', (done) => {
    const wrapper = enzyme.mount( // using mount to make useEffect work
      <ReactionPage
        match={{
          params: {
            reactionId: 'foo'
          }
        }}
        ReactionAPI={ChemicalReactionAPIBadMock}
      />
    );
    setTimeout(
      () => {
        wrapper.update();
        const page = wrapper.find(Page);
        expect(page.length).to.equal(1);
        expect(page.props().statusCode).to.equal(404);
        wrapper.unmount();
        done();
      },
      0
    );
  });

  it('should show a spinner if rx service hangs', (done) => {
    const api = {
      get: () => new Promise(() => {})
    };
    const wrapper = enzyme.mount( // using mount to make useEffect work
      <ReactionPage
        match={{
          params: {
            reactionId: 'foo'
          }
        }}
        ReactionAPI={api}
      />
    );
    setTimeout(
      () => { // required to get the useEffect to have completed
        wrapper.update();
        expect(wrapper.find(Spinner).length).to.equal(1);
        wrapper.unmount();
        done();
      },
      0
    );
  });

  // it('Display full progress bar and disable edits when a run is created successfully', async () => {
  //   const wrapper = enzyme.mount(
  //     <BrowserRouter>
  //       <ReactionPage
  //         match={{
  //           params: {
  //             reactionId: reactionWithRunCreated.id
  //           }
  //         }}
  //         ReactionAPI={ReactionAPI}
  //       />
  //     </BrowserRouter>
  //   );
  //   await threadBounce(2);
  //   expect(wrapper.find('PizzaTracker').prop('activeStepIndex')).to.equal(2);
  //   expect(wrapper.find('ReactionPageConfiguration').prop('readOnly')).to.equal(true);
  //   wrapper.unmount();
  // });

  it('should fetch batch relations', async () => {
    const batchApiStub = sandbox.stub(BatchAPI, 'get');
    const wrapper = enzyme.mount(
      <BrowserRouter>
        <ReactionPage
          match={{
            params: {
              reactionId: reactionWithoutRunCreated.id
            }
          }}
        />
      </BrowserRouter>
    );
    // A hackish way to resolve the issue of Pizza Tracker calling set state after
    // playing an animation by then wrapper is unmounted
    const clock = sandbox.useFakeTimers();
    await clock.tickAsync(250);
    expect(batchApiStub.calledOnce).to.be.true;
    expect(batchApiStub.args[0][0]).to.equal(reactionWithoutRunCreated.batchId);
    expect(batchApiStub.args[0][1]).to.deep.equal({ version: 'v1', includes: ['synthesis_program'] });
    wrapper.unmount();
  });

  it('should fetch synthesis programs of the organization', async () => {
    sandbox.stub(BatchAPI, 'get').returns(thennable(batch));
    const wrapper = enzyme.mount(
      <BrowserRouter>
        <ReactionPage
          match={{
            params: {
              reactionId: reactionWithoutRunCreated.id
            }
          }}
        />
      </BrowserRouter>
    );
    // A hackish way to resolve the issue of Pizza Tracker calling set state after
    // playing an animation by then wrapper is unmounted
    const clock = sandbox.useFakeTimers();
    await clock.tickAsync(250);
    expect(synthesisProgramApiStub.calledOnce).to.be.true;
    expect(synthesisProgramApiStub.args[0][0]).to.equal('sea salt crema');
    wrapper.unmount();
  });

  it('should pass down the synthesis programs to the ReactionConfiguration component', async () => {
    sandbox.stub(BatchAPI, 'get').returns(thennable(batch));
    const wrapper = enzyme.mount(
      <BrowserRouter>
        <ReactionPage
          match={{
            params: {
              reactionId: reactionWithoutRunCreated.id
            }
          }}
        />
      </BrowserRouter>
    );
    // A hackish way to resolve the issue of Pizza Tracker calling set state after
    // playing an animation by then wrapper is unmounted
    const clock = sandbox.useFakeTimers();
    await clock.tickAsync(250);
    wrapper.update();
    const selectComponent = wrapper.find(ReactionPageConfiguration).find(Select);
    expect(selectComponent.props().value).to.equal(batch.data.relationships.synthesis_program.data.id);
    expect(selectComponent.props().options).to.deep.equal(synthesisPrograms.map(sp => { return { name: sp.attributes.name, value: sp.id }; }));
    wrapper.unmount();
  });

  it('should set synthesis program if its selected and delete the previous selection', async () => {
    sandbox.stub(BatchAPI, 'get').returns(thennable(batch));
    const removeStub = sandbox.stub(SynthesisProgramAPI, 'removeBatchFromSynthesisProgram');
    const addStub = sandbox.stub(SynthesisProgramAPI, 'addBatchToSynthesisProgram');
    const wrapper = enzyme.mount(
      <BrowserRouter>
        <ReactionPage
          match={{
            params: {
              reactionId: reactionWithoutRunCreated.id
            }
          }}
        />
      </BrowserRouter>
    );
    // A hackish way to resolve the issue of Pizza Tracker calling set state after
    // playing an animation by then wrapper is unmounted
    const clock = sandbox.useFakeTimers();
    await clock.tickAsync(250);
    wrapper.update();
    const selectComponent = wrapper.find(ReactionPageConfiguration).find(Select);
    selectComponent.props().onChange({ target: { value: synthesisPrograms[1].id } });
    await threadBounce(7);
    expect(removeStub.calledOnce).to.be.true;
    expect(removeStub.args[0][0]).to.equal(batch.data.relationships.synthesis_program.data.id);
    expect(removeStub.args[0][1]).to.equal(batch.data.id);
    expect(addStub.calledOnce).to.be.true;
    expect(addStub.args[0][0]).to.equal(synthesisPrograms[1].id);
    expect(addStub.args[0][1]).to.equal(batch.data.id);
    wrapper.unmount();
  });

  it('should not make network call if same synthesis program id is selected that is set already', async () => {
    sandbox.stub(BatchAPI, 'get').returns(thennable(batch));
    const removeStub = sandbox.stub(SynthesisProgramAPI, 'removeBatchFromSynthesisProgram');
    const addStub = sandbox.stub(SynthesisProgramAPI, 'addBatchToSynthesisProgram');
    const wrapper = enzyme.mount(
      <BrowserRouter>
        <ReactionPage
          match={{
            params: {
              reactionId: reactionWithoutRunCreated.id
            }
          }}
        />
      </BrowserRouter>
    );
    // A hackish way to resolve the issue of Pizza Tracker calling set state after
    // playing an animation by then wrapper is unmounted
    const clock = sandbox.useFakeTimers();
    await clock.tickAsync(250);
    wrapper.update();
    const selectComponent = wrapper.find(ReactionPageConfiguration).find(Select);
    expect(selectComponent.props().value).to.equal(batch.data.relationships.synthesis_program.data.id);
    selectComponent.props().onChange({ target: { value: synthesisPrograms[0].id } });
    await threadBounce(7);
    expect(removeStub.called).to.be.false;
    expect(addStub.called).to.be.false;
    wrapper.unmount();
  });
});
