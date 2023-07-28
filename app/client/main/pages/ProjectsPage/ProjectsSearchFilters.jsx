import React from 'react';
import Immutable from 'immutable';
import classNames  from 'classnames';
import PropTypes   from 'prop-types';
import { SearchField, Popover, Select, Icon, TopFilterBar } from '@transcriptic/amino';
import OrganizationTypeAhead from 'main/pages/InventoryPage/OrganizationFilter';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

import './ProjectsSearchFilters.scss';

class ProjectsSearchFilters extends React.Component {

  onSelectOption(field, value) {
    const { searchOptions, onSearchFilterChange } = this.props;
    let valueToSet = value;

    if (field === 'is_implementation' && value === false) {
      valueToSet = undefined;
    }

    return onSearchFilterChange(searchOptions.set(field, valueToSet));
  }

  render() {
    const { searchOptions } = this.props;

    return (
      <div
        className={classNames(
          'projects-search-filters',
          {
            'projects-search-filters--favorite-active': searchOptions.get('is_starred'),
            'projects-search-filters--implementation-active': searchOptions.get('is_implementation')
          }
        )}
      >
        <TopFilterBar fullWidth={false}>
          <TopFilterBar.Wrapper width={400}>
            <SearchField
              value={searchOptions.get('query')}
              onChange={e => this.onSelectOption('query', e.target.value)}
              reset={() => this.onSelectOption('query', '')}
              searchType="project name, id or run id"
              fullWidth={false}
            />
          </TopFilterBar.Wrapper>
          <TopFilterBar.Wrapper width={120}>
            <Select
              value={searchOptions.get('created_at')}
              onChange={e => this.onSelectOption('created_at', e.target.value)}
              placeholder={'Sort by'}
              options={
                [
                  {
                    value: 'desc',
                    name: 'Newest Project'
                  },
                  {
                    value: 'asc',
                    name: 'Oldest Project'
                  }
                ]
              }
            />
          </TopFilterBar.Wrapper>
          {AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB) && (
            <TopFilterBar.Wrapper width={170}>
              <OrganizationTypeAhead
                searchIcon="fa-thin fa-building"
                organizationSelected={searchOptions.get('customer_organization_id')}
                onOrganizationChange={(orgId) => this.onSelectOption('customer_organization_id', orgId)}
              />
            </TopFilterBar.Wrapper>
          )}
          {!Transcriptic.current_user.system_admin && (
            <TopFilterBar.Wrapper>
              <Popover
                placement="bottom"
                content={searchOptions.get('is_starred') ? 'View all projects' : 'View favorite projects only'}
              >
                <div
                  onClick={() => (this.onSelectOption('is_starred', !searchOptions.get('is_starred')))}
                  className="projects-search-filters__favorite-filter"
                >
                  <Icon
                    className="projects-search-filters__favorite-icon"
                    icon={
                      searchOptions.get('is_starred') ?
                        'fas fa-star' :
                        'far fa-star'
                    }
                    color={
                      searchOptions.get('is_starred') ?
                        'inherit' :
                        'dark'
                    }
                  />
                </div>
              </Popover>
            </TopFilterBar.Wrapper>
          )}
          {AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_IMPLEMENTATION_PROJECTS_IN_LAB) && (
            <TopFilterBar.Wrapper>
              <Popover
                placement="bottom"
                content={searchOptions.get('is_implementation') ? 'Show all projects' : 'Show implementation projects only'}
              >
                <div
                  onClick={() => (this.onSelectOption('is_implementation', !searchOptions.get('is_implementation')))}
                  className="projects-search-filters__implementation-filter"
                >
                  <Icon
                    className="projects-search-filters__implementation-icon"
                    icon={'far fa-eye-slash'}
                    color={
                            searchOptions.get('is_implementation') ?
                              'inherit' :
                              'dark'
                          }
                  />
                </div>
              </Popover>
            </TopFilterBar.Wrapper>
          )}
        </TopFilterBar>
      </div>
    );
  }

}

ProjectsSearchFilters.propTypes = {
  searchOptions: PropTypes.instanceOf(Immutable.Map).isRequired,
  onSearchFilterChange: PropTypes.func.isRequired
};

export default ProjectsSearchFilters;
