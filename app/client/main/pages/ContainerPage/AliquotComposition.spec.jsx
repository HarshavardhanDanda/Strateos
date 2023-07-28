import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import CompoundStore from 'main/stores/CompoundStore';
import CompoundViewPagination from 'main/components/Compounds/CompoundListView/CompoundViewPagination';
import NotificationActions from 'main/actions/NotificationActions';
import AliquotAPI from 'main/api/AliquotAPI';
import FeatureStore from 'main/stores/FeatureStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { Button, Spinner } from '@transcriptic/amino';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import ModalActions from 'main/actions/ModalActions';
import SessionStore from 'main/stores/SessionStore';
import AliquotComposition from './AliquotComposition';
import AliquotCompoundLinkTable from './AliquotCompoundLinkTable';

const container = Immutable.fromJS({
  organization_id: 'org13',
  lab: {
    id: 'labId',
    name: 'Menlo Park'
  }
});

const links = [
  {
    id: '1',
    aliquot_id: 'aq1',
    compound_link_id: 'cmp1',
    concentration: '0.1',
    solubility_flag: true,
  },
  {
    id: '2',
    aliquot_id: 'aq23',
    compound_link_id: 'cmp2',
    concentration: null,
    solubility_flag: false,
  },
];

const compounds = [
  {
    id: 'cmp1',
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
  {
    id: 'cmp2',
    name: 'cust2',
    clogp: '1.256',
    molecular_weight: 351.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
  {
    id: 'cmp3',
    name: 'cust2',
    clogp: '1.256',
    molecular_weight: 351.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
];

const aliquotAPIResponse = {
  data: {
    id: 'aq1',
    type: 'aliquots',
  },
  included: [
    {
      id: 'cmp1',
      type: 'compounds',
      attributes: compounds[0],
    },
    {
      id: 'cmp2',
      type: 'compounds',
      attributes: compounds[1],
    },
    {
      id: 'rs1',
      type: 'resources',
      attributes: {
        id: 'rs1',
        kind: 'ChemicalStructure',
        compound: {
          model: compounds[2],
        },
      },
    },
    {
      id: '1',
      type: 'aliquot_compound_links',
      attributes: links[0],
    },
    {
      id: '2',
      type: 'aliquot_compound_links',
      attributes: links[1],
    },
  ],
};

const aliquotCompoundLinks = Immutable.fromJS(links);
const resourceCompound = [Immutable.fromJS(compounds[2])];

const props = {
  id: 'aq1',
  aliquotIndex: 'A1',
  container
};

describe('Aliquot Composition', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  let mockAliquotAPIGet;
  beforeEach(() => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.LINK_COMPOUND_RESOURCE).returns(true);
    mockAliquotAPIGet =  sandbox.stub(AliquotAPI, 'get').returns({
      done: (cb) => {
        cb(aliquotAPIResponse);
      },
    });
    sandbox.stub(CompoundStore, 'getByIds').returns(resourceCompound);
    const compoundStoreStub = sandbox.stub(CompoundStore, 'getById');
    compoundStoreStub.withArgs('cmp1').returns(Immutable.fromJS(compounds[0]));
    compoundStoreStub.withArgs('cmp2').returns(Immutable.fromJS(compounds[1]));
  });

  afterEach(() => {
    if (wrapper)wrapper.unmount();
    if (sandbox)sandbox.restore();
  });

  it('should set compound and resource ids from aliquot API response', () => {
    wrapper = shallow(<AliquotComposition {...props} />);

    expect(wrapper.state()).to.deep.include({
      compoundLinks: aliquotCompoundLinks,
      compoundsPerPage: ['cmp1', 'cmp2'],
      resourceCompoundId: ['cmp3'],
      loading: false,
    });
  });

  it('should display linked compounds of the aliquot', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(AliquotCompoundLinkTable).length).to.equal(1);
    expect(wrapper.find(CompoundViewPagination).length).to.equal(1);
  });

  it('should set AliquotCompoundLinkTable props', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('aliquotCompoundLinks').size).to.be.eql(2);
  });

  it('should open link compounds modal when click on button', () => {
    const modalOpenStub = sandbox.stub(ModalActions, 'open').returns({});
    wrapper = mount(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    wrapper.find(AliquotCompoundLinkTable).prop('onLink')();
    wrapper.update();
    expect(modalOpenStub.calledOnce).to.be.true;
    expect(modalOpenStub.args[0][0]).to.equal('SEARCH_COMPOUND_MODAL_ALIQUOT_COMPOSITION');
  });

  it('should not have link action when permission is not given', () => {
    sandbox.restore();
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.LINK_COMPOUND_RESOURCE).returns(false);
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(Button).length).to.equal(0);
  });

  it('should have spinner before compounds fetching', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: true });
    expect(wrapper.find(Spinner).length).to.eql(1);
  });

  it('should update composition on remove action', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    const acl = links[0];
    const spy = sandbox.spy(AliquotComposition.prototype, 'updateComposition');
    sandbox.stub(AliquotComposition.prototype, 'confirmUnlink').returns(true);
    wrapper.find(AliquotCompoundLinkTable).prop('onUnlink')([acl]);
    expect(spy.args[0][0].toJS()).to.deep.equal([links[1]]);
  });

  it('should update composition on onCompoundsSelected action', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    const spy = sandbox.spy(AliquotComposition.prototype, 'updateComposition');
    wrapper.find('CompoundSelectorModal').props().onCompoundsSelected(['cmp1', 'cmp4', 'cmp5']);
    expect(spy.args[0][0].toJS()).to.deep.equal([
      links[0],
      links[1],
      {
        compound_link_id: 'cmp4',
        concentration: null,
        solubility_flag: null,
      },
      {
        compound_link_id: 'cmp5',
        concentration: null,
        solubility_flag: null,
      }
    ]);
  });

  it('should trigger fetch method on componentDidMount', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    const instance = wrapper.instance();
    const spy = sandbox.spy(instance, 'fetch');
    instance.componentDidMount();
    expect(spy.calledOnce).to.be.true;
  });

  it('should not have onRemove prop function in resouce compounds view', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    const compoundListWithPagination = wrapper.find('CompoundListWithPagination').at(0).dive();
    const compoundView = compoundListWithPagination.find('CompoundListView').dive().find('CompoundView')
      .at(0);
    expect(compoundView.prop('onRemove')).to.equal(undefined);
  });

  it('should not have edit action when permission is not given', () => {
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });

    expect(wrapper.find(AliquotCompoundLinkTable).prop('editAction')).to.be.false;
  });

  it('should allow operators & lab managers to edit aliquot compound link core properties', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(true);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('editAction')).to.be.true;
  });

  it('should call edit API on aliquot compound link edit', () => {
    const spy = sandbox.spy(AliquotAPI, 'update');
    const data = Immutable.fromJS({
      aliquot_id: 'aq1',
      compound_link_id: 'cmp1',
      concentration: '0.9',
      solubility_flag: true,
    });
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    wrapper.find(AliquotCompoundLinkTable).prop('onEdit')(data);
    expect(spy.args[0][0]).to.deep.equal('aq1');
    expect(spy.args[0][2]).to.deep.equal({
      relationships: {
        compounds: {
          data: [
            {
              compound_link_id: 'cmp1',
              concentration: '0.9',
              solubility_flag: true,
            },
            {
              compound_link_id: 'cmp2',
              concentration: null,
              solubility_flag: false,
            }
          ]
        }
      },
      version: 'v2'
    });
  });

  it('should allow operators & lab managers to access link compound button', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(true);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(true);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('linkAction')).to.be.true;
  });

  it('should allow operators & lab managers to choose from public compounds and compounds in org in which container belongs to', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(true);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(true);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(CompoundSelectorModal).prop('searchPublicAndPrivateByOrgId')).to.equal(container.get('organization_id'));
  });

  it('should allow operators & lab managers to choose from public compounds when container is stock container (org is null)', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(true);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(true);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    const container = Immutable.fromJS({ organization_id: null,
      barcode: '7283',
      id: 'cont-id',
      lab: {
        id: 'labId',
        name: 'Menlo Park'
      } });

    wrapper = shallow(<AliquotComposition
      {...props}
      {...{ container: container }}
    />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(CompoundSelectorModal).prop('searchByPublicCompounds')).to.be.true;
  });

  it('should not allow other than operators & lab managers to access link compound button', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(false);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.setState({ loading: false });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('linkAction')).to.be.false;
  });

  it('should display notification error on update fail', () => {
    const notificationSpy = sandbox.spy(NotificationActions, 'handleError');
    sandbox.stub(AliquotAPI, 'update').returns({
      done: () => ({ fail: (cb) => cb({ responseText: '' }) })
    });
    wrapper = shallow(<AliquotComposition {...props} />);
    wrapper.find(AliquotCompoundLinkTable).prop('onEdit')(
      Immutable.fromJS({
        aliquot_id: 'aq1',
        compound_link_id: 'cmp1',
        concentration: '0.9',
        solubility_flag: true,
      }));
    expect(notificationSpy.calledOnce).to.be.true;
  });

  it('should not include batches in AliquotAPi get request when user doesnt have any permission to view batches', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB, 'labId').returns(false);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(false);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(false);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
    wrapper = shallow(<AliquotComposition {...props} />);
    expect(mockAliquotAPIGet.calledOnce).to.be.true;
    expect(mockAliquotAPIGet.args[0][1]).to.deep.include(
      { includes: ['compounds',
        'resource',
        'aliquots_compound_links']
      });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('canViewBatches')).to.be.false;
  });

  it('should include batches in AliquotAPi get request when user has permission to view batches', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB, 'labId').returns(false);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(false);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(false);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    expect(mockAliquotAPIGet.calledOnce).to.be.true;
    expect(mockAliquotAPIGet.args[0][1]).to.deep.include(
      { includes: ['compounds',
        'resource',
        'aliquots_compound_links',
        'batches']
      });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('canViewBatches')).to.be.true;
  });

  it('should include batches in AliquotAPi get request when operator has permission to view batches', () => {
    const featureStoreStub = sandbox.stub(FeatureStore, 'hasFeatureInLab');
    featureStoreStub.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB, 'labId').returns(true);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, 'labId').returns(false);
    featureStoreStub.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB, 'labId').returns(false);
    const hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
    wrapper = shallow(<AliquotComposition {...props} />);
    expect(mockAliquotAPIGet.calledOnce).to.be.true;
    expect(mockAliquotAPIGet.args[0][1]).to.deep.include(
      { includes: ['compounds',
        'resource',
        'aliquots_compound_links',
        'batches']
      });
    expect(wrapper.find(AliquotCompoundLinkTable).prop('canViewBatches')).to.be.true;
  });

  it('should be able to register compound if user has REGISTER_PUBLIC_COMPOUND permission', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_PUBLIC_COMPOUND').returns(true);
    wrapper = shallow(<AliquotComposition {...props} />);
    const selectorModal = wrapper.find(CompoundSelectorModal);
    expect(selectorModal.prop('allowCompoundRegistration')).to.be.true;
  });

  it('should be able to register compound user has REGISTER_COMPOUND permission and container belongs to the same org', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_COMPOUND').returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: container.get('organization_id') }));
    wrapper = shallow(<AliquotComposition {...props} />);
    const selectorModal = wrapper.find(CompoundSelectorModal);
    expect(selectorModal.prop('allowCompoundRegistration')).to.be.true;
  });

  it('should not be able to register compound if user has permission and container belongs to a different org', () => {
    sandbox.stub(FeatureStore, 'hasFeature').withArgs('REGISTER_COMPOUND').returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org12' }));
    wrapper = shallow(<AliquotComposition {...props} />);
    expect(wrapper.find(CompoundSelectorModal).prop('allowCompoundRegistration')).to.be.false;
  });
});
