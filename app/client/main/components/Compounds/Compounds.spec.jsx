import React from 'react';
import { expect } from 'chai';
import { fromJS } from 'immutable';
import { CompoundDetail, CompoundHeading } from 'main/components/Compounds';
import { Popover, KeyValueList } from '@transcriptic/amino';

const test_compound = fromJS({
  formula: 'C33H35FN2O5',
  molecular_weight: '558.65',
  exact_molecular_weight: '558.612345',
  organization_id: 'org13',
  created_at: '2019-06-21T16:02:44.543-07:00',
  tpsa: '111.79',
  smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CCC(O)CC(O)CC(=O)O',
  name: null, // eslint-disable-line
  created_by: 'u17e2q4752a4r',
  clogp: '6.31360000000001',
  properties: {},
  labels: [{ name: 'foo', organization_id: 'org13' }, { name: 'bar', organization_id: 'org13' }],
  type: 'compounds',
  id: 'cmpl1d9e6adftu9fy',
  inchi_key: 'XUKUURHRXDUEBC-UHFFFAOYSA-N',
  reference_id: 'myrefid',
  external_system_ids: [
    {
      id: 'clextid1gfefkvdqzay2',
      organization_id: 'org1cytx5sk6tvss',
      external_system_id: 'my-compound-external-system-id',
      compound_link_id: 'cmpl1gfefkvdjbbav',
      created_at: '2021-12-03T08:45:19.930-08:00',
      updated_at: '2021-12-03T08:45:19.930-08:00'
    }
  ],
  flammable: true,
  oxidizer: true,
  strong_acid: true
});

const test_user = fromJS({
  id: 'u1d2zk38d3z3qh',
  email: 'dlyon@transcriptic.com',
  created_at: '2019-04-24T17:06:47.584-07:00',
  name: 'David Lyon',
  'two_factor_auth_enabled?': false,
  // eslint-disable-next-line no-null/no-null
  'locked_out?': null,
  // eslint-disable-next-line no-null/no-null
  profile_img_url: null
});

describe('CompoundHeading', () => {
  let wrapper;
  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should mount/unmount without throwing when user is not provided', () => {
    wrapper = enzyme.mount(
      <CompoundHeading compound={test_compound} />
    );
  });

  it('should render without throwing when user is provided', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
  });

  it('should contain id', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
    expect(wrapper.text()).to.have.string(test_compound.get('id'));
  });

  it('should contain reference_id', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
    expect(wrapper.text()).to.have.string(test_compound.get('reference_id'));
  });

  it('should contain external_system_ids', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
    test_compound.get('external_system_ids').toJS().forEach(extid => {
      expect(wrapper.text()).to.have.string(extid.external_system_id);
    });
  });

  it('should contain user name', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
    expect(wrapper.text()).to.have.string(test_user.get('name'));
  });

  it('should contain labels', () => {
    wrapper = enzyme.mount(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );
    test_compound.get('labels').toJS().forEach((label, index) => {
      expect(wrapper.find(Popover).at(2).props().content[index].props.text).equal(label.name);
    });
  });

  it('should contain hazards', () => {
    wrapper = enzyme.shallow(
      <CompoundHeading createdByUser={test_user} compound={test_compound} />
    );

    const hazardsPopoverTags = wrapper.find(KeyValueList).prop('entries').find((e) => e.key === 'HAZARD').value;

    expect(hazardsPopoverTags.props.hazards.length).to.equal(3);
    expect(hazardsPopoverTags.props.hazards[0]).to.equal('flammable');
    expect(hazardsPopoverTags.props.hazards[1]).to.equal('oxidizer');
    expect(hazardsPopoverTags.props.hazards[2]).to.equal('strong_acid');
  });

  it('should contain libraries', () => {
    const libraries = [{
      id: 'lib-id1',
      name: 'lib1',
      organization_id: 'org13'
    },
    {
      id: 'lib-id2',
      name: 'lib2',
      organization_id: 'org13'
    }
    ];
    wrapper = enzyme.shallow(
      <CompoundHeading createdByUser={test_user} compound={test_compound} canViewLibraries libraries={libraries} />
    );
    const libraryPopoverTags = wrapper.find(KeyValueList).prop('entries').find((e) => e.key === 'Library').value;
    expect(libraryPopoverTags.props.libraries.length).to.equal(libraries.length);
  });

  it('should not contain libraries when no permission to view libraries', () => {
    wrapper = enzyme.shallow(
      <CompoundHeading createdByUser={test_user} compound={test_compound} canViewLibraries={false} />
    );
    const libraryPopoverTags = wrapper.find(KeyValueList).prop('entries').find((e) => e.key === 'Library');
    expect(libraryPopoverTags).to.be.undefined;
  });
});

describe('CompoundDetail', () => {
  let cd;
  afterEach(() => {
    cd.unmount();
  });

  it('should render without throwing', () => {
    cd = enzyme.shallow(
      <CompoundDetail compound={test_compound} />
    );
  });

  it('should show molecule by default', () => {
    cd = enzyme.shallow(
      <CompoundDetail compound={test_compound} />
    );
    expect(cd.find('Molecule')).to.have.lengthOf(1);
  });

  it('should not show molecule when disabled', () => {
    cd = enzyme.shallow(
      <CompoundDetail showMolecule={false} compound={test_compound} />
    );
    expect(cd.find('Molecule')).to.have.lengthOf(0);
  });

  it('should not show score when omitted', () => {
    cd = enzyme.shallow(
      <CompoundDetail compound={test_compound} />
    );
    expect(cd.find('.search-score')).to.have.lengthOf(0);
  });

  it('should show score when passed', () => {
    const testScoreVal = 10.2;
    cd = enzyme.shallow(
      <CompoundDetail
        compound={test_compound.set('search_score', testScoreVal)}
      />
    );
    const searchScore = cd.find('.search-score');
    expect(searchScore).to.have.lengthOf(1);
    expect(enzyme.mount(searchScore.get(0)).find('StatusPill').prop('text')).to.contain(testScoreVal);
  });
});
