import React                       from 'react';
import { expect }                  from 'chai';
import sinon                       from 'sinon';
import { DrawPane, SpecifyPane }   from 'main/components/Compounds/CompoundRegistration';
import Immutable                   from 'immutable';
import SessionStore                from 'main/stores/SessionStore';
import CompoundAPI                 from 'main/api/CompoundAPI';
import CompoundStore               from 'main/stores/CompoundStore';
import UserStore                   from 'main/stores/UserStore';
import Urls                        from 'main/util/urls';

describe('CompoundRegistration', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('DrawPane should mount', () => {
    wrapper = enzyme.shallow(
      <DrawPane
        setCompound={() => {}}
      />
    );
  });

  it('DrawPane should call CompoundAPI.get summarize (dry-run)', async () => {
    wrapper = enzyme.shallow(
      <DrawPane
        setCompound={() => {}}
      />
    );

    wrapper.setState({ smilesInput: 'CCCNCCC' });
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));

    const create =  sandbox.stub(CompoundAPI, 'create');
    try {
      await wrapper.instance().onNext(() => {});
    } catch (e) {
      // catch the failed network calls and such
    }

    expect(create.called).to.equal(true);
    expect(create.getCall(0).args[0].actions).to.have.property('dry_run', true);
  });

  it('DrawPane should call CompoundAPI.get summarize the public compound (dry-run)', async () => {
    wrapper = enzyme.shallow(
      <DrawPane
        setCompound={() => {}}
        isPublicCompound
      />
    );

    wrapper.setState({ smilesInput: 'CCCNCCC' });

    const create =  sandbox.stub(CompoundAPI, 'createPublicCompound');
    try {
      await wrapper.instance().onNext(() => {});
    } catch (e) {
      // catch the failed network calls and such
    }

    expect(create.called).to.equal(true);
    expect(create.getCall(0).args[0].actions).to.have.property('dry_run', true);
  });

  it('DrawPane should have the public compound toggle', () => {
    const onTogglePublicCompound = sinon.spy();
    wrapper = enzyme.shallow(
      <DrawPane
        setCompound={() => {}}
        onTogglePublicCompound={onTogglePublicCompound}
        isPublicCompound
      />
    );

    const toggle = wrapper.find('Toggle');
    expect(toggle).to.have.lengthOf(1);
    toggle.dive().simulate('change');
    expect(onTogglePublicCompound.calledOnce).to.be.true;
  });

  it('DrawPane should not have the public compound toggle', () => {
    wrapper = enzyme.shallow(
      <DrawPane
        setCompound={() => {}}
      />
    );

    const toggle = wrapper.find('Toggle');
    expect(toggle).to.have.lengthOf(0);
  });

  it('SpecifyPane should mount', () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ created_by: 'fake_user' }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({ name: 'Users Name' }));

    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'smiles'}
      />
    );
  });

  it('SpecifyPane should create with SMILES when SMILES source provided and redirect', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ smiles: 'CCNCC' }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'smiles'}
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    const create =  sandbox.stub(CompoundAPI, 'create').returns({ data: { id: 'fake_compound' } });

    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.compound).to.have.property('smiles', 'CCNCC');
    expect(redirect.getCall(0).args[0]).to.equal(Urls.compound('fake_compound'));
  });

  it('SpecifyPane should create public compound with SMILES when SMILES source provided and redirect', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ smiles: 'CCNCC' }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'smiles'}
        isPublicCompound
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    const create =  sandbox.stub(CompoundAPI, 'createPublicCompound').returns({ data: { id: 'fake_compound' } });

    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.compound).to.have.property('smiles', 'CCNCC');
    expect(redirect.getCall(0).args[0]).to.equal(Urls.compound('fake_compound'));
  });

  it('SpecifyPane should create with SDF when SDF source provided and redirect', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ sdf: 'fake_sdf' }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'sdf'}
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    const create =  sandbox.stub(CompoundAPI, 'create').returns({ data: { id: 'fake_compound' } });
    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.compound).to.have.property('sdf', 'fake_sdf');
    expect(redirect.getCall(0).args[0]).to.equal(Urls.compound('fake_compound'));
  });

  it('SpecifyPane should create public compound with SDF when SDF source provided and redirect', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ sdf: 'fake_sdf' }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'sdf'}
        isPublicCompound
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    const create =  sandbox.stub(CompoundAPI, 'createPublicCompound').returns({ data: { id: 'fake_compound' } });
    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.compound).to.have.property('sdf', 'fake_sdf');
    expect(redirect.getCall(0).args[0]).to.equal(Urls.compound('fake_compound'));
  });

  it('SpecifyPane should save with mutated labels', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ smiles: 'CCNCC',
      labels: [{ name: 'foo', organization_id: 'org13' }, { name: 'bar', organization_id: 'org13' }] }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'smiles'}
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    specifyPane.addLabel({ name: 'myOtherLabel', organization_id: 'org13' });
    specifyPane.removeLabel({ name: 'foo', organization_id: 'org13' });
    specifyPane.addLabel({ name: 'anotherLabel', organization_id: 'org13' });

    const create =  sandbox.stub(CompoundAPI, 'create').returns({ data: { id: 'fake_compound' } });
    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.labels.map(label => label.name))
      .to.have.members(['myOtherLabel', 'anotherLabel']);
  });

  it('SpecifyPane should save the public compound with mutated labels', async () => {
    sandbox.stub(CompoundStore, 'getById').returns(Immutable.fromJS({ smiles: 'CCNCC',
      labels: [{ name: 'foo', organization_id: null }, { name: 'bar', organization_id: null }] }));
    sandbox.stub(UserStore, 'getById').returns(Immutable.fromJS({}));

    const redirect = sandbox.spy();
    wrapper = enzyme.shallow(
      <SpecifyPane
        compoundId={'fake_compound'}
        compoundExists={false}
        compoundSource={'smiles'}
        isPublicCompound
      />,
      { context: { router: { history: { push: redirect } } } }
    ).dive();
    const specifyPane = wrapper.instance();

    specifyPane.addLabel({ name: 'myOtherLabel', organization_id: null });
    specifyPane.removeLabel({ name: 'foo', organization_id: null });
    specifyPane.addLabel({ name: 'anotherLabel', organization_id: null });

    const create =  sandbox.stub(CompoundAPI, 'createPublicCompound').returns({ data: { id: 'fake_compound' } });
    await specifyPane.saveNewCompound(() => {});

    expect(create.getCall(0).args[0].attributes.labels.map(label => label.name))
      .to.have.members(['myOtherLabel', 'anotherLabel']);
  });
});
