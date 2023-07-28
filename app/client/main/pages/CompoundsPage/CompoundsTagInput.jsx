import React               from 'react';
import _                   from 'lodash';
import PropTypes           from 'prop-types';

import { TagInput } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import CompoundAPI  from 'main/api/CompoundAPI';
import ajax         from 'main/util/ajax';
import CompoundTagIcon from './CompoundTagIcon';

class CompoundsTagInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      suggestedLabels: []
    };

    this.suggestSingly = _.debounce(ajax.singly(), 150);
  }

  autocompleteLabel(text, limit = 4) {

    this.suggestSingly((done) => {
      if (!text) {
        this.setState({ suggestedLabels: [] },  done);
        return;
      }

      const organization = SessionStore.getOrg();
      const indexOptions = {
        filter: {
          organization_id: organization && organization.get('id'),
          limit: limit
        },
        q:  text
      };

      CompoundAPI.autocompleteLabel(indexOptions).done((tags) => {

        this.setState({ suggestedLabels: tags
          .filter((tag) => {
            return !this.props.tags.includes(tag.name);
          })
          .map(tag =>
            (
              <div key={tag.name}>
                <CompoundTagIcon
                  privateIcon="far fa-user-tag"
                  publicIcon="/images/public.svg"
                  organizationId={tag.organization_id}
                />
                &nbsp;&nbsp;{tag.name}
              </div>
            ))
        }, done);
      }).fail(() => done());
    });
  }

  render() {
    return (
      <TagInput
        onCreate={val => this.props.onCreate(val)}
        suggestions={this.state.suggestedLabels}
        onChange={(t) => this.autocompleteLabel(t)}
        emptyText={this.props.placeholder}
        dropDown={this.props.dropDown}
      >
        {this.props.tags.map(
          tag => <TagInput.Tag key={tag} onRemove={() => this.props.onRemove(tag)} text={tag} />
        )}
      </TagInput>
    );
  }
}

CompoundsTagInput.defaultProps = {
  placeholder: 'Search by label...'
};

CompoundsTagInput.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
  onRemove: PropTypes.func,
  onCreate: PropTypes.func,
  dropDown: PropTypes.bool,
  placeholder: PropTypes.string
};

export default CompoundsTagInput;
