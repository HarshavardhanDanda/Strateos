import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import { Card } from '@transcriptic/amino';

import PlateCreateFromCSV from 'main/components/PlateCreateFromCSV';
import { TubesCreateFromCSV } from 'main/inventory/components/TubesCreateFromCSV';
import BulkUploadJobsApi from 'main/inventory/components/BulkUploadJobsApi';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import { PANELS } from 'main/pages/ReactionPage/CompoundSourceSelector/CreateContainerPane';

import CreateContainersCreationPane from './CreateContainersCreationPane';
import CreateContainersListPane from './CreateContainersListPane';
import CreateContainersLogic from './CreateContainersLogic';
import ContainerTypeSelect from './ContainerTypeSelect';

import './CreateContainers.scss';
import BulkUploadPlateZip from './BulkUploadPlateZip';

class CreateContainers extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onNextContainer = this.onNextContainer.bind(this);
  }

  onNextContainer() {
    // wrap around to first container if at end of list
    const index =
      this.props.containerIndex + 1 < this.props.containers.size
        ? this.props.containerIndex + 1
        : 0;
    return this.props.onContainerSelected(index);
  }

  // TODO XXX use ConnectToStoresHOC
  containerTypes() {
    const sorter = cType => cType.get('name');
    return this.props.containerTypes.sortBy(sorter);
  }

  render() {
    const { activePanel } = this.props;
    const errorBooleans = CreateContainersLogic.errorBooleans(
      this.props.containers
    );
    const selectedHasError = errorBooleans.get(this.props.containerIndex);
    const showUpload = activePanel !== PANELS.CONTAINER;

    return (
      <div className="create-containers">
        <div className="body-container tx-stack">
          <div className="container-type-select-container tx-stack__block--xxlg">
            <ContainerTypeSelect
              onAddContainer={this.props.onAddContainer}
              onShowCSVTubes={() => this.props.onShowCSV(false)}
              onShowZIPPlates={() => this.props.onShowZIPPlates()}
              onShowCSVJobsApi={() => this.props.onShowCSVJobsApi()}
              showAddButton={this.props.containers.count() < CreateContainers.MAX_CONTAINERS}
              filterContainerTypes={this.props.filterContainerTypes}
              hideBulkUpload={this.props.hideBulkUpload}
              disableAdd={activePanel === PANELS.UPLOAD_CSV_JOBS_API}
            />
          </div>
          <div className="body-container__create-containers-body row">
            <div className="col-sm-12 col-md-2">
              <CreateContainersListPane
                containers={this.props.containers}
                containerIndex={
                  this.props.showCSVTubes ? undefined : this.props.containerIndex
                }
                isPlate={this.props.isPlate}
                errorBooleans={errorBooleans}
                onContainerSelected={this.props.onContainerSelected}
                onDeleteContainer={this.props.onDeleteContainer}
              />
            </div>
            <div className="col-sm-12 col-md-10">
              {showUpload ? (
                <Card className="create-containers-csv-pane">
                  {activePanel === PANELS.UPLOAD_ZIP_PLATE && (
                    <BulkUploadPlateZip
                      plateTypes={this.containerTypes().filter(c => !c.get('is_tube'))}
                      createNewPlate={this.props.createNewPlate}
                      onFilesDelete={this.props.onFilesDelete}
                    />
                  )}
                  {activePanel === PANELS.UPLOAD_CSV_PLATE && (
                    <div>
                      <a
                        className="back"
                        onClick={() => this.props.onResetActivePanel()}
                      >
                        <i className="fa fa-chevron-left" />Back to plate view
                      </a>
                      <PlateCreateFromCSV
                        containerType={ContainerTypeStore.getById(
                          this.props.containers
                            .get(this.props.containerIndex)
                            .get('containerType')
                        )}
                        onCSVChange={(wellMap) => {
                          const inputValues = this.props.containers
                            .get(this.props.containerIndex)
                            .set('wellMap', wellMap);
                          return this.props.onInputValuesChange(
                            this.props.containerIndex,
                            inputValues
                          );
                        }}
                      />
                    </div>
                  )}
                  {activePanel === PANELS.UPLOAD_CSV_TUBES && (
                    <TubesCreateFromCSV
                      onCSVChange={this.props.onBulkSetTubes}
                      errors={this.props.csvErrors}
                      onFilesDelete={this.props.onFilesDelete}
                    />
                  )}
                  {activePanel === PANELS.UPLOAD_CSV_JOBS_API && (
                    <BulkUploadJobsApi
                      onCsvChange={this.props.onJobsApiCSVChange}
                      jobsApiErrors={this.props.jobsApiErrors}
                      resetJobsApiErrors={this.props.resetJobsApiErrors}
                    />
                  )}
                </Card>
              ) : (this.props.containers.size > 0 && (
                <CreateContainersCreationPane
                  isPlate={this.props.isPlate(
                    this.props.containers
                      .get(this.props.containerIndex)
                      .get('containerType')
                  )}
                  container={this.props.containers.get(
                    this.props.containerIndex
                  )}
                  containerArray={this.props.containers}
                  deletedIndex={this.props.deletedIndex}
                  onUseCSV={() => this.props.onShowCSV(true)}
                  onInputValuesChange={inputValues =>
                    this.props.onInputValuesChange(
                      this.props.containerIndex,
                      inputValues
                    )}
                  onNext={this.onNextContainer}
                  showNextButton={
                      !selectedHasError && this.props.containers.size > 1
                    }
                  hideCompoundLink={this.props.hideCompoundLink}
                  compoundLinkId={this.props.compoundLinkId}
                  mass={this.props.mass}
                  volume={this.props.volume}
                  getLinkedCompoundArray={this.props.getLinkedCompoundArray}
                  linkedCompoundsArray={this.props.linkedCompoundsArray}
                  containerIndex={this.props.containerIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CreateContainers.MAX_CONTAINERS = 30;

CreateContainers.propTypes = {
  containerTypes: PropTypes.instanceOf(Immutable.Iterable),
  containerIndex: PropTypes.number,
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  onContainerSelected: PropTypes.func,
  activePanel: PropTypes.string,
  isPlate: PropTypes.func,
  onAddContainer: PropTypes.func.isRequired,
  onDeleteContainer: PropTypes.func,
  onShowCSV: PropTypes.func,
  onResetActivePanel: PropTypes.func,
  createNewPlate: PropTypes.func,
  onShowZIPPlates: PropTypes.func,
  onInputValuesChange: PropTypes.func,
  onBulkSetTubes: PropTypes.func,
  csvErrors: PropTypes.object,
  testMode: PropTypes.bool,
  onFilesDelete: PropTypes.func,
  filterContainerTypes: PropTypes.instanceOf(Immutable.Iterable),
  hideBulkUpload: PropTypes.bool,
  mass: PropTypes.number,
  volume: PropTypes.number,
  hideCompoundLink: PropTypes.bool,
  compoundLinkId: PropTypes.arrayOf(PropTypes.string),
  deletedIndex: PropTypes.number,
  getLinkedCompoundArray: PropTypes.func.isRequired,
  linkedCompoundsArray: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  onShowCSVJobsApi: PropTypes.func.isRequired,
  onJobsApiCSVChange: PropTypes.func.isRequired,
  jobsApiErrors: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  resetJobsApiErrors: PropTypes.func
};

const getStateFromStores = (props) => {
  let filteredList;
  if (props.filterContainerTypes) {
    filteredList = props.filterContainerTypes.map((containerTypeId) => ContainerTypeStore.getById(containerTypeId));
  }
  const containerTypes = props.filterContainerTypes ? filteredList : ContainerTypeStore.usableContainerTypes();
  return { containerTypes };
};

export default ConnectToStoresHOC(CreateContainers, getStateFromStores);
