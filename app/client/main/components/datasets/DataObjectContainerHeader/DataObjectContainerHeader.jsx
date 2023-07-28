import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import {
  Banner,
  Button,
  Divider,
  KeyValueList
} from '@transcriptic/amino';

import Urls from 'main/util/urls';

import './DataObjectContainerHeader.scss';

class DataObjectContainerHeader extends React.Component {
  static get propTypes() {
    return {
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      valueTitle: PropTypes.string,
      value: PropTypes.string
    };
  }

  render() {
    const { container, dataObject, value, valueTitle } = this.props;

    const containerType = container.get('container_type');

    const label   = container.get('label');
    const id      = container.get('id');
    const barcode = container.get('barcode');
    const ctypeId = containerType.get('id');
    const vendor  = containerType.get('vendor');
    const catNo   = containerType.get('catalog_number');

    const name   = dataObject.get('name');
    const errors = dataObject.get('validation_errors');
    const url    = dataObject.get('url');

    return (
      <div className="data-object-container-header">
        <div className="data-object-container-header__content">
          <div className="data-object-container-header__title">
            <h3 className="data-object-container-header__title-name tx-type--heavy">{label || name}</h3>
            <p>{name}</p>
          </div>

          <div className="data-object-container-header__info">
            <If condition={value != undefined}>
              <KeyValueList
                isHorizontalLayout
                entries={[
                  { key: valueTitle != undefined ? valueTitle : 'value', value: value }
                ]}
              />
              <Divider vertical />
            </If>

            <KeyValueList
              isHorizontalLayout
              entries={[
                {
                  key: 'id',
                  value: (
                    <Link to={Urls.container(id)}>
                      {id}
                    </Link>
                  )
                },
                {
                  key: 'barcode',
                  value: barcode || '-'
                },
                {
                  key: 'type',
                  value: ctypeId
                },
                {
                  key: 'vendor',
                  value: vendor
                },
                {
                  key: 'catalog no.',
                  value: catNo || '-'
                }
              ]}
            />

            <Divider vertical />

            <Button
              to={url}
              icon="fa fa-download"
              size="small"
              type="secondary"
              link
              heavy
              newTab
              tagLink
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

export default DataObjectContainerHeader;
