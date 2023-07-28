import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Card, Divider, KeyValueList } from '@transcriptic/amino';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';

import './DataObjectLcms.scss';

class DataObjectLcms extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data: PropTypes.object.isRequired
    };
  }

  render() {
    return (
      <Card container>
        <div className="data-object-lcms">
          <DataObjectFileHeader dataObject={this.props.dataObject} />
          <div className="data-object-lcms--body">
            <Divider />
            <KeyValueList
              isHorizontalLayout
              singleLine
              entries={[
                { key: 'Sample ID', value: this.props.data.sample_id, disableFormatKey: true },
                { key: 'Method name',  value: this.props.data.method_name, disableFormatKey: true }
              ]}
            />
            {this.props.lcmsComponent}
          </div>
        </div>
      </Card>
    );
  }
}

export default DataObjectLcms;
