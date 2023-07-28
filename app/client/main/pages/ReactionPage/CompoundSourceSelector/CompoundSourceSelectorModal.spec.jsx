import Immutable from 'immutable';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { Button, ButtonGroup, ModalHeader } from '@transcriptic/amino';

import CompoundSourceSelector from 'main/pages/ReactionPage/CompoundSourceSelector';
import CompoundSourceSelectorModal from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceSelectorModal';
import { CompoundSourceSelectorModalState } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import ContainerStore from 'main/stores/ContainerStore';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import MaterialStore from 'main/stores/MaterialStore';
import { getDefaultSearchPerPage } from 'main/util/List';

describe('CompoundSourceSelectorModal', () => {
  const sandbox = sinon.createSandbox();
  let modal;
  const title = 'Available Materials';
  let mockReactionApi;
  const mockContainer = {
    aliquot_count: 1,
    aliquot_search_scores: [],
    container_type_id: 'a1-vial',
    created_at: '2020-11-24T23:53:12.322-08:00',
    id: 'ct1f564252kunec',
    label: 'My A1',
    organization_id: 'org13',
    public_location_description: 'In transit to Transcriptic.',
    shipment_code: 'PVM',
    shipment_id: 'sr1f564253jcst7',
    slot: null,
    status: 'inbound',
    storage_condition: 'cold_80',
    test_mode: false,
    type: 'containers',
    updated_at: '2020-11-24T23:53:12.384-08:00',
    current_mass_mg: null,
    empty_mass_mg: null,
    barcode: 'abcd',
    hazards: ['flammable'],
    container_type_shortname: 'a1-vial'
  };

  afterEach(() => {
    sandbox.restore();
    if (modal) {
      modal.unmount();
    }
  });

  const mockState = {
    isSearching: false,
    selected: [mockContainer.id],
    searchQuery: '',
    searchPage: 1,
    searchPerPage: getDefaultSearchPerPage(),
    searchSource: 'user_inventory'
  };

  beforeEach(() => {
    sandbox.stub(ContainerStore, 'getById')
      .returns(Immutable.Map(container));
    mockReactionApi = sandbox.stub(ReactionAPI, 'updateReactant').returns({
      then: (cb) => {
        cb();
      }
    });
  });

  const container = Immutable.Map(mockContainer);

  it('should have modalheader and title', () => {
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    const singlePaneModal = modal.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal');
    const modalHeader = singlePaneModal.dive().find(ModalHeader);
    expect(modalHeader).to.have.length(1);
    expect(modalHeader.dive().find('TextTitle').dive().dive()
      .find('h2')
      .text()).to.equals(title);
  });

  it('should have footer and Select, Cancel buttons', () => {
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    const singlePaneModal = modal.find('ConnectedSinglePaneModal').dive().dive().find('SinglePaneModal');
    const modalFooter = singlePaneModal.dive().find(ButtonGroup);
    expect(modalFooter).to.have.length(1);
    expect(modalFooter.find(Button).dive().text()).to.equal('Cancel');
    expect(modalFooter.find('span').text()).to.equal('Select');
  });

  it('should have selector to resolve compound', () => {
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    const compoundSourceSelector = modal.find(CompoundSourceSelector);
    expect(compoundSourceSelector).to.have.length(1);
  });

  it('should call update reactant api with correct arguments on clicking select button', () => {
    sandbox.stub(CompoundSourceSelectorModalState, 'get').returns(mockState);
    modal = shallow(<CompoundSourceSelectorModal title={title} reactionId="rct1" reactantId="reactant1" onSourceSelected={() => { }} />);
    modal.props().onAccept();
    expect(mockReactionApi.calledOnce).to.be.true;
    expect(mockReactionApi.args[0][0]).to.equal('rct1');
    expect(mockReactionApi.args[0][1]).to.equal('reactant1');
    expect(mockReactionApi.args[0][2]).to.deep.equal([
      {
        op: 'add',
        path: '/source',
        value: {
          type: 'CONTAINER',
          value: {
            id: mockContainer.id,
            attributes: {
              label: mockContainer.label,
              containerTypeId: mockContainer.container_type_id,
              containerTypeShortname: mockContainer.container_type_shortname
            }
          }
        }
      }]);
  });

  it('should have correct drawer body and footer components', () => {
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    expect(modal.find('ConnectedSinglePaneModal').prop('drawerState')).to.equal(false);
    modal.find(CompoundSourceSelector).prop('onRowClick')(container);
    expect(modal.find('ConnectedSinglePaneModal').prop('drawerState')).to.equal(true);
    const modalDrawerButtons = modal.find('ConnectedSinglePaneModal').prop('drawerFooterChildren').props.children;
    expect(modalDrawerButtons[0].props.children).to.equal('Close');
    const modalDrawer = modal.dive().dive().find('ModalDrawer');
    const inventoryDetails = modalDrawer.dive().find('InventoryDetails');
    expect(inventoryDetails !== undefined).to.equal(true);
  });

  it('should select a row on click of Select button of Details drawer ', () => {
    sandbox.stub(CompoundSourceSelectorModalState, 'get').returns(mockState);
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    modal.find(CompoundSourceSelector).prop('onRowClick')(container);
    const modalDrawerButtons = modal.find('ConnectedSinglePaneModal').prop('drawerFooterChildren').props.children;
    const modalDrawerSelectButton = modalDrawerButtons[1];
    modalDrawerSelectButton.props.onClick();
    const compoundSourceSelector = modal.find(CompoundSourceSelector).dive();
    expect(compoundSourceSelector.prop('selected')[0]).to.equal(container.get('id'));
  });

  it('should call update reactant api with correct eMolecules arguments on clicking select button', () => {
    const eM = {
      smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
      name: '1,3,7-trimethyl-2,3,6,7-tetrahydro-1h-purine-2,6-dione',
      id: '1317_1',
      supplierName: 'InterBioScreen',
      tier: 3,
      estimatedCost: '$0.25/mg',
      pricePoints: [{
        currency: 'USD',
        price: '625',
        quantity: '250',
        units: 'g',
        sku: '327919424'
      }],
      tierText: 'Tier 3, Ships within 4 weeks',
      casNumber: '123-22-21'
    };

    const mockState = {
      isSearching: false,
      selected: [eM.id],
      searchQuery: '',
      searchPage: 1,
      searchPerPage: getDefaultSearchPerPage(),
      searchSource: 'e_molecules',
      eMoleculesData: Immutable.fromJS({ EXACT: { [eM.smiles]: Immutable.fromJS([eM]) } }),
      compound_smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
      eMoleculesSearchType: 'EXACT'
    };
    sandbox.stub(CompoundSourceSelectorModalState, 'get').returns(mockState);
    modal = shallow(<CompoundSourceSelectorModal title={title} reactionId="rct1" reactantId="reactant1" onSourceSelected={() => { }} />);
    modal.props().onAccept();
    expect(mockReactionApi.calledOnce).to.be.true;
    expect(mockReactionApi.args[0][0]).to.equal('rct1');
    expect(mockReactionApi.args[0][1]).to.equal('reactant1');
    expect(mockReactionApi.args[0][2]).to.deep.equal([
      {
        op: 'add',
        path: '/source',
        value: {
          type: 'MATERIAL',
          value: {
            attributes: {
              estimatedCost: eM.estimatedCost,
              vendor: 'eMolecules',
              name: eM.name,
              smiles: eM.smiles,
              supplier: eM.supplierName,
              tier: eM.tierText,
              pricePoints: Immutable.fromJS(eM.pricePoints),
              casNumber: eM.casNumber
            }
          }
        }
      }]);
  });

  it('should call update reactant api when source strateos selected and material choosen', () => {
    const mockMaterialData = {
      vendor: {
        created_at: '2012-06-12T00:14:57.000-07:00',
        name: 'GenScript',
        updated_at: '2021-04-05T08:14:32.234-07:00',
        vendor_has_materials: true,
        id: 'vend1f',
        type: 'vendors'
      },
      created_at: '2022-05-04T01:54:40.994-07:00',
      name: 'BenzoicAcidProvisionable2',
      supplier: {
        created_at: '2021-07-16T14:46:29.347-07:00',
        name: 'Enamine',
        updated_at: '2021-08-06T05:17:01.878-07:00',
        is_preferred: true,
        id: 'sup1fxyfj42uvjzz',
        type: 'suppliers'
      },
      material_components: [
        {
          material_id: 'mat1gz76u2pky58g',
          resource_id: 'rs1fzs98nuw7azd',
          id: 'matc1gz76u2prgwrk',
          type: 'material_components',
          resource: {
            organization_id: 'org13',
            acl: [],
            created_at: '2021-08-01T21:34:49.918-07:00',
            compound: {
              model: {
                organization_id: null,
                created_at: '2019-06-17T17:24:09.559-07:00',
                name: 'Benzoic-acid',
                created_by: 'ad17h37hcyb6uc',
                compound_id: 'd7a041ea-da09-af9a-9af6-383b1175cc15',
                reference_id: 'Benz-798789',
                properties: {},
                deprecated_inchi_key: 'WPYMKLBDIGXBTP-UHFFFAOYSA-N',
                updated_at: '2021-11-25T02:09:10.280-08:00',
                id: 'cmpl1d8yndvdpzpef'
              },
              context: null,
              reload_needed: false,
              changing: false,
              save_needed: false
            },
            name: 'BenzoicAcid',
            properties: {},
            kind: 'ChemicalStructure',
            storage_condition: 'cold_4',
            updated_at: '2021-08-01T21:34:49.918-07:00',
            deleted_at: null,
            type: 'resources',
            id: 'rs1fzs98nuw7azd',
            description: null,
            sensitivities: [],
            design: {}
          }
        }
      ],
      is_private: false,
      url: null,
      total_ordered: 0,
      material_type: 'individual',
      note: null,
      organization: {
        test_account: false,
        default_payment_method_id: 'pm1dffyk3tbmwsw',
        subdomain: 'transcriptic',
        signals_api_key: null,
        owner_id: 'user0605202109',
        created_at: '2014-03-06T20:09:18.712-08:00',
        name: 'Strateos',
        updated_at: '2021-04-21T15:46:50.434-07:00',
        api_key: '25711aecebda3c06695af9a14046c1d6',
        type: 'organizations',
        id: 'org13',
        signals_tenant: null,
        account_manager_id: null
      },
      orderable_materials: [
        {
          price: 27,
          margin: 0.1,
          sku: '656783',
          tier: null,
          id: 'omat1gz76u2pqcqmj',
          type: 'orderable_materials'
        }
      ],
      updated_at: '2022-05-04T01:54:40.994-07:00',
      deleted_at: null,
      type: 'materials',
      id: 'mat1gz76u2pky58g'
    };

    sandbox.stub(MaterialStore, 'getById')
      .withArgs('mat1gz76u2pky58g')
      .returns(Immutable.fromJS(mockMaterialData));

    const mockState = {
      isSearching: false,
      selected: [mockMaterialData.id],
      searchQuery: '',
      searchPage: 1,
      searchPerPage: getDefaultSearchPerPage(),
      searchSource: 'strateos'
    };
    sandbox.stub(CompoundSourceSelectorModalState, 'get').returns(mockState);
    const material = MaterialStore.getById('mat1gz76u2pky58g');
    modal = shallow(<CompoundSourceSelectorModal title={title} reactionId="rct1" reactantId="reactant1" onSourceSelected={() => { }} />);
    modal.props().onAccept();
    expect(mockReactionApi.calledOnce).to.be.true;
    expect(mockReactionApi.args[0][0]).to.equal('rct1');
    expect(mockReactionApi.args[0][1]).to.equal('reactant1');
    expect(mockReactionApi.args[0][2]).to.deep.equal([
      {
        op: 'add',
        path: '/source',
        value: {
          type: 'RESOURCE',
          value: {
            attributes: {
              vendor: material.get('vendor').get('name'),
              supplier: material.get('supplier').get('name'),
              resource: material.getIn(['material_components', 0, 'resource', 'id'])
            }
          }
        }
      }]);
  });

  it('should open container registration drawer after onAddContainerClick is triggered with Setup pane as default', () => {
    modal = shallow(<CompoundSourceSelectorModal  title={title} />);
    modal.find(CompoundSourceSelector).prop('onAddContainerClick')();
    expect(modal.find('ConnectedSinglePaneModal').prop('drawerState')).to.equal(true);
    expect(modal.find('ConnectedSinglePaneModal').prop('drawerTitle')).to.be.equal('Add New Samples');
    expect(modal.find('ConnectedSinglePaneModal').prop('drawerPaneTitles').toJS()).to.be.deep.equal(['SETUP', 'CREATE', 'SUCCESS']);
    const multiPaneDrawer = modal.find('ConnectedSinglePaneModal').dive().find('SinglePaneModal')
      .dive()
      .find('MultiPaneModalDrawer');
    expect(multiPaneDrawer).to.have.length(1);
    const setupPane = multiPaneDrawer.dive().find('SetupPane');
    expect(setupPane).to.have.length(1);
  });

  it('should render the Inventory Details as read-only mode', () => {
    modal = shallow(<CompoundSourceSelectorModal title={title} />);
    modal.find(CompoundSourceSelector).prop('onRowClick')(container);
    const modalDrawer = modal.dive().dive().find('ModalDrawer');
    const inventoryDetails = modalDrawer.dive().find('ConnectedInventoryDetails');
    expect(inventoryDetails.prop('editable')).to.be.false;
    inventoryDetails.prop('disableButton')();
    modal.update();
    expect(modal.state('disabled')).to.equal(true);
  });
});
