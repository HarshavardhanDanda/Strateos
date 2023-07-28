import PropTypes from 'prop-types';
import React     from 'react';

import { Tooltip, DateTime } from '@transcriptic/amino';
import Manifest              from 'main/util/Manifest';

// Renders a description and image of a Protocol.
class ProtocolOverview extends React.Component {
  render() {
    const sampleInputNames   = Manifest.sampleInputNames(this.props.manifest.inputs).toJS();
    const data_types         = Manifest.dataTypes(this.props.manifest.preview).toJS();
    const { validation_url } = this.props.manifest;

    const pname =
      this.props.manifest.display_name != undefined
        ? this.props.manifest.display_name
        : this.props.manifest.name;

    return (
      <div className="object-overview-and-details">
        <div className="object-description">
          <h2>
            {pname}
          </h2>
          {this.props.manifest.image_url &&
            (
            <img
              className="manifest-image"
              alt="manifest"
              src={this.props.manifest.image_url}
              style={{ display: 'none' }}
              onLoad={(e) => {
                e.target.width /= 2;
                e.target.style.display = 'inline';
              }}
            />
            )
          }
          <section className="text-description">
            <label htmlFor="description">Description</label>
            <div>
              {this.props.manifest.description}
            </div>
          </section>
        </div>
        <div className="object-summaries">
          {
              (this.props.manifest.categories != undefined
                ? !!this.props.manifest.categories.length
                : undefined)
                &&
                (
                <section>
                  <h4>Categories</h4>
                  <div className="desc">
                    <ul>
                      {this.props.manifest.categories.join(', ')}
                    </ul>
                  </div>
                </section>
                )
          }
          {!!sampleInputNames.length &&
            (
            <section>
              <h4>Samples Required</h4>
              <div className="desc">
                <ul>
                  {sampleInputNames.map(name => <li key={name}> {name} </li>)}
                </ul>
              </div>
            </section>
            )
          }
          {!!data_types.length &&
            (
            <section>
              <h4>Data generated</h4>
              <div className="desc">
                <ul>
                  {data_types.map(name => <li key={name}>{name}</li>)}
                </ul>
              </div>
            </section>
            )
          }
          <section className="protocol-validation">
            <h4>Version History</h4>
            <div className="desc">
              <div>{`Version ${this.props.manifest.version}`}</div>
              <div>{'Published'} <DateTime timestamp={(this.props.manifest.created_at)} /></div>
              {validation_url &&
                (
                <div>
                  <a href={validation_url} target="_blank" rel="noreferrer">
                    Representative Data
                  </a>
                </div>
                )
              }
            </div>
            {validation_url &&
              (
              <div className="validated-icon-container">
                <Tooltip
                  placement="left"
                  title={`A range of experimental parameters have been tested ensuring procedural functionality.
                          See the Representative Data documentation for examples and use cases`}
                >
                  <img alt="validated" src="/images/badges/validated-badge-lg@2x.png" />
                </Tooltip>
              </div>
              )
            }
          </section>
        </div>
      </div>
    );
  }
}

ProtocolOverview.displayName = 'ProtocolOverview';

ProtocolOverview.propTypes = {
  manifest: PropTypes.shape({
    inputs:         PropTypes.object.isRequired,
    categories:     PropTypes.array.isRequired,
    created_at:     PropTypes.string.isRequired,
    description:    PropTypes.string.isRequired,
    display_name:   PropTypes.string,
    image_url:      PropTypes.string,
    name:           PropTypes.string,
    preview:        PropTypes.object.isRequired,
    validation_url: PropTypes.string,
    version:        PropTypes.string.isRequired
  }).isRequired
};

export default ProtocolOverview;
