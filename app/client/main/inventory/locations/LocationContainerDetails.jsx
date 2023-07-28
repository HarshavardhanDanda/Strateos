import Immutable from 'immutable';
import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import AliquotAPI                                   from 'main/api/AliquotAPI';
import AliquotActions                               from 'main/actions/AliquotActions';
import { DateSelector, KeyValueList, DateTime }     from '@transcriptic/amino';
import ContainerAPI                                 from 'main/api/ContainerAPI';
import { SearchChoosingProperty }                   from 'main/components/properties';
import EditableProperty                             from 'main/components/EditableProperty';
import AliquotStore                                 from 'main/stores/AliquotStore';
import Urls                                         from 'main/util/urls';
import FeatureConstants                             from '@strateos/features';
import FeatureStore                                 from 'main/stores/FeatureStore';
import HazardTag                                    from 'main/components/Hazards/HazardTag';
import NotificationActions                          from 'main/actions/NotificationActions';

import ContainerTypeQueryEngine from 'main/inventory/locations/search/ContainerTypeQueryEngine';

class LocationContainerDetails extends React.Component {

  static get propTypes() {
    return {
      container:         PropTypes.instanceOf(Immutable.Map).isRequired,
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
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }

  updateAliquot(wellIdx, updates) {
    AliquotActions.update(this.props.container.get('id'), wellIdx, updates)
      .done(() => {
        if (this.props.onContainerEdited) {
          this.props.onContainerEdited();
        }
      });
  }

  renderFlags() {
    if (this.state.hazardFlags.length > 0) {
      return (
        this.state.hazardFlags.map(flag => {
          return <HazardTag key={flag} hazard={flag} />;
        })
      );
    } else {
      return 'None';
    }
  }

  renderId() {
    const { container } = this.props;
    return (
      <a href={`${Urls.samples()}/${container.get('id')}`}>
        {container.get('id')}
      </a>
    );
  }

  renderVolume() {
    const { container } = this.props;
    const lab_id = container.getIn(['lab', 'id']);
    const editable = FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, lab_id);
    if (container.get('is_tube')) {
      const aliquot = container.get('aliquots') ? container.get('aliquots').first() :
        AliquotStore.getByContainer(container.get('id')).first();
      if (aliquot) {
        return (
          <EditableProperty
            value={aliquot.get('volume_ul')}
            editable={editable}
            onSave={(value) =>
              this.updateAliquot(aliquot.get('well_idx'), {
                volume_ul: value
              })}
            expandOnEdit={false}
          />
        );
      }
    }
    return 'Container is not a tube';
  }

  render() {
    const { container } = this.props;
    const org           = container.get('organization');
    const errors        = container.get('errors_for_location_validation') || Immutable.List();
    const warnings      = container.get('warnings_for_location_validation') || Immutable.List();
    const expires_at    = container.get('expires_at');
    const location_id   = container.get('location_id');

    return (
      <div className="tx-inset--sm tx-inset--square">
        <KeyValueList
          isLeftRight
          entries={[
            {
              key: 'ID',
              value: this.renderId()
            },
            {
              key: 'Location Errors',
              value: errors.map((value, _key) => value).join(' ')
            },
            {
              key: 'Location Warnings',
              value: warnings.map((value, _key) => value).join(' ')
            },
            this.state ? {
              key: 'Hazard Flags',
              value: this.renderFlags()
            } : {
              key: 'Loading Hazard Flags...',
              value: ''
            },
            {
              key: 'Destruction',
              value: container.get('status') === 'pending_destroy' ?
                'Pending' : container.get('status') === 'available' ? 'N/A' : <DateTime timestamp={container.get('deleted_at')} />
            },
            {
              key: 'Organization',
              value: org ? `${org.get('name')} (${org.get('id')})` : '-'
            },
            {
              key: 'Storage',
              value: container.get('storage_condition')
            },
            {
              key: 'Barcode',
              value: <EditableProperty
                value={container.get('barcode')}
                onSave={(value) => this.updateContainer({ barcode: value })}
                expandOnEdit={false}
              />
            },
            {
              key: 'Label',
              value: <EditableProperty
                value={container.get('label')}
                illegalChars={['/']}
                onSave={(value) => this.updateContainer({ label: value })}
                expandOnEdit={false}
              />
            },
            {
              key: 'Container Type',
              value: <SearchChoosingProperty
                value={container.get('container_type_shortname', 'unspecified')}
                engine={ContainerTypeQueryEngine}
                onSave={ct => this.updateContainer({ container_type_id: ct.id })}
                deletable={false}
              />
            },
            {
              key: 'Location',
              value: location_id || '-'
            },
            {
              key: 'Expires',
              value: <DateSelector
                date={expires_at ? Moment(expires_at) : undefined}
                showDay
                showAutoSelect
                canReset
                onChange={e => this.updateContainer({ expires_at: e.target.value })}
              />
            },
            {
              key: 'Volume',
              value: this.renderVolume()
            }
          ]}
        />
      </div>
    );
  }
}

export default LocationContainerDetails;
