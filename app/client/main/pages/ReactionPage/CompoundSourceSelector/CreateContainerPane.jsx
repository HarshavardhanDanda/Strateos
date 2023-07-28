import React from 'react';
import Immutable from 'immutable';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import JSZip from 'jszip';

import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import { MultiStepModalPane } from 'main/components/Modal';
import ContainerActions from 'main/actions/ContainerActions';
import CreateContainers from 'main/pages/InventoryPage/AddContainerModal/CreateContainers';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';
import { TubeCreateLogic } from 'main/inventory/components/tube_views';
import { WarningBanner } from 'main/components/Banners';
import CreateContainersLogic from 'main/pages/InventoryPage/AddContainerModal/CreateContainersLogic';
import { toBoolean } from 'underscore.string';

import ContainerTypeHelper from 'main/helpers/ContainerType';
import SessionStore from 'main/stores/SessionStore';
import ShipmentActions from 'main/actions/ShipmentActions';
import ModalActions from 'main/actions/ModalActions';
import BulkDataIngestorActions from 'main/actions/BulkDataIngestorActions';
import NotificationActions from 'main/actions/NotificationActions';

export const PANELS = {
  CONTAINER: 'CONTAINER',
  UPLOAD_ZIP_PLATE: 'UPLOAD_ZIP_PLATE',
  UPLOAD_CSV_PLATE: 'UPLOAD_CSV_PLATE',
  UPLOAD_CSV_TUBES: 'UPLOAD_CSV_TUBES',
  UPLOAD_CSV_JOBS_API: 'UPLOAD_CSV_JOBS_API',
};

class CreateContainerPane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containers: Immutable.List(),
      // A list of maps whose keys are the error class and values are the error
      // message. Must include a key named index who's value is the line number
      // error.
      csvErrors: Immutable.List(),
      containerIndex: 0,
      ...this.getInitialPanelState(),
      deletedIndex: null,
      files: [],
      linkedCompoundsArray: [],
      jobsApiErrors: []
    };

    this.bannerRenderer = this.bannerRenderer.bind(this);
    this.isPlate = this.isPlate.bind(this);
    this.onAddContainer = this.onAddContainer.bind(this);
    this.createNewPlate = this.createNewPlate.bind(this);
    this.onBulkSetTubes = this.onBulkSetTubes.bind(this);
    this.onContainerSelected = this.onContainerSelected.bind(this);
    this.onDeleteContainer = this.onDeleteContainer.bind(this);
    this.resetActivePanel = this.resetActivePanel.bind(this);
    this.onInputValuesChange = this.onInputValuesChange.bind(this);
    this.onShowCSV = this.onShowCSV.bind(this);
    this.onShowZIPPlates = this.onShowZIPPlates.bind(this);
    this.onShowCSVJobsApi = this.onShowCSVJobsApi.bind(this);
    this.onJobsApiCSVChange = this.onJobsApiCSVChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.submitShipmentAndContainers = this.submitShipmentAndContainers.bind(this);
    this.submitTestContainers = this.submitTestContainers.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
    this.deleteFileIndex = this.deleteFileIndex.bind(this);
    this.onFilesDelete = this.onFilesDelete.bind(this);
    this.onNavigateBackToSelect = this.onNavigateBackToSelect.bind(this);
    this.linkCompoundsToContainers = this.linkCompoundsToContainers.bind(this);
    this.resetJobsApiErrors = this.resetJobsApiErrors.bind(this);
    this.tubeCounter = 1;
  }

  componentDidMount() {
    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({
          labOperatorName: firstLabConsumer.getIn(['lab', 'operated_by_name']),
          labAddress: firstLabConsumer.getIn(['lab', 'address']),
          lab_id: firstLabConsumer.getIn(['lab', 'id'])
        });
      }
    });
  }

  getInitialPanelState() {
    return {
      activePanel: PANELS.CONTAINER,
      jobsApiFiles: { plates: Immutable.List(), tubes: Immutable.List() }
    };
  }

  onNavigateBackToSelect(navigateBack) {
    // We must select some container when not displaying a CSV View.
    //
    // TODO: We should fix the CSV view so that we don't need to hide it
    // upon clicking the back button.  It should not download the csv file more
    // than once.

    this.resetActivePanel();
    this.setState({
      containers: Immutable.List(),
      csvErrors: Immutable.List()
    });

    navigateBack();
  }

  isPlate(containerTypeId) {
    return ContainerTypeStore.isPlate(containerTypeId);
  }

  scrollToTop() {
    return $(this.node).scrollTop(0, 0);
  }

  setPanel(activePanel) {
    const isSwitchingPanel = activePanel !== this.state.activePanel;
    this.setState({
      ...(isSwitchingPanel && this.getInitialPanelState()),
      activePanel: activePanel,
    });
  }

  resetActivePanel() {
    this.setState(this.getInitialPanelState());
  }

  onInputValuesChange(index, containersInputValues) {
    return this.setState(
      {
        containers: this.state.containers.set(index, containersInputValues)
      },
      this.resetActivePanel()
    );
  }

  resetJobsApiErrors() {
    this.setState({
      jobsApiErrors: []
    });
  }

  linkCompoundsToContainers(containers) {

    const linkedCompoundsArray = this.state.linkedCompoundsArray;
    containers.forEach((container, idx) => {

      const store = ContainerTypeStore.getById(container.container_type).toJS();
      const containerType = new ContainerTypeHelper(store);

      if (this.isPlate(container.container_type)) {
        const aliquots = container.aliquots;

        aliquots.forEach(aq_details => {
          const aq_well_idx = containerType.robotWell(aq_details.well_idx);
          if (linkedCompoundsArray[idx] !== undefined && linkedCompoundsArray[idx][aq_well_idx] !== undefined) {
            const linkedCompoundDetails = [];

            linkedCompoundsArray[idx][aq_well_idx].compoundLinks.forEach((cmpLink, ci) => {
              const compound_link = {};
              compound_link.compound_link_id = cmpLink.id;
              compound_link.concentration = linkedCompoundsArray[idx][aq_well_idx].compoundLinks[ci].concentration === undefined ? undefined : parseFloat(linkedCompoundsArray[idx][aq_well_idx].compoundLinks[ci].concentration);
              compound_link.solubility_flag = linkedCompoundsArray[idx][aq_well_idx].compoundLinks[ci].solubility_flag === undefined ? undefined : toBoolean(linkedCompoundsArray[idx][aq_well_idx].compoundLinks[ci].solubility_flag);
              linkedCompoundDetails.push(compound_link);
            });
            aq_details.compound_links = linkedCompoundDetails;
          }
        });
      } else if (!this.isPlate(container.container_type)) {
        if (linkedCompoundsArray[idx] !== undefined) {
          const linkedCompoundDetails = [];
          linkedCompoundsArray[idx].forEach((compound) => {
            const compound_link = {};
            compound_link.compound_link_id = compound.id;
            compound_link.concentration = compound.concentration === undefined ? undefined : parseFloat(compound.concentration);
            compound_link.solubility_flag = compound.solubility_flag === undefined ? undefined : toBoolean(compound.solubility_flag);
            linkedCompoundDetails.push(compound_link);
          });
          container.aliquots[0].compound_links = linkedCompoundDetails;
        }
      }
    });
  }

  assignFolderToFiles(files, containersFolder, folderName) {
    if (files.size > 0) {
      const folder = containersFolder.folder(folderName);
      files.map((file) => {
        return folder.file(file.name, file);
      });
    }
  }

  buildJobsApiPayload() {
    const date = moment(new Date()).format('DD_MM_YYYY_HH_mm_ss');
    const zipFileName = `bulk_${date}`;
    const zip = new JSZip();

    const plateCSVFiles = this.state.jobsApiFiles && this.state.jobsApiFiles.plates;
    const tubeCSVFiles = this.state.jobsApiFiles && this.state.jobsApiFiles.tubes;

    const containersFolder = zip.folder('containers');
    this.assignFolderToFiles(plateCSVFiles, containersFolder, 'plates');
    this.assignFolderToFiles(tubeCSVFiles, containersFolder, 'tubes');

    return zip.generateAsync({ type: 'blob' })
      .then((content) => {
        const formData = new FormData();
        formData.append('file', content, `${zipFileName}.zip`);
        formData.append('type', 'CREATE_CONTAINERS');
        return formData;
      });
  }

  validateZipFile(formData) {
    return BulkDataIngestorActions.validateZip(formData).then((res) => {
      if (res.valid && _.isEmpty(res.errors)) {
        return formData;
      } else {
        this.setState({
          jobsApiErrors: res.errors,
          waitingOnSubmit: false
        });
      }
    })
      .fail(() => {
        this.setState({
          waitingOnSubmit: false
        });
      });
  }

  uploadZipFile(formData) {
    formData.append('labId', this.state.lab_id);
    if (this.props.testMode) {
      formData.append('areTestContainers', true);
    }
    BulkDataIngestorActions.uploadZip(formData).then((res) => {
      if (res.status === 'ACCEPTED') {
        ModalActions.close('ADD_CONTAINER_MODAL');
        NotificationActions.createNotification({
          text: 'The CSV files are zipped and uploaded successfully',
          isSuccess: true,
        });
      }
    }).always(() => {
      this.setState({
        waitingOnSubmit: false
      });
    });
  }

  onAddContainer(containerTypeId) {
    const [plates, tubes] = Array.from(
      _.partition(this.state.containers.toJS(), container =>
        this.isPlate(container.containerType)
      )
    );

    let newContainer;
    if (this.isPlate(containerTypeId)) {
      newContainer = PlateCreateLogic.initialInputValues(
        containerTypeId,
        this.props.testMode
      ).set('name', `Plate ${plates.length + 1}`);
    } else {
      newContainer = TubeCreateLogic.initialInputValues(
        containerTypeId,
        this.props.testMode
      ).set('name', `Tube ${tubes.length + 1}`).set('uniq-key', this.tubeCounter++);
    }
    this.setState({
      containers: this.state.containers.concat([newContainer]),
      containerIndex: this.state.containers.size,
      files: this.state.files.concat({ fileName: 'addContainer', noOfContainers: 1 })
    });
  }

  createNewPlate(name, plateTypeId, storageCondition, coverStatus, wellMap, fileId) {
    const newPlate = PlateCreateLogic.initialInputValues(plateTypeId, this.props.testMode)
      .set('wellMap', wellMap)
      .set('cover', coverStatus)
      .set('name', name)
      .set('storage', storageCondition);
    this.setState({
      containers: this.state.containers.concat([newPlate]),
      files: this.state.files.concat({ uuid: fileId, noOfContainers: 1 })
    });
  }

  onDeleteContainer(index) {
    // change index if deleting the currently selected or if the current index is
    // greater than the index of the deleted container
    const containerIndex =
      index <= this.state.containerIndex
        ? Math.max(0, this.state.containerIndex - 1)
        : this.state.containerIndex;

    const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
    tempLinkedCompoundsArray.splice(index, 1);
    this.setState({ linkedCompoundsArray: tempLinkedCompoundsArray });
    const containersArr = this.state.containers.delete(index);
    this.setState({
      containers: containersArr,
      containerIndex
    });
    this.setState({ deletedIndex: index });
    this.deleteFileIndex(index);
    if (_.isEmpty(containersArr.toJS())) {
      this.setState({ linkedCompoundsArray: [] });
    }
  }

  deleteFileIndex(index) {
    // decrease the number of containers related to a file by one every time a container is deleted
    const files = Object.assign([], this.state.files);
    let indexSum = 0;
    let deleted = false;
    files.forEach((fileIndex) => {
      indexSum += fileIndex.noOfContainers;
      if (indexSum - 1 >= index && !deleted) {
        fileIndex.noOfContainers -= 1;
        deleted = true;
      }
    });
    this.setState({ files });
  }

  onContainerSelected(index) {
    this.setState(
      {
        containerIndex: index
      },
      this.resetActivePanel
    );
  }

  onShowCSV(isPlate) {
    this.setPanel(isPlate ? PANELS.UPLOAD_CSV_PLATE : PANELS.UPLOAD_CSV_TUBES);
  }

  onShowZIPPlates() {
    this.setPanel(PANELS.UPLOAD_ZIP_PLATE);
  }

  onShowCSVJobsApi() {
    this.setPanel(PANELS.UPLOAD_CSV_JOBS_API);
  }

  onJobsApiCSVChange(plates, tubes) {
    this.setState({
      jobsApiFiles: { plates, tubes }
    });
  }

  onBulkSetTubes(tubeInputParams, fileName, fileId) {
    let tubeInputValues = tubeInputParams;
    tubeInputValues = tubeInputParams.map(tube =>
      tube.set('uniq-key', this.tubeCounter++)
    );

    if (this.props.testMode) {
      tubeInputValues = tubeInputParams.map(tube =>
        tube.set('test_mode', true)
      );
    }
    if (CreateContainersLogic.isValid(tubeInputValues)) {
      const uploadedTubes = tubeInputValues.toJS();
      const tempLinkedCompoundsArray = [...this.state.linkedCompoundsArray];
      let containerIndex = this.state.containers && this.state.containers.toJS().length;
      uploadedTubes.forEach((tube) => {
        const compoundIds = tube.compoundIds !== undefined ? tube.compoundIds.split(' ') : [];
        const compoundsArray = [];
        compoundIds.forEach((cmpId) => {
          const compound = { id: cmpId, concentration: undefined, solubility_flag: undefined };
          compoundsArray.push(compound);
        });
        tempLinkedCompoundsArray[containerIndex] = compoundsArray.length > 0 ? compoundsArray : undefined;
        containerIndex += 1;
      });
      this.setState({
        containers: this.state.containers.concat(tubeInputValues),
        files: this.state.files.concat({ fileName: fileName, uuid: fileId, noOfContainers: tubeInputValues.size, errorIndex: -1 }),
        csvErrors: Immutable.List(),
        linkedCompoundsArray: tempLinkedCompoundsArray
      });
      return false;
    } else {
      const csvErrors = CreateContainersLogic.errors(tubeInputValues)
        .map((container, index) => container.set('index', index + 1))
        .map((container) => container.set('fileName', fileName))
        .map(container => container.filter((value, _key) => !!value))
        .filter(container => container.size > 2);

      const size = csvErrors.size;
      this.setState({
        csvErrors: this.state.csvErrors.concat(csvErrors),
        files: this.state.files.concat({ fileName: fileName, uuid: fileId, noOfContainers: 0, errorIndex: size })
      });
      return true;
    }
  }

  onFilesDelete(fileIds) {
    // delete all containers from given files
    // looping over the files for all fileNames and removing the containers related to those files
    let files = this.state.files;
    let containers = Immutable.List(this.state.containers);
    let csvErrors = this.state.csvErrors;
    fileIds.forEach((fileId) => {
      let startIndex = 0;
      let startErrorIndex = 0;
      files.forEach(index => {
        if (index.uuid === fileId) {
          if (index.errorIndex > -1) {
            csvErrors = csvErrors.splice(startErrorIndex, index.errorIndex);
            index.errorIndex = -1;
          } else {
            containers = containers.splice(startIndex, index.noOfContainers);
            index.noOfContainers = 0;
          }
          files = files.filter(file => file.uuid !== fileId);
        } else {
          if (index.errorIndex > -1) {
            startErrorIndex += index.errorIndex;
          }
          startIndex += index.noOfContainers;
        }
      });
    });
    this.setState({ files, containers, csvErrors });
  }

  buildContainers(containers) {
    return containers.map((container) => {
      let newContainer = container.set('lab_id', this.state.lab_id);
      if (this.props.compoundLinkId && this.props.hideCompoundLink) {
        newContainer = newContainer.set('compoundIds', this.props.compoundLinkId);
      }
      if (this.isPlate(newContainer.get('containerType'))) {
        return PlateCreateLogic.buildContainerWithBulkCreateContainerPayLoad(newContainer);
      } else {
        return TubeCreateLogic.buildContainerWithBulkCreateContainerPayLoad(newContainer);
      }
    });
  }

  submitTestContainers(navigateNext) {
    this.setState(
      {
        waitingOnSubmit: true
      },
      () => {
        const containersArr = this.buildContainers(this.state.containers).toJS();
        this.linkCompoundsToContainers(containersArr);
        return ContainerActions.bulkCreateSampleContainers(containersArr)
          .done((cts) => {
            const immData = Immutable.fromJS(cts);
            const containers = immData.get('containers');
            this.props.onContainerCreation(containers);
            return this.setState(
              {
                createdContainers: containers
              },
              () => {
                this.scrollToTop();
                return navigateNext();
              }
            );
          })
          .always(() =>
            this.setState({
              waitingOnSubmit: false
            })
          );
      }
    );
  }

  createShipment(responseContainers, containersArr, navigateNext) {

    const containerIds = [];

    responseContainers.toJS().forEach((container) => {
      containerIds.push(container.id);
    });

    const options = {
      name: '',
      note: '',
      organization_id: SessionStore.getOrg().get('id'),
      shipment_type: 'sample',
      lab_id: containersArr[0].lab_id
    };
    ShipmentActions.createShipmentWithCodes({
      attributes: options,
      container_ids: containerIds
    }).then((response) => {
      const shipment = response.get('shipment');
      const containers = response.get('containers');

      this.props.onContainerCreation(containers, shipment, this.state.labAddress, this.state.labOperatorName);
      return this.setState(
        {
          createdContainers: containers,
          createdShipment: shipment
        },
        () => {
          this.scrollToTop();
          return navigateNext();
        }
      );
    });
  }

  submitShipmentAndContainers(navigateNext) {
    return this.setState(
      {
        waitingOnSubmit: true
      },
      () => {
        const containersArr = this.buildContainers(this.state.containers).toJS();
        this.linkCompoundsToContainers(containersArr);

        return ContainerActions.bulkCreateSampleContainers(containersArr)
          .done((data) => {
            const immData = Immutable.fromJS(data);
            const responseContainers = immData.get('containers');

            this.createShipment(responseContainers, containersArr, navigateNext);
          })
          .always(() =>
            this.setState({
              waitingOnSubmit: false
            })
          );
      }
    );
  }

  onSubmit(navigateNext) {
    const { jobsApiFiles } = this.state;
    if (
      this.state.activePanel === PANELS.UPLOAD_CSV_JOBS_API &&
      (jobsApiFiles.plates.size > 0 || jobsApiFiles.tubes.size > 0)
    ) {
      return this.setState(
        {
          waitingOnSubmit: true
        },
        () => {
          this.buildJobsApiPayload()
            .then((formData) => this.validateZipFile(formData))
            .then((res) => this.uploadZipFile(res));
        });
    }
    if (
      CreateContainersLogic.isValid(this.state.containers, this.props.mass, this.props.volume) &&
      this.state.containers.size > 0
    ) {
      if (this.props.testMode) {
        return this.submitTestContainers(navigateNext);
      } else {
        return this.submitShipmentAndContainers(navigateNext);
      }
    } else {
      const containersWithErrors = CreateContainersLogic.forceAllErrors(
        this.state.containers
      );
      const errors = CreateContainersLogic.errorBooleans(this.state.containers);
      const index = errors.findIndex(bool => bool);
      return this.setState({
        containerIndex: index,
        containers: containersWithErrors
      });
    }
  }

  isNextBtnDisabled() {
    return PANELS.UPLOAD_CSV_JOBS_API === this.state.activePanel ?
      this.state.jobsApiFiles.plates.size === 0 && this.state.jobsApiFiles.tubes.size === 0 :
      this.state.containers.size === 0;
  }

  bannerRenderer() {
    return <WarningBanner text="Creating test-mode containers" />;
  }

  render() {
    return (
      <div className="create-container-pane">
        <MultiStepModalPane
          key="renderCreateContainers"
          {...this.props}
          ref={(node) => { this.node = node; }}
          beforeNavigateNext={this.onSubmit}
          nextBtnName={`${this.props.testMode
            ? 'Create Test Containers'
            : 'Create Shipment'}`}
          nextBtnDisabled={this.isNextBtnDisabled()}
          waitingOnResponse={this.state.waitingOnSubmit}
          beforeNavigateBack={this.onNavigateBackToSelect}
          btnClass="btn-md"
          bannerRenderer={this.props.testMode ? this.bannerRenderer : undefined}
        >
          <CreateContainers
            containers={this.state.containers}
            containerIndex={this.state.containerIndex}
            isPlate={this.isPlate}
            testMode={this.props.testMode}
            activePanel={this.state.activePanel}
            onInputValuesChange={this.onInputValuesChange}
            onAddContainer={this.onAddContainer}
            createNewPlate={this.createNewPlate}
            onDeleteContainer={this.onDeleteContainer}
            onContainerSelected={this.onContainerSelected}
            onShowCSV={this.onShowCSV}
            onShowZIPPlates={this.onShowZIPPlates}
            onShowCSVJobsApi={this.onShowCSVJobsApi}
            onResetActivePanel={this.resetActivePanel}
            onBulkSetTubes={this.onBulkSetTubes}
            csvErrors={this.state.csvErrors}
            onFilesDelete={this.onFilesDelete}
            filterContainerTypes={this.props.filterContainerTypes}
            hideCompoundLink={this.props.hideCompoundLink}
            hideBulkUpload={this.props.hideBulkUpload}
            mass={this.props.mass}
            volume={this.props.volume}
            compoundLinkId={this.props.compoundLinkId}
            getLinkedCompoundArray={(nm) => this.setState({ linkedCompoundsArray: nm })}
            deletedIndex={this.state.deletedIndex}
            linkedCompoundsArray={this.state.linkedCompoundsArray}
            onJobsApiCSVChange={this.onJobsApiCSVChange}
            jobsApiErrors={this.state.jobsApiErrors}
            resetJobsApiErrors={this.resetJobsApiErrors}
          />
        </MultiStepModalPane>
      </div>
    );
  }
}

CreateContainerPane.defaultProps = {
  testMode: false
};

export default CreateContainerPane;
