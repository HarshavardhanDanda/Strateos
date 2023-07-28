import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import Imm from 'immutable';
import sinon from 'sinon';
import { List, Table, Column, Button, TableLayout, EditActionButtons, DateTime } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import BatchAPI from 'main/api/BatchAPI';
import OrganizationStore from 'main/stores/OrganizationStore';
import ReactionStore from 'main/stores/ReactionStore';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import OrganizationActions from 'main/actions/OrganizationActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import CompoundBatches from './CompoundBatches';

describe('Compound Batches', () => {
  let wrapper;
  let mockOrg;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    const org = Imm.Map({
      id: 'test_id',
      name: 'test_name',
      subdomain: 'test_subdomain'
    });
    const reaction = Imm.Map({
      name: 'reaction1'
    });

    mockOrg = sandbox.stub(OrganizationStore, 'getById');
    mockOrg.withArgs('org1cytx5sk6tvss').returns(org);
    sandbox.stub(ReactionStore, 'getById').returns(reaction);
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  const data = [
    {
      samples_created_at: '2022-03-25T00:40:07.263-07:00',
      purity: 62,
      organization_id: 'org1cytx5sk6tvss',
      post_purification_mass_yield_mg: 1.2,
      product_type: 'FINAL_PRODUCT',
      created_at: '2022-03-25T00:40:07.263-07:00',
      compound_link_id: 'cmpl1gg35kkffw7yk',
      reaction_id: 'f61639e8-69b2-4139-b497-6197d0af1d88',
      contextual_custom_properties: [],
      updated_at: '2022-03-25T00:40:07.263-07:00',
      type: 'batches',
      id: 'bat1gurxdp9uv73c'
    }
  ];

  const props = {
    isSearching: false,
    compoundLinkId: 'cmpl1gg35kkffw7yk',
    actions: {
      doSearch: () => { }
    },
    searchPage: 1,
    searchPerPage: '4',
    search: Imm.fromJS({
      query: '',
      num_pages: 1,
      page: 1,
      per_page: 4,
      results: data
    })
  };

  it('should have a Card', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    expect(wrapper.dive().find(List).props().disableCard).to.equal(false);
  });

  it('should make call to org api when batch org does not exists in organization store', () => {
    const org = Imm.Map({
      id: 'org1a',
      name: 'test_name',
      subdomain: 'test_subdomain'
    });

    mockOrg.withArgs('org1a').returns(null);
    const orgAction = sandbox.stub(OrganizationActions, 'loadOrganization').returns(org);
    const data = [
      {
        attributes: {
          samples_created_at: '2022-03-25T00:40:07.263-07:00',
          purity: 62,
          organization_id: 'org1a',
          post_purification_mass_yield_mg: 1.2,
          product_type: 'FINAL_PRODUCT',
          created_at: '2022-03-25T00:40:07.263-07:00',
          compound_link_id: 'cmpl1g8xxnd7vgy3f',
          reaction_id: '385',
          contextual_custom_properties: [],
          updated_at: '2022-03-25T00:40:07.263-07:00'
        },
        type: 'batches',
        id: 'bat1gw4zc5wm99sz'
      }
    ];
    const actions = { doSearch: (_arg1, _arg2, onSucceed) => { onSucceed({ data }); } };
    const search =  Imm.fromJS({
      query: '',
      num_pages: 1,
      page: 1,
      per_page: 4,
      results: data
    });
    wrapper = shallow(<CompoundBatches {...props} search={search} actions={actions}  />).find('PageWithSearchAndListHOC').dive().dive();
    expect(orgAction.called).to.be.true;
    expect(orgAction.args[0][0]).to.equal('org1a');
    const table = wrapper.find(List).dive().find(Table)
      .dive();
    expect(table.find(TableLayout.BodyCell).at(0).dive().find('td')
      .text()).to.equal('bat1gw4zc5wm99sz');
  });

  it('should have Table and Pagination', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    expect(wrapper.dive().find(List).length).to.equal(1);
    expect(wrapper.dive().find(List).props().showPagination).to.equal(true);
  });

  it('should have 6 columns', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const table = wrapper.dive().find(List).dive().find('Table');

    expect(table.find(Column).length).to.equal(6);

    expect(table.find(Column).at(0).props().header).to.equal('Batch ID');
    expect(table.find(Column).at(1).props().header).to.equal('Related Containers');
    expect(table.find(Column).at(2).props().header).to.equal('Reaction');
    expect(table.find(Column).at(3).props().header).to.equal('Purity');
    expect(table.find(Column).at(4).props().header).to.equal('Mass Yield');
    expect(table.find(Column).at(5).props().header).to.equal('Date Created');
  });

  it('columns should be sortable', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const table = wrapper.dive().find(List).dive().find('Table');
    expect(table.find(Column).at(0).props().sortable).to.be.false;
    expect(table.find(Column).at(1).props().sortable).to.be.false;
    expect(table.find(Column).at(2).props().sortable).to.be.false;
    expect(table.find(Column).at(3).props().sortable).to.be.true;
    expect(table.find(Column).at(4).props().sortable).to.be.true;
    expect(table.find(Column).at(5).props().sortable).to.be.true;
  });

  it('should display correct data', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive().dive();
    wrapper.setState({ containerIds: { bat1gurxdp9uv73c: ['testcontainer1', 'testcontainer2'] } });
    const table = wrapper.find(List).dive().find(Table)
      .dive();

    expect(table.find(TableLayout.BodyCell).at(0).dive().find('td')
      .text()).to.equal('bat1gurxdp9uv73c');
    expect(table.find(TableLayout.BodyCell).at(1).dive().find('td')
      .find(Button)
      .dive()
      .text()).contain('2 containers');
    expect(table.find(TableLayout.BodyCell).at(2).dive().find('td')
      .find(Button)
      .dive()
      .text()).to.equal('reaction1');
    expect(table.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('62 %');
    expect(table.find(TableLayout.BodyCell).at(4).dive().find('td')
      .text()).to.equal('1.2 mg');
    expect(table.find(BaseTableTypes.Time).dive().find(DateTime).dive()
      .text()).to.equal('Mar 25, 2022');
  });

  it('should have link to reaction page', () => {
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const table = wrapper.dive().find(List).dive().find(Table)
      .dive();

    expect(table.find(TableLayout.BodyCell).at(2).dive().find('td')
      .find(Button)
      .props().link).to.be.true;
    expect(table.find(TableLayout.BodyCell).at(2).dive().find('td')
      .find(Button)
      .props()
      .to).to.equal('/test_subdomain/reactions/f61639e8-69b2-4139-b497-6197d0af1d88');
  });

  it('should update the purity of the batch', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    const spy = sandbox.stub(BatchAPI, 'update').returns({ done: (cb) => {
      cb({});
      return { fail: () => {} };
    }
    });
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const list =  wrapper.dive().find(List);
    list.prop('onEditRow')({ purity: 62 }, Imm.fromJS({ id: 'bat1gurxdp9uv73c' }));
    expect(spy.args[0][0]).to.deep.include('bat1gurxdp9uv73c',
      { purity: 62 },
      { version: 'v1' });
    expect(spy.calledOnce).to.be.true;
  });

  it('should update the post_purification_mass_yield_mg of the batch', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    const spy = sandbox.stub(BatchAPI, 'update').returns({ done: (cb) => {
      cb({});
      return { fail: () => {} };
    }
    });
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const list =  wrapper.dive().find(List);
    list.prop('onEditRow')({ post_purification_mass_yield_mg: 1.2 },
      Imm.fromJS({ id: 'bat1gurxdp9uv73c' }));
    expect(spy.args[0][0]).to.deep.include('bat1gurxdp9uv73c',
      { post_purification_mass_yield_mg: 1.2 },
      { version: 'v1' });
    expect(spy.calledOnce).to.be.true;
  });

  it('should not show edit option if MANAGE_BATCHES_IN_LAB permission is not provided', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);
    wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    const table = wrapper.dive().find(List).dive().find(Table)
      .dive();
    expect(table.find(EditActionButtons).length).to.equal(0);
  });

  it('should not render CompoundBatchesFilter when we dont have data', () => {
    const wrapper = shallow(<CompoundBatches
      {...props}
      search={Imm.fromJS({
        query: '',
        num_pages: 1,
        page: 1,
        per_page: 4,
        results: []
      })}
    />);
    expect(wrapper.dive().find('CompoundBatchesFilter').length).to.equal(0);
  });

  it('should render CompoundBatchesFilter when we have data', () => {
    const wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive().dive();
    expect(wrapper.dive().find('CompoundBatchesFilter').length).to.equal(1);
  });

  it('should show spinner when results are still being retrieved', () => {
    const wrapper = shallow(<CompoundBatches {...props} isSearching />).find('PageWithSearchAndListHOC').dive();
    expect(wrapper.dive().find('Spinner').length).to.equal(1);
  });

  it('should not show spinner when results are retrieved', () => {
    const wrapper = shallow(<CompoundBatches {...props} />).find('PageWithSearchAndListHOC').dive();
    expect(wrapper.dive().find('Spinner').length).to.equal(0);
  });

  it('should render Zero State and should not render filters when search results are empty', () => {
    const wrapper = shallow(
      <CompoundBatches
        {...props}
        search={Imm.fromJS({
          query: '',
          num_pages: 1,
          page: 1,
          per_page: 4,
          results: []
        })}
      />).find('PageWithSearchAndListHOC').dive();
    expect(wrapper.dive().find('CompoundBatchesFilter').length).to.equal(0);
    const zeroState = wrapper.dive().find('ZeroState');
    expect(zeroState.length).to.equal(1);
    expect(zeroState.props().title).to.eql("This compound isn't linked to any batches yet!");
    expect(zeroState.props().hasBorder).to.be.false;
  });

  it('should call ReactionAPI getReactionsByIds with an array of reaction ids', () => {
    const batchResponse = {
      data: [
        {
          attributes: {
            id: 'b1',
            reaction_id: 'r1'
          }
        },
        {
          attributes: {
            id: 'b2',
            reaction_id: 'r2'
          }
        },
        {
          attributes: {
            id: 'b3',
            reaction_id: 'r3'
          }
        }
      ]
    };

    const actions = { doSearch: (_arg1, _arg2, onSucceed) => { onSucceed(batchResponse); } };
    const getReactionsByIdsStub = sandbox.stub(ReactionAPI, 'getReactionsByIds');
    mount(
      <CompoundBatches
        {...props}
        actions={actions}
        search={Imm.fromJS({
          query: '',
          num_pages: 1,
          page: 1,
          per_page: 4,
          results: []
        })}
      />);

    expect(getReactionsByIdsStub.calledOnce).to.be.true;
    expect(getReactionsByIdsStub.args[0][0]).to.deep
      .equal(batchResponse.data.map(batch => batch.attributes.reaction_id));
  });
});
