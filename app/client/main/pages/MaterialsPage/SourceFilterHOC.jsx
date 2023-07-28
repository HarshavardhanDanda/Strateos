import React from 'react';
import { SearchFilter } from '@transcriptic/amino';

const SourceFilterHoc = (Wrapper) => {
  class SourceFilter extends React.Component {
    constructor(props) {
      super(props);
      this.renderSource = this.renderSource.bind(this);
    }

    renderSource(onSelectOption, currentSelection) {
      return (
        <SearchFilter
          id="source"
          title="Source"
          options={[
            {
              queryTerm: 'strateos',
              display: 'Strateos'
            },
            {
              queryTerm: 'emolecules',
              display: 'eMolecules'
            }
          ]}
          currentSelection={currentSelection}
          onSelectOption={onSelectOption}
        />
      );
    }

    render() {
      return (
        <Wrapper
          renderSource={this.renderSource}
          {...this.props}
        />
      );
    }
  }
  return SourceFilter;
};

export default SourceFilterHoc;
