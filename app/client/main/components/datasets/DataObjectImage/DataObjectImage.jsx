import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Banner,
  Button,
  Card,
  Divider
} from '@transcriptic/amino';

import ZoomableDataset      from 'main/components/datasets/ZoomableDataset';
import DataObjectFileHeader from 'main/components/datasets/DataObjectFileHeader';

import './DataObjectImage.scss';

class DataObjectImage extends React.Component {
  static get propTypes() {
    return {
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onShowImageAnyway = this.onShowImageAnyway.bind(this);

    this.state = {
      shouldShowImageAnyway: false
    };
  }

  onShowImageAnyway() {
    this.setState({ shouldShowImageAnyway: true });
  }

  render() {
    const { dataObject }  = this.props;

    const url     = dataObject.get('url');
    const size    = dataObject.get('size');
    const maxSize = 2 ** 20; // 1 mb

    return (
      <Card container>
        <DataObjectFileHeader dataObject={dataObject} />
        <Divider />

        <Choose>
          <When condition={size < maxSize || this.state.shouldShowImageAnyway}>
            <ZoomableDataset>
              <img
                className="data-object-image__img"
                alt={dataObject.get('name')}
                src={url}
              />
            </ZoomableDataset>
          </When>
          <Otherwise>
            <div className="data-object-image__img-not-shown">
              <Banner
                bannerType="info"
                bannerTitle="Image Not Shown"
                bannerMessage="Large images over 1 Mb are not displayed."
              />
              <Button
                icon="fa fa-eye"
                size="small"
                type="primary"
                onClick={this.onShowImageAnyway}
                link
              >
                Show Anyway
              </Button>
            </div>
          </Otherwise>
        </Choose>
      </Card>
    );
  }
}

export default DataObjectImage;
