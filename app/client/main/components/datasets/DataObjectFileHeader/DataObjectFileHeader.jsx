import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Banner,
  Button,
  Divider,
  KeyValueList,
  Popover,
  DateTime
} from '@transcriptic/amino';

import CSVUtil from 'main/util/CSVUtil';
import StringUtil from 'main/util/String';

import './DataObjectFileHeader.scss';

class DataObjectFileHeader extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      csv: PropTypes.string,
      csvName: PropTypes.string,
    };
  }

  render() {
    const { dataObject, csv, csvName } = this.props;

    const id          = dataObject.get('id');
    const contentType = dataObject.get('content_type');
    const createdAt   = dataObject.get('created_at');
    const errors      = dataObject.get('validation_errors');
    const format      = dataObject.get('format');
    const name        = dataObject.get('name');
    const size        = dataObject.get('size'); // bytes
    const url         = dataObject.get('url');

    return (
      <div className="data-object-file-header">
        <div className="data-object-file-header__content">
          <div className="data-object-file-header__title">
            <Popover
              content={<span>{name}</span>}
              placement="top"
              trigger="hover"
              showWhenOverflow
            >
              <h3 className="data-object-file-header__title-name tx-type--heavy">{name}</h3>
            </Popover>
            <p>{contentType || format}</p>
          </div>

          <div className="data-object-file-header__info">
            <KeyValueList
              isHorizontalLayout
              entries={[
                { key: 'id',          value: (<span className="monospace">{id}</span>) },
                { key: 'size',        value: StringUtil.humanFileSize(size) },
                { key: 'created at',  value: <DateTime timestamp={(createdAt)} /> }
              ]}
            />

            <Divider vertical />

            <Button
              to={csv ? null : url}
              icon="fa fa-download"
              size="small"
              type="secondary"
              link
              heavy
              newTab
              tagLink
              onClick={csv ? () => CSVUtil.downloadCSV(csv, csvName, true) : null}
            />
          </div>
        </div>

        <If condition={errors && errors.count()}>
          <div>
            <Banner
              bannerType="error"
              bannerTitle="Errors"
              bannerMessage="There were validation errors"
            />
          </div>
        </If>
      </div>
    );
  }
}

export default DataObjectFileHeader;
