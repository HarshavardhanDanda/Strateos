import React      from 'react';
import PropTypes  from 'prop-types';
import LibraryAPI from 'main/api/LibraryAPI';
import { Tag, Select, LabeledInput } from '@transcriptic/amino';
import _         from 'lodash';

import './LibraryDrawer.scss';

class LibraryDrawer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      libraryOptions: [],
      libraries: this.props.libraries
    };
  }

  componentDidMount() {
    this.fetchLibraries();
    this.props.updateLibrariesSelected(_.map(this.state.libraries, 'id'));
  }

  handleChange(library) {
    const libraryAlreadyExists = _.find(this.state.libraries, (lib) => {
      return lib.id == library.id;
    });

    if (!libraryAlreadyExists) {
      this.addLibrary(library);
    }
  }

  addLibrary(library) {
    this.setState(prevState => ({
      libraries: [...prevState.libraries, library]
    }), () => {
      this.props.updateLibrariesSelected(_.map(this.state.libraries, 'id'));
    });
  }

  removeLibrary(library) {
    const libraries = [...this.state.libraries];
    _.remove(libraries, (lib) => {
      return lib.id == library.id;
    });
    this.setState({ libraries }, () => {
      this.props.updateLibrariesSelected(_.map(this.state.libraries, 'id'));
    });
  }

  fetchLibraries() {
    LibraryAPI.getLibraries()
      .done((response) => {
        const libraryOptions = response.data.map((lib) => ({ value: lib.id, name: lib.attributes.name }));
        this.setState({
          libraryOptions
        });
      });
  }

  render() {
    const { libraries } = this.state;
    return   (
      <div className="row tx-stack">
        <div className="col-md-12 tx-stack__block--md">
          <LabeledInput label="Library Number">
            <Select
              options={this.state.libraryOptions}
              onChange={(e, selectedOption) => {
                const librarySelected = { id: selectedOption.value, name: selectedOption.name };
                this.handleChange(librarySelected);
              }}
              placeholder="Select Library"
              isSearchEnabled
            />
          </LabeledInput>
        </div>
        {libraries.length > 0 ? (
          <div className="col-md-12 tx-stack__block--xs">
            <div className="library-drawer__heading">
              Associated Libraries ({libraries.length})
            </div>
            <div className="library-drawer__wrapper">
              {
              libraries.map(tag => (
                <Tag
                  key={tag.name}
                  text={tag.name}
                  type="secondary"
                  onRemove={() => { this.removeLibrary(tag); }}
                />
              ))
              }
            </div>
          </div>
        ) : (
          <div  className="col-md-12 tx-stack__block--xs">
            0 Libraries Linked
          </div>
        )}
      </div>
    );
  }
}

LibraryDrawer.propTypes = {
  libraries: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateLibrariesSelected: PropTypes.func.isRequired
};

export default LibraryDrawer;
