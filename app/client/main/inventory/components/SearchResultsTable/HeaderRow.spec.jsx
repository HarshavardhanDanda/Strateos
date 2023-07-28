import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import FeatureConstants   from '@strateos/features';
import AcsControls        from 'main/util/AcsControls';
import sinon from 'sinon';
import HeaderRow from 'main/inventory/components/SearchResultsTable/HeaderRow.jsx';

describe('HeaderRow', () => {
  var sandbox = sinon.createSandbox();

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should render without error', () => {
    shallow(
      <HeaderRow />
    );
  });

  it('should have sortable created by column in header', () => {
    const headerRow = shallow(
      <HeaderRow />
    );
    const createdByColumn = headerRow.find('SortableContainerRowHeader').last().dive();
    expect(createdByColumn.hasClass('container-row-spacing__created-by')).to.be.true;
    expect(createdByColumn.text()).to.equals('Created By');
  });
  it('should not have organization column by default in header', () => {
    const headerRow = shallow(
      <HeaderRow />
    );
    const organizationColumn = headerRow.find('SortableContainerRowHeader').at(8);
    expect(organizationColumn).to.not.equals('Organization');
  });
  it('should have organization column in container row card based on permission', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB).returns(true);
    const headerRow = shallow(
      <HeaderRow
        allowedColumns={['organization']}
      />
    );
    const organizationColumn = headerRow.find('SortableContainerRowHeader');
    expect(organizationColumn.props().displayName).to.equals('Organization');
  });
});
