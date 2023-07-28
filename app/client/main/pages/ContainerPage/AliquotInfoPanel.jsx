import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';
import { CollapsiblePanel, Divider }        from '@transcriptic/amino';
import AliquotComposition from 'main/pages/ContainerPage/AliquotComposition';
import AliquotHistory     from 'main/pages/ContainerPage/AliquotHistory';
import AliquotMetadata    from 'main/pages/ContainerPage/AliquotMetadata';
import AcsControls        from 'main/util/AcsControls';
import FeatureConstants   from '@strateos/features';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import ContextualCustomPropertyStore from 'main/stores/ContextualCustomPropertyStore';
import ContextualCustomPropertyUtil from 'main/util/ContextualCustomPropertyUtil';
import AliquotAPI from 'main/api/AliquotAPI';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import CustomPropertyTable from 'main/pages/ContainerPage/CustomPropertyTable';
import NotificationActions from 'main/actions/NotificationActions';

import './AliquotInfoPanel.scss';

class AliquotInfoPanel extends React.Component {
  static get propTypes() {
    return {
      aliquot:         PropTypes.instanceOf(Immutable.Map),
      containerType:   PropTypes.instanceOf(Immutable.Map),
      atEffectId:      PropTypes.string,
      returnUrl:       PropTypes.string.isRequired,
      onCompoundClick: PropTypes.func,
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      canManageCompounds: AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT),
      selectedTab: ''
    };
    _.bindAll(
      this,
      'updateResource',
      'onSaveCustomProperty',
    );
    this.methodRef = React.createRef();
  }

  componentDidMount() {
    this.setDefaultTab();
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.aliquot.get('id') !== this.props.aliquot.get('id')) {
      this.fetchData();
    }
  }

  setDefaultTab() {
    this.setState({ selectedTab: this.state.canManageCompounds ? 'Compounds' : 'History' });
  }

  async fetchData() {
    try {
      const options = { includes: ['contextual_custom_properties'] };
      await AliquotAPI.get(this.props.aliquot.get('id'), options);
    } catch (err) {
      NotificationActions.handleError(err);
    }
  }

  updateResource() {
    this.methodRef.current.updateResource();
  }

  getAliquotIndex() {
    const helper = new ContainerTypeHelper({ col_count: this.props.containerType.get('col_count') });
    const wellIndex = this.props.aliquot.get('well_idx');
    return helper.humanWell(wellIndex);
  }

  onSaveCustomProperty(key, value) {
    const { aliquot } = this.props;
    return AliquotAPI.updateCustomProperty(
      aliquot.get('id'),
      key,
      value);
  }

  renderHistory() {
    return (
      <AliquotHistory aliquot={this.props.aliquot} atEffectId={this.props.atEffectId} />
    );
  }

  renderCompounds() {
    const { aliquot, container, onCompoundClick } = this.props;

    if (!this.state.canManageCompounds) {
      return undefined;
    }

    return (
      <AliquotComposition
        id={aliquot.get('id')}
        container={container}
        aliquotIndex={this.getAliquotIndex()}
        ref={this.methodRef}
        onCompoundClick={onCompoundClick}
      />
    );
  }

  render() {
    const {
      container,
      aliquot,
      customProperties,
    } = this.props;
    const customPropertiesConfigs = ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Aliquot');
    const showCustomPropertyTable = !!aliquot && ContextualCustomPropertyUtil.showCPTable(customPropertiesConfigs);
    const aliquotIndex = this.getAliquotIndex();

    return (
      <div className="container-page__border-line">
        <div className="aliquot-info-panel ">
          <div className="panel-heading">
            <Link to={this.props.returnUrl}>
              <span className="aliquot-info-panel__navback">
                <i className="fa fa-chevron-left aliquot-info-panel__navback-icon" />
                <span>
                  <h3 className="panel-title aliquot-info-panel__navback-title">Aliquots / </h3>
                </span>
              </span>
            </Link>
            <span>
              <h3 className="panel-title aliquot-info-panel__navback-title tx-type--secondary tx-type--heavy">{aliquotIndex}</h3>
            </span>
          </div>
          <div className="panel-body">
            {
          (this.props.aliquot == undefined) ?
            (
              <div className="no-aliquot">
                <em>Aliquot Missing</em>
              </div>
            ) : (
              <div>
                <AliquotMetadata aliquot={this.props.aliquot} containerType={this.props.containerType} updateResource={this.updateResource} container={this.props.container} />
                {showCustomPropertyTable && (
                  <div>
                    <Divider isDark />
                    <CollapsiblePanel wide title="Organization specific properties" initiallyCollapsed={false}>
                      <CustomPropertyTable
                        customProperties={customProperties}
                        customPropertiesConfigs={customPropertiesConfigs}
                        onSaveCustomProperty={(key, value) => this.onSaveCustomProperty(key, value)}
                      />
                    </CollapsiblePanel>
                  </div>
                )}
                <Divider isDark />
                <CollapsiblePanel title="Compounds" wide initiallyCollapsed={false}>
                  {this.renderCompounds()}
                </CollapsiblePanel>
                <Divider isDark />
                <CollapsiblePanel title="History" wide initiallyCollapsed={false}>
                  {this.renderHistory()}
                </CollapsiblePanel>
              </div>
            )
          }
          </div>
        </div>
      </div>
    );
  }
}

export const props = ({
  aliquot,
}) => {
  const aliquotId = aliquot.get('id');
  const customProperties = ContextualCustomPropertyStore.getCustomProperties(aliquotId, 'Aliquot');

  return {
    customProperties
  };
};

export default ConnectToStores(AliquotInfoPanel, props);
