import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Button, ButtonGroup, LabeledInput } from '@transcriptic/amino';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class ContainerTypeSelect extends React.Component {
  static get propTypes() {
    return {
      onAddContainer: PropTypes.func.isRequired,
      onShowCSVTubes: PropTypes.func.isRequired,
      onShowZIPPlates: PropTypes.func.isRequired,
      onShowCSVJobsApi: PropTypes.func.isRequired,
      showAddButton:  PropTypes.bool,
      filterContainerTypes: PropTypes.instanceOf(Immutable.Iterable),
      hideBulkUpload: PropTypes.bool,
      disableAdd:  PropTypes.bool
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      containerType: this.props.filterContainerTypes ? this.props.filterContainerTypes.get(0) : '96-pcr'
    };
  }

  render() {
    const { disableAdd } = this.props;

    const hasJobsApiPermission = AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_JOB);

    const linkProps = {
      height: 'short',
      size: 'small',
      heavy: false,
      link: true,
      disableFormat: true,
      icon: 'fa fa-cloud-upload-alt',
      iconSize: 'small'
    };

    return (
      <div className="container-type-select">
        <LabeledInput label="Container Type">
          <span
            className="container-type-select__selector"
            style={{
              width: this.props.filterContainerTypes ? '200%' : ''
            }}
          >
            <ContainerTypeSelector
              value={this.state.containerType}
              onChange={e =>
                this.setState({
                  containerType: e.target.value
                })}
              disabled={disableAdd}
            />
            {this.props.showAddButton && (
              <Button
                disabled={disableAdd}
                iconColor="inherit"
                onClick={() => this.props.onAddContainer(this.state.containerType)}
                {...linkProps}
                icon="fa fa-plus"
                heavy
                disableFormat
              >
                ADD
              </Button>
            )}
          </span>
          {!this.props.hideBulkUpload && (
            <div className="container-type-select__links">
              <ButtonGroup>
                <Button
                  {...linkProps}
                  onClick={this.props.onShowCSVTubes}
                >
                  Bulk upload tube information
                </Button>
                <Button
                  {...linkProps}
                  onClick={this.props.onShowZIPPlates}
                >
                  Bulk upload plate CSVs
                </Button>
                {hasJobsApiPermission && (
                  <Button
                    {...linkProps}
                    onClick={this.props.onShowCSVJobsApi}
                  >
                    Bulk upload CSVs to Job Shipment API
                  </Button>
                )}
              </ButtonGroup>
            </div>
          )}
        </LabeledInput>
      </div>
    );
  }
}

export default ContainerTypeSelect;
