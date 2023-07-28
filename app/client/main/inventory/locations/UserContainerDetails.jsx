import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import AliquotAPI     from 'main/api/AliquotAPI';
import ContainerAPI from 'main/api/ContainerAPI';
import AliquotActions from 'main/actions/AliquotActions';
import { DateSelector, DateTime } from '@transcriptic/amino';
import { SearchChoosingProperty } from 'main/components/properties';
import EditableProperty from 'main/components/EditableProperty';
import AliquotStore                                 from 'main/stores/AliquotStore';
import Urls                                         from 'main/util/urls';
import HazardTag from 'main/components/Hazards/HazardTag';

import ContainerTypeQueryEngine from 'main/inventory/locations/search/ContainerTypeQueryEngine';

class UserContainerDetail extends React.Component {

  static get propTypes() {
    return {
      container: PropTypes.instanceOf(Immutable.Map).isRequired,
      onContainerEdited: PropTypes.func
    };
  }

  componentWillMount() {
    this.loadAliquot();
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.container.get('id') !== this.props.container.get('id')) {
      this.loadAliquot();
    }
  }

  loadAliquot() {
    const flags = {
      unknown: false,
      flammable: false,
      oxidizer: false,
      strong_acid: false,
      water_reactive_nucleophile: false,
      water_reactive_electrophile: false,
      general: false,
      peroxide_former: false,
      strong_base: false
    };

    AliquotAPI.getAllByContainerId(this.props.container.get('id'), { includes: ['compounds'] })
      .done(resp => {
        resp.forEach(r => {
          (r.included || []).forEach(c => {
            const attributes = c.attributes;
            flags.unknown = flags.unknown || !!attributes.unknown;
            flags.flammable = flags.flammable || !!attributes.flammable;
            flags.oxidizer = flags.oxidizer || !!attributes.oxidizer;
            flags.strong_acid = flags.strong_acid || !!attributes.strong_acid;
            flags.water_reactive_nucleophile = flags.water_reactive_nucleophile || !!attributes.water_reactive_nucleophile;
            flags.water_reactive_electrophile = flags.water_reactive_electrophile || !!attributes.water_reactive_electrophile;
            flags.general = flags.general || !!attributes.general;
            flags.peroxide_former = flags.peroxide_former || !!attributes.peroxide_former;
            flags.strong_base = flags.strong_base || !!attributes.strong_base;
          });
        });

        const hazardFlags = [];

        for (const key of Object.keys(flags)) {
          if (flags[key]) {
            hazardFlags.push(key);
          }
        }

        this.setState({ hazardFlags });
      });
  }

  updateContainer(updates) {
    const id = this.props.container.get('id');

    const sanitizedUpdates = _.mapValues(updates, (v) => {
      // eslint-disable-next-line
      return _.isEmpty(v) ? null : v;
    });

    ContainerAPI.update(id, sanitizedUpdates)
      .done(() => {
        if (this.props.onContainerEdited) {
          this.props.onContainerEdited();
        }
      });
  }

  updateAliquot(wellIdx, updates) {
    AliquotActions.update(wellIdx, this.props.container.get('id'), updates)
      .done(() => {
        if (this.props.onContainerEdited) {
          this.props.onContainerEdited();
        }
      });
  }

  renderFlags() {
    if (this.state.hazardFlags.length > 0) {
      return (
        <dd>
          {this.state.hazardFlags.map(flag => {
            return <HazardTag key={flag} hazard={flag} />;
          })}
        </dd>
      );
    } else {
      return <dd>None</dd>;
    }
  }

  render() {
    const { container } = this.props;
    const org           = container.get('organization');
    const errors        = container.get('errors_for_location_validation') || Immutable.List();
    const warnings      = container.get('warnings_for_location_validation') || Immutable.List();
    const expires_at    = container.get('expires_at');
    const location_id   = container.get('location_id');

    return (
      <div className="admin-container-detail">
        <dl className="dl-horizontal metadata-properties">
          <div className="property">
            <dt>ID</dt>
            <dd>
              <Choose>
                <When condition={org}>
                  <a href={Urls.use(org.get('subdomain')).container(container.get('id'))}>
                    {container.get('id')}
                  </a>
                </When>
                <Otherwise>
                  <a href={`/containers/${container.get('id')}`}>
                    {container.get('id')}
                  </a>
                </Otherwise>
              </Choose>
            </dd>
          </div>
          <If condition={errors.size}>
            <div className="property danger">
              <dt>Location Errors</dt>
              <dd>{errors.map((value, _key) => value).join(' ')}</dd>
            </div>
          </If>
          <If condition={warnings.size}>
            <div className="property warning">
              <dt>Location Warnings</dt>
              <dd>{warnings.map((value, _key) => value).join(' ')}</dd>
            </div>
          </If>
          <If condition={!this.state}>
            <div className="property loading hazard flags">
              <dt>Loading Hazard Flags...</dt>
            </div>
          </If>
          <If condition={!!this.state}>
            <div className="property hazard flags">
              <dt>Hazard Flags</dt>
              {this.renderFlags()}
            </div>
          </If>

          <Choose>
            <When condition={container.get('status') === 'pending_destroy'}>
              <div className="property warning">
                <dt>Destruction</dt><dd>Pending</dd>
              </div>
            </When>
            <When condition={container.get('status') === 'destroyed'}>
              <div className="property danger">
                <dt>Destruction</dt>
                <dd><DateTime timestamp={container.get('deleted_at')} /></dd>
              </div>
            </When>
          </Choose>

          <div className="property">
            <dt>Organization</dt>
            <dd>
              <Choose>
                <When condition={org}>
                  {`${org.get('name')} (${org.get('id')})`}
                </When>
                <Otherwise>-</Otherwise>
              </Choose>
            </dd>
          </div>
          <div className="property">
            <dt>Storage</dt><dd>{container.get('storage_condition')}</dd>
          </div>
          <EditableProperty
            nameEditable={false}
            name="Barcode"
            value={container.get('barcode')}
            onSave={({ value }) => this.updateContainer({ barcode: value })}
          />
          <EditableProperty
            nameEditable={false}
            name="Label"
            value={container.get('label')}
            illegalChars={['/']}
            onSave={({ value }) => this.updateContainer({ label: value })}
          />
          <SearchChoosingProperty
            name="Container Type"
            value={container.get('container_type_shortname') || 'unspecified'}
            engine={ContainerTypeQueryEngine}
            onSave={ct => this.updateContainer({ container_type_id: ct.id })}
            deletable={false}
          />
          <div className="property">
            <dt>Location</dt>
            <dd>
              <Choose>
                <When condition={location_id}>
                  {location_id}
                </When>
                <Otherwise>-</Otherwise>
              </Choose>
            </dd>
          </div>
          <div className="property">
            <dt>Expires</dt>
            <dd>
              <DateSelector
                date={expires_at ? Moment(expires_at) : undefined}
                showDay
                showAutoSelect
                canReset
                onChange={e => this.updateContainer({ expires_at: e.target.value })}
              />
            </dd>
          </div>

          {(() => {
            if (this.props.container.getIn(['container_type', 'is_tube'])) {
              const aliquot = AliquotStore.getByContainer(this.props.container.get('id')).first();

              if (aliquot) {
                return (
                  <EditableProperty
                    nameEditable={false}
                    name="Volume"
                    value={aliquot.get('volume_ul')}
                    onSave={({ value }) =>
                      this.updateAliquot(aliquot.get('well_idx'), {
                        volume_ul: value
                      })}
                  />
                );
              }
            }

            return undefined;
          })()}
        </dl>
      </div>
    );
  }
}

export default UserContainerDetail;
