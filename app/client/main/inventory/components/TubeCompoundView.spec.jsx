import React               from 'react';
import { expect }          from 'chai';
import { mount }           from 'enzyme';
import sinon               from 'sinon';
import Immutable           from 'immutable';
import CompoundAPI         from 'main/api/CompoundAPI';
import SessionStore        from 'main/stores/SessionStore';
import FeatureStore        from 'main/stores/FeatureStore';
import FeatureConstants    from '@strateos/features';
import { Button }          from '@transcriptic/amino';
import ModalActions        from 'main/actions/ModalActions';
import CompoundStore from 'main/stores/CompoundStore';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import TubeCompoundView    from './TubeCompoundView';

describe('TubeCompoundView', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let hasFeatureStub;
  const compounds = [
    {
      name: 'cust1',
      clogp: '1.2543',
      molecular_weight: 350.4,
      exact_molecular_weight: 350.012345,
      formula: 'C12H17N',
      smiles: 'NC1CCC(c2ccccc2)CC1',
      tpsa: '108.05',
      id: 'cmpl1eguccdrdwwsg'
    },
    {
      name: 'cust2',
      id: 'cmpl1eatrpvuzpa5c',
      clogp: '1.256',
      molecular_weight: 351.4,
      exact_molecular_weight: 351.012345,
      formula: 'C16H18N2O5S',
      smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
      tpsa: '108.05'
    }
  ];

  const props = {
    existingCompoundIds: ['cmpl1eatrpvuzpa5c'],
    onError: () => {},
    onCompoundsChange: () => {},
    getLinkedCompoundArray: () => {},
    containerArray: Immutable.Iterable([{ name: 'Tube 1', containerType: 'micro-1.5' }]),
    containerIndex: 0
  };

  function stubPermissionForRegisteringCompound(canRegisterPublicCompound, canRegisterCompound) {
    hasFeatureStub.withArgs(FeatureConstants.REGISTER_COMPOUND).returns(canRegisterCompound);
    hasFeatureStub.withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(canRegisterPublicCompound);
  }

  function createTube() {
    return mount(<TubeCompoundView {...props} />);
  }

  beforeEach(() => {
    Promise.allSettled = () => {};
    sandbox.stub(Promise, 'allSettled').returns({
      then: (cb) => {
        cb();
      }
    });

    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    sandbox.stub(CompoundStore, 'getById')
      .withArgs('cmpl1eguccdrdwwsg')
      .returns(Immutable.fromJS(compounds[0]))
      .withArgs('cmpl1eatrpvuzpa5c')
      .returns(Immutable.fromJS(compounds[1]));
    hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.LINK_COMPOUND_RESOURCE).returns(true);
  });

  const mockRequest = () => {
    sandbox.stub(CompoundAPI, 'get').returns({
      done: () => {
        return {
          fail: () => {
            return { always: () => ({}) };
          }
        };
      }
    });
  };

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should render all compounds', () => {
    const compoundIds = ['cmpl1eatrpvuzpa5c', 'cmpl1eguccdrdwwsg'];
    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => {
        return { fail: () => {} };
      }
    });
    wrapper = mount(<TubeCompoundView {...props} existingCompoundIds={compoundIds} />);
    wrapper.setState({ compounds: compounds, loading: false });
    expect(wrapper.find('Row')).to.have.lengthOf(3);
  });

  it('should execute error on invalid compound id', () => {
    const onError = sandbox.stub();
    sandbox.stub(CompoundAPI, 'index').returns({
      done: () => {
        return { fail: () => {} };
      }
    });
    wrapper = mount(<TubeCompoundView {...props} onError={onError} />);
    wrapper.setState({ compounds: compounds, loading: false });
    expect(onError.calledOnce).to.be.true;
  });

  it('should open modal on link button', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'openWithData').returns({});
    mockRequest();
    wrapper = createTube();
    wrapper.setState({ loading: false });

    const button = wrapper.find(Button).at(0);
    button.simulate('click');
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('SEARCH_COMPOUND_MODAL');
  });

  it('should render the text No linked compounds when no compounds are linked to the tube', () => {
    wrapper = mount(<TubeCompoundView {...props} existingCompoundIds={[]} />);
    wrapper.setState({ loading: false });

    expect(wrapper.find('.tube-compounds__zero-state-text')).to.have.lengthOf(1);
    expect(wrapper.find('.tube-compounds__zero-state-text').text()).to.equal('No linked compounds');
  });

  it('should not render the text No linked compounds when compounds are linked to the tube', () => {
    wrapper = createTube();
    wrapper.setState({ loading: false });

    expect(wrapper.find('.tube-compounds__zero-state-text')).to.have.lengthOf(0);
    expect(wrapper.find('Row')).to.have.length(2);
  });

  it('should render the concentration and solubility flag values when set', () => {
    const compoundIds = ['cmpl1eguccdrdwwsg'];
    wrapper = mount(<TubeCompoundView {...props} existingCompoundIds={compoundIds} />);
    wrapper.setState({ loading: false, selectedIndex: 0 });

    const compounds = wrapper.state().compounds;
    compounds[0] = { id: 'cmpl1eguccdrdwwsg', concentration: '50:millimolar', solubility_flag: 'true' };
    wrapper.setState({ compounds });
    expect(wrapper.find('Row')).to.have.length(2);
    const bodyCells = wrapper.find('Block').find('BodyCell');
    expect(bodyCells.length).to.equal(3);
    expect(bodyCells.at(0).find('Molecule').props().SMILES).to.equal('NC1CCC(c2ccccc2)CC1');
    expect(bodyCells.at(1).text()).to.equal('C12H17N');
    expect(bodyCells.at(2).find('InplaceInput').text()).to.equal('50 mMtrue');
  });

  it('should have the query and search_field for content filter of compound', () => {
    const compoundIds = ['cmpl1eatrpvuzpa5c'];
    const compoundAPISpy = sinon.spy(CompoundAPI, 'index');
    wrapper = createTube();
    wrapper.setState({ loading: false });
    expect(compoundAPISpy.args[0][0].filters.content).to.deep.equal({ query: compoundIds[0], search_field: 'id' });
    compoundAPISpy.restore();
  });

  it('should show only private compounds of the current org and public compounds when linking compounds', () => {
    wrapper = createTube();
    wrapper.setState({ loading: false });
    const compoundSelectorModal = wrapper.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().searchPublicAndPrivateByOrgId).to.equal('org13');
  });

  it('should be able to register compound if user has REGISTER_PUBLIC_COMPOUND permission', () => {
    stubPermissionForRegisteringCompound(true, false);

    wrapper = createTube();
    wrapper.setState({ loading: false });
    const compoundSelectorModal = wrapper.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.true;
  });

  it('should be able to register compound if user has REGISTER_COMPOUND permission', () => {
    stubPermissionForRegisteringCompound(false, true);

    wrapper = createTube();
    wrapper.setState({ loading: false });
    const compoundSelectorModal = wrapper.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.true;
  });

  it('should not be able to register compound if user does not have permission', () => {
    stubPermissionForRegisteringCompound(false, false);

    wrapper = createTube();
    wrapper.setState({ loading: false });
    const compoundSelectorModal = wrapper.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.false;
  });
});
