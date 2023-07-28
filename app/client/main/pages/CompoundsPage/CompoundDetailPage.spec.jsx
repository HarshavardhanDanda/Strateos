import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import FeatureConstants from '@strateos/features';

import AcsControls from 'main/util/AcsControls';
import SessionStore from 'main/stores/SessionStore';
import { CompoundEditModal, CompoundDownloadModal } from 'main/components/Compounds';
import CompoundAPI from 'main/api/CompoundAPI';
import ContextualCustomPropertiesConfigActions from 'main/actions/ContextualCustomPropertiesConfigActions';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import { PageLayout } from 'main/components/PageLayout';
import CustomPropertyTable from 'main/pages/ContainerPage/CustomPropertyTable';
import CompoundDetailPageHOC from 'main/pages/CompoundsPage/CompoundDetailPage';
import { CompoundHeading } from 'main/components/Compounds/Compounds';
import LibraryAPI from 'main/api/LibraryAPI';
import { Subtabs } from '@transcriptic/amino';
import properties from './mocks/customProperties.json';
import configs from './mocks/customPropertiesConfigs.json';
import { CompoundsPageActions } from './CompoundsActions';

const customProperties = Immutable.fromJS(properties);

const compoundDetails = {
  id: 'cmp-id',
  name: 'cust1',
  clogp: '1.2543',
  molecular_weight: 350.4,
  formula: 'C16H18N2O5S',
  smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
  tpsa: '108.05',
  created_by: 'cc',
  organization_id: null
};
const privateCompoundDetails = {
  id: 'cmp-id',
  name: 'cust1',
  clogp: '1.2543',
  molecular_weight: 350.4,
  formula: 'C16H18N2O5S',
  smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
  tpsa: '108.05',
  created_by: 'cc',
  organization_id: 'org13'
};

const structurelessDetails = {
  name: 'structureless compound',
  clogp: null,
  inchi: null,
  inchi_key: null,
  exact_molecular_weight: null,
  molecular_weight: null,
  tpsa: null,
  mfcd_number: null,
  cas_number: null,
  formula: null,
  smiles: null,
  created_by: 'cc',
  organization_id: null
};

function getTestComponent(props, context = { context: { router: {} } }) {
  return shallow(<CompoundDetailPageHOC {...props} />, context);
}

describe('CompoundDetailPage', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const compound = Immutable.Map(compoundDetails);
  const structurelessCompound = Immutable.Map(structurelessDetails);
  let ccpcStoreStub;
  const props = {
    match: { params: { compoundId: 'cmp-id' } },
    compound,
    location: {},
    history: { replace: () => {} }
  };

  beforeEach(() => {
    const libraries = {
      data:
        [{ id: 'lib1', attributes: { name: 'Library_1' } },
          { id: 'lib2', attributes: { name: 'Library_2' } }
        ]
    };
    const getLibraries = sandbox.stub(LibraryAPI, 'getLibraries');
    getLibraries.withArgs({ compound_id: 'cmp-id' }).returns({
      done: (cb) => {
        cb(
          libraries
        );
      }
    });

    sandbox.stub(CompoundAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            id: 'cmpl1gunf75u96qb9',
            type: 'compounds',
            attributes: {
              organization_id: 'org13'
            }
          }
        });
      }
    });

    sandbox.stub(ContextualCustomPropertiesConfigActions, 'loadConfig').returns({
      done: (cb) => {
        cb({
          data: [
            {
              id: 'ccpc1gpcwaeqrcuzn',
              type: 'contextual_custom_properties_configs',
              attributes: {
                context_type: 'CompoundLink',
                config_definition: {
                  type: 'string',
                  label: 'Emolecules Id',
                  default: '',
                  validation_regexp: '',
                  editable: true,
                  unique: false
                },
                key: 'compound_link_emolecules_id',
                organization_id: 'org13'
              }
            }
          ]
        });
      }
    });
    ccpcStoreStub = sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig')
      .returns(Immutable.fromJS([]));
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should render with default props', () => {
    wrapper = getTestComponent(props).dive();

    expect(wrapper.instance().props).to.deep.include({
      match: { params: { compoundId: 'cmp-id' } },
      canEditHazards: false
    });
  });

  it('should have editable hazards for admins', () => {
    sandbox.stub(SessionStore, 'isAdmin').returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));

    wrapper = getTestComponent(props).dive();

    expect(wrapper.instance().props.canEditHazards).to.equal(true);
  });

  it('should not be able to see edit option for public compounds', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);

    wrapper = getTestComponent(props).dive();

    const actions = wrapper.find(PageLayout).props().PageHeader.props.actions;
    expect(actions[0].disabled).to.be.true;
  });

  it('should be able to see edit option for private compounds', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.EDIT_COMPOUND).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));

    wrapper = getTestComponent(props).dive();
    wrapper.setProps({ compound: Immutable.Map({ name: 'private compound', organization_id: 'org13' }) });
    const actions = wrapper.find(PageLayout).props().PageHeader.props.actions;
    expect(actions[0].text).to.equal('Edit Compound');
  });

  it('lab users should be able to see edit option for compounds', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));

    wrapper = getTestComponent(props).dive();
    wrapper.setProps({ compound: Immutable.Map({ name: 'private compound', organization_id: 'org13' }) });
    const actions = wrapper.find(PageLayout).props().PageHeader.props.actions;
    expect(actions[0].text).to.equal('Edit Compound');
  });

  it('should be able to see edit option for public compounds with EDIT_LIBRARY permisisiom', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.EDIT_LIBRARY).returns(true);

    wrapper = getTestComponent(props).dive();
    const actions = wrapper.find(PageLayout).props().PageHeader.props.actions;
    expect(actions[0].text).to.equal('Edit Compound');
  });

  it('should be able to see edit option with EDIT_LIBRARY permisisiom', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.EDIT_LIBRARY).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const actions = wrapper.find(PageLayout).props().PageHeader.props.actions;
    expect(actions[0].text).to.equal('Edit Compound');
  });

  it('lab users should be able to edit hazards for compounds', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.COMPOUND_MGMT).returns(true);
    getACS.withArgs(FeatureConstants.MANAGE_COMPOUNDS_IN_LAB).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));

    wrapper = getTestComponent(props).dive();
    const compoundEditModal = wrapper.find(CompoundEditModal);

    expect(compoundEditModal.props().canEditHazards).to.equal(true);
  });

  it('should render MoleculeViewer without error for structureless compound', () => {
    const updatedProps = { ...props, compound: structurelessCompound };
    wrapper = getTestComponent(updatedProps).dive();
    expect(wrapper.find('MoleculeViewer').dive().prop('SMILES')).to.equal(null);
  });

  describe('Custom Property Table', () => {
    it('should render CustomPropertyTable without errors', () => {
      ccpcStoreStub.returns(Immutable.fromJS(configs));
      const props = {
        match: { params: { compoundId: 'cmp1gbfdqv6h5tvx' } },
        compound: Immutable.Map({ compoundDetails }),
        location: {},
        history: { replace: () => {} }
      };
      const propsWithCustomProperties = { ...props, customProperties };

      wrapper = getTestComponent(propsWithCustomProperties).dive();
      expect(wrapper.find(CustomPropertyTable).length).to.equal(1);
    });

    it('should NOT render CustomPropertyTable if there are no custom properties', () => {
      wrapper = getTestComponent(props).dive();
      expect(wrapper.find(CustomPropertyTable).length).to.equal(0);
    });

    it('should not error on getCustomPropertyConfigs if no compounds are present', () => {
      const props = {
        match: { params: { compoundId: 'cmp-id' } },
        compound: Immutable.Map(),
        location: {},
        history: { replace: () => {} }
      };
      wrapper = getTestComponent(props).dive();
      expect(wrapper.instance().getCustomPropertyConfigs(undefined)).to.be.undefined;
    });

    it('should render Compound Inventory and Batches Tabs', () => {
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
      getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
      const updatedProps = { ...props, showInventory: true };
      wrapper = getTestComponent(updatedProps).dive();
      expect(wrapper.find(Subtabs).dive().find('span').at(0)
        .children()
        .text()).to.equal('Compound Inventory');
      expect(wrapper.find(Subtabs).dive().find('span').at(1)
        .children()
        .text()).to.equal('Batches');
    });

    it('should render only Batches Tab if showInventory prop is false', () => {
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(true);
      getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
      const updatedProps = { ...props, showInventory: false };
      wrapper = getTestComponent(updatedProps).dive();
      expect(wrapper.find(Subtabs).dive().find('span')
        .text()).to.equal('Batches');
    });

    it('should not render Batches Tab if permissons are not provided', () => {
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
      getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
      const updatedProps = { ...props, showInventory: true };
      wrapper = getTestComponent(updatedProps).dive();
      expect(wrapper.find(Subtabs).dive().find('span')
        .text()).to.equal('Compound Inventory');
    });

    it('should not render  Compound Inventory and Batches Tabs if showInventory is false and permissions not provided', () => {
      const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
      getACS.withArgs(FeatureConstants.VIEW_BATCHES).returns(false);
      getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
      const updatedProps = { ...props, showInventory: false };
      wrapper = getTestComponent(updatedProps).dive();
      expect(wrapper.find(Subtabs)).to.have.length(0);
    });
  });

  it('should not show libraries to user without view libraries permission', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = getTestComponent(props).dive();
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(false);

  });

  it('should show libraries to the user with view libraries permission', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(true);
    expect(compoundHeading.props().libraries.length).to.equal(2);
  });

  it('should not show libraries if compound does not belong to logged in org', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org1' }));
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(false);

  });

  it('should show libraries incase of public compound', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = getTestComponent(props).dive();
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(true);
    expect(compoundHeading.props().libraries.length).to.equal(2);
  });

  it('should not edit libraries if user is not having edit library permission', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.EDIT_LIBRARY).returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = getTestComponent(props).dive();
    const compoundHeading = wrapper.find(CompoundEditModal);
    expect(compoundHeading.props().canEditLibrary).to.equal(false);
  });

  it('should edit libraries when user is having edit library permission', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.EDIT_LIBRARY).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const compoundEditModal = wrapper.find(CompoundEditModal);
    expect(compoundEditModal.props().canEditLibrary).to.equal(true);
  });

  it('should edit libraries incase of public compound', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.EDIT_LIBRARY).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = getTestComponent(props).dive();
    const compoundEditModal = wrapper.find(CompoundEditModal);
    expect(compoundEditModal.props().canEditLibrary).to.equal(true);
  });

  it('should not edit libraries if compound does not belong to logged in org', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.EDIT_LIBRARY).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org1' }));
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const compoundEditModal = wrapper.find(CompoundEditModal);
    expect(compoundEditModal.props().canEditLibrary).to.equal(false);
  });

  it('should have CompoundDownloadModal', () => {
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const compoundEditModal = wrapper.find(CompoundDownloadModal);
    expect(compoundEditModal.length).to.equal(1);
  });

  it('should call downloadCompounds method in CompoundActions when download option is clicked in modal', () => {
    const downloadCompounds = sandbox.stub(CompoundsPageActions, 'downloadCompounds');
    const updatedProps = { ...props, compound: Immutable.Map(privateCompoundDetails) };
    wrapper = getTestComponent(updatedProps).dive();
    const instance = wrapper.instance();
    instance.setState({ downloadOption: {
      csv: true,
      sdf: true
    } });
    instance.onModalDownloadClicked();
    expect(downloadCompounds.calledOnce).to.be.true;
    expect(downloadCompounds.calledWithExactly(true, true, ['cmp-id'])).to.be.true;
  });
});
