// Manages UI for launching a standard protocol
import Immutable from 'immutable';
import $         from 'jquery';
import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import Moment    from 'moment';
import { Button, DatePicker, Divider, Toggle, Section }           from '@transcriptic/amino';
import { MultiStepModalPane }                                     from 'main/components/Modal';
import ModalActions                                               from 'main/actions/ModalActions';
import NotificationActions                                        from 'main/actions/NotificationActions';
import PaymentMethodActions                                       from 'main/actions/PaymentMethodActions';
import LabConsumerActions                                         from 'main/actions/LabConsumerActions';
import LabConsumerStore                                           from 'main/stores/LabConsumerStore';
import * as RunAnalytics                                          from 'main/analytics/RunAnalytics';
import { AdminModeBanner, BSLRunBanner, TestRunBanner }           from 'main/components/Banners';
import ConnectToStoresHOC                                         from 'main/containers/ConnectToStoresHOC';
import { PaymentInfoModal }                                       from 'main/organization/PaymentInfo';
import LaunchRunActions                                           from 'main/project/launchRun/LaunchRunActions';
import LaunchRunInputs                                            from 'main/project/launchRun/LaunchRunInputs';
import LaunchRunStore                                             from 'main/project/launchRun/LaunchRunStore';
import SessionStore                                               from 'main/stores/SessionStore';
import RunPreview                                                 from 'main/project/launchRun/RunPreview';
import RunValidator                                               from 'main/project/launchRun/RunValidator';
import { SuccessfulSubmission, SuccessfulSubmissionWithShipping } from 'main/project/launchRun/successfulSubmission';
import { ValidationProgress }                                     from 'main/project/launchRun/validation';
import Manifest                                                   from 'main/util/Manifest';
import RunAPI from 'main/api/RunAPI';
import { uploadFile } from 'main/util/uploader';

import EditPredecessorRun from './EditPredecessorRun';
import LaunchRequestAPI from '../../api/LaunchRequestAPI';

const PAYMENT_INFO_MODAL_ID = 'LAUNCH_RUN_PAYMENT_MODAL';

class LaunchRunSequence extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onInvalidate = this.onInvalidate.bind(this);
    this.onNewValidator = this.onNewValidator.bind(this);
    this.onValidate = this.onValidate.bind(this);
    this.onRequestDateChange = this.onRequestDateChange.bind(this);
    this.onToggleRequestDate = this.onToggleRequestDate.bind(this);

    this.state = {
      validator: undefined,
      validated: false,
      requestDate: undefined,
      testMode: props.initialTestMode,
      labId:  undefined,
      showRequestDateInputParameters: false,
      predecessorId: props.initialPredecessorId
    };
  }

  componentWillMount() {
    if (this.props.project.get('organization_id') !== SessionStore.getOrg().get('id')) {
      PaymentMethodActions.loadByOrg(this.props.project.get('organization_id'));
    } else {
      PaymentMethodActions.loadAll();
    }
    return this.init(
      this.props.parameters,
      this.props.manifest,
      this.props.customInputs,
      this.props.customInputsConfig
    );
  }

  componentDidMount() {
    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({ labId: firstLabConsumer.getIn(['lab', 'id']) });
      }
    });
  }

  componentDidUpdate(prevProps) {
    const manifestChanged = this.props.manifest.id !== prevProps.manifest.id;
    if (manifestChanged) {
      this.init(
        this.props.parameters,
        this.props.manifest,
        this.props.customInputs,
        this.props.customInputsConfig
      );
    }
  }

  onValidate() {
    return this.setState(
      {
        validated: true
      },
      () => this.props.onNext()
    );
  }

  onNewValidator(validator) {
    return this.setState({
      validated: false,
      validator
    });
  }

  onInvalidate() {
    return this.setState({
      validated: false,
      validator: undefined,
      validatePredecessorInput: undefined
    });
  }

  getProtocolInputs() {
    return LaunchRunStore.getProtocolInputs();
  }

  getCustomInputs() {
    return LaunchRunStore.getCustomInputs();
  }

  getCsvUploads() {
    return LaunchRunStore.getCsvUploads();
  }

  init(parameters, manifest, customInputs, customInputsConfig) {
    this.onInvalidate();
    LaunchRunStore.reset();
    LaunchRunStore.setFromRunSubtab(this.props.runSubtab);
    if (customInputsConfig) {
      if (customInputs != undefined) {
        LaunchRunStore.setNewCustomInputs(
          Manifest.filterInputs(customInputs, customInputsConfig)
        );
      } else {
        LaunchRunStore.setNewCustomInputs(Manifest.defaults(customInputsConfig));
      }
    }

    if (parameters != undefined) {
      // filters csv-table until supported
      LaunchRunStore.setNewJSInputs(
        Manifest.filterInputs(parameters, manifest.inputs)
      );
    } else {
      LaunchRunStore.setNewJSInputs(Manifest.defaults(manifest.inputs));
    }

    const csvInputs = Manifest.csvInputs(_.cloneDeep(manifest.inputs));
    LaunchRunStore.setCsvUploads(Manifest.defaults(csvInputs, true));
  }

  onRequestDateChange(date) {
    this.setState({
      requestDate: date
    });
  }

  onToggleRequestDate() {
    this.setState(
      {
        showRequestDateInputParameters: !this.state.showRequestDateInputParameters
      },
      () => {
        if (!this.state.showRequestDateInputParameters) {
          this.onRequestDateChange(undefined);
        }
      }
    );
  }

  toggleTestMode() {
    if (!this.props.canSetTestMode) {
      return;
    }

    const { parameters, manifest, customInputs, customInputsConfig } = this.props;
    this.setState(
      {
        testMode: !this.state.testMode
      },
      () => {
        this.init(parameters, manifest, customInputs, customInputsConfig);
      }
    );
  }

  renderBody(navName, bsl, orgId) {
    switch (navName) {
      case 'Configure':
        return (
          <div>
            <ConnectedConfigure
              manifest={this.props.manifest}
              inputs={this.getProtocolInputs()}
              testMode={this.state.testMode}
              bsl={bsl}
              organizationId={orgId}
              customInputsConfig={this.props.customInputsConfig}
              customInputs={this.getCustomInputs()}
              onBack={this.props.onExit}
              backDisplay={this.props.exitDisplay}
              onNext={this.props.onNext}
              validator={this.state.validator}
              validated={this.state.validated}
              onValidate={this.onValidate}
              onInvalidate={this.onInvalidate}
              onNewValidator={this.onNewValidator}
              requestDate={this.state.requestDate}
              showRequestDateInputParameters={this.state.showRequestDateInputParameters}
              onRequestDateChange={this.onRequestDateChange}
              onToggleRequestDate={this.onToggleRequestDate}
              predecessorId={this.state.predecessorId}
              onPredecessorIdChange={(predecessorId) => this.setState({ predecessorId })}
              csvInputs={this.getCsvUploads()}
              labId={this.props.labId}
            />
          </div>
        );
      case 'Review':
        /*
          TODO: This is a large hack. There is currently a race condition because we use both
          component state and store state and they can conflict when jumping back
          and forth between the tabs of this modal. We put this block here so we dont try
          to render the Review screen when there isn't a validator.
        */
        if (!this.state.validator) return <div />;
        return (
          <ConnectedReview
            organizationId={orgId}
            onBack={this.props.onBack}
            onNext={this.props.onNext}
            validator={this.state.validator}
            testMode={this.state.testMode}
            bsl={bsl}
            manifest={this.props.manifest}
            project={this.props.project}
            requestDate={this.state.requestDate}
            customInputsConfig={this.props.customInputsConfig}
            customInputs={this.getCustomInputs()}
            predecessorId={this.state.predecessorId}
          />
        );
      case 'Success':
        if (LaunchRunStore.shipment.get('id') != undefined) {
          return (
            <SuccessfulSubmissionWithShipping
              runUrl={LaunchRunStore.runUrl.get()}
              shipment={LaunchRunStore.shipment}
              containers={LaunchRunStore.getShippableContainers(
                this.props.manifest
              )}
            />
          );
        } else {
          return <SuccessfulSubmission runUrl={LaunchRunStore.runUrl.get()} />;
        }
      default:
        console.error('Unexpected navName and bsl: ', navName, bsl);
        return <div />;
    }
  }

  render() {
    // Server-side we deterine a run's bsl level based on the project.
    const bsl = this.props.project.get('bsl');
    const orgId = this.props.project.get('organization_id');
    const navName = this.props.navigation[this.props.currentIndex];
    if (!navName) {
      // Launch store isn't set yet
      return <div />;
    }

    const canChangeTestMode =
      this.props.canSetTestMode &&
      navName === 'Configure' &&
      Transcriptic.current_user.is_developer;
    const isAdminAndNotTestOrg = Transcriptic.current_user.system_admin && !Transcriptic.organization.test_account;
    return (
      <div>
        <div className="launch-new-run__warnings">
          {canChangeTestMode && (
            <div className="launch-new-run__test-button-container">
              <Button
                type="default"
                onClick={() => {
                  if (
                    confirm(
                      'Changing between modes will invalidate your existing inputs.  Continue?'
                    )
                  ) {
                    this.toggleTestMode();
                  }
                }}
              >
                {this.state.testMode ? 'End Test Mode' : 'Switch to Test Mode'}
              </Button>
            </div>
          )}
          {this.state.testMode && (
            <div>
              <TestRunBanner />
            </div>
          )}
          {bsl === 2 && (
            <div>
              <BSLRunBanner bsl={bsl} />
            </div>
          )}
          {isAdminAndNotTestOrg && (
            <div>
              <AdminModeBanner />
            </div>
          )}
          {this.renderBody(navName, bsl, orgId)}
        </div>
      </div>
    );
  }
}

LaunchRunSequence.defaultProps = {
  initialTestMode: false
};

LaunchRunSequence.displayName = 'LaunchRunSequence';

LaunchRunSequence.propTypes = {
  manifest: PropTypes.object,
  currentIndex: PropTypes.number,
  project: PropTypes.instanceOf(Immutable.Map).isRequired,
  parameters: PropTypes.object,
  exitDisplay: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  navigation: PropTypes.array,
  canSetTestMode: PropTypes.bool,
  initialTestMode: PropTypes.bool,
  initialPredecessorId: PropTypes.string,
  customInputs: PropTypes.object,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

const ConnectedLaunchRunSequence = ConnectToStoresHOC(
  LaunchRunSequence,
  () => {}
);

class Review extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onPaymentSelected = this.onPaymentSelected.bind(this);
    this.submitRun = this.submitRun.bind(this);

    this.state = {
      paymentMethodId: props.project.get('payment_method_id')
    };
  }

  onPaymentSelected(paymentMethodId) {
    this.setState({
      paymentMethodId
    });
  }

  submitRun() {
    if (LaunchRunStore.hasShippableContainers(this.props.manifest)) {
      this.launchAndMakeShipment().done(() => this.props.onNext());
    } else {
      this.launchRun().done(() => this.props.onNext());
    }
  }

  uploadProtocolFiles(launch_request_id) {
    const uploads = LaunchRunStore.getCsvUploads();
    const uploadPromises = [];

    const processFile = (obj, key, file) => {
      const promise = uploadFile(file, file.name);
      promise.done((resp) => {
        obj[key] = resp.id;
      }).fail(() => {
        delete obj[key];
      });
      uploadPromises.push(promise);
    };

    // recursively upload any csv files in run to s3
    const uploadall = (obj) => {
      for (const k in obj) {
        const val =  obj[k];

        if (!val) {
          delete obj[k];
          continue;
        }

        if (typeof val === 'object' && !val.arrayBuffer) {
          uploadall(val);
        } else {
          processFile(obj, k, val);
        }
      }
    };

    uploadall(uploads);

    // update launch request with upload ids
    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises).then(() =>
        LaunchRequestAPI.update(launch_request_id, {
          input_file_attributes: uploads
        })
      );
    }
  }

  launchAndMakeShipment() {
    const containers = LaunchRunStore.getShippableContainers(
      this.props.manifest
    );
    const shipment = LaunchRunStore.shipmentJSON();
    return LaunchRunActions.createShipment(shipment, containers)
      .done(() => this.launchRun())
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
        RunAnalytics.launchFailed({
          error: `Creating shipment failed: ${text}`,
          response: xhr.responseText
        });
      });
  }

  // Submits the run. Only call this once all validation has been done on run inputs.
  launchRun() {
    return LaunchRunActions.launch({
      manifest: this.props.manifest,
      project: this.props.project,
      launch_request_id: this.props.validator.launch_request_id,
      test_mode: this.props.testMode,
      payment_method_id: this.state.paymentMethodId,
      lab_id: this.state.labId,
      request_date: this.props.requestDate,
      predecessor_id: this.props.predecessorId
    })
      .done((run) => {
        RunAnalytics.launched();
        this.uploadProtocolFiles(run.launch_request_id);
      })
      .fail((xhr, status, text) => {
        if (xhr.status == 402) {
          // Payment Required
          ModalActions.open(PAYMENT_INFO_MODAL_ID);
        } else {
          LaunchRunActions.runSubmissionFailed();
          NotificationActions.handleError(xhr, status, text);
        }

        return RunAnalytics.launchFailed({
          error: text,
          response: xhr.responseText
        });
      });
  }

  render() {
    return (
      <div>
        <RunPreview
          validator={this.props.validator}
          submitRun={this.submitRun}
          submitting={LaunchRunStore.submitting.get()}
          onBack={this.props.onBack}
          test_mode={this.props.testMode}
          bsl={this.props.bsl}
          paymentMethodId={this.state.paymentMethodId}
          onPaymentSelected={this.onPaymentSelected}
          requestDate={this.props.requestDate}
          customInputsConfig={this.props.customInputsConfig}
          customInputs={this.props.customInputs}
          organizationId={this.props.organizationId}
          isImplementationRun={this.props.project.get('is_implementation')}
        />
        <PaymentInfoModal
          modalId={PAYMENT_INFO_MODAL_ID}
          onValidPaymentMethodAdded={() => {
            LaunchRunActions.launch({
              manifest: this.props.manifest,
              project: this.props.project,
              launch_request_id: this.props.validator.launch_request_id
            });
          }}
          onDismissed={LaunchRunActions.runSubmissionFailed}
        />
      </div>
    );
  }
}

Review.displayName = 'Review';

Review.propTypes = {
  onBack: PropTypes.func,
  onNext: PropTypes.func,
  validator: PropTypes.object.isRequired,
  testMode: PropTypes.bool,
  bsl: PropTypes.number.isRequired,
  manifest: PropTypes.object,
  project: PropTypes.instanceOf(Immutable.Map).isRequired,
  customInputsConfig: PropTypes.object,
  customInputs: PropTypes.object,
  predecessorId: PropTypes.string,
  organizationId: PropTypes.string,
  labId: PropTypes.string
};

const ConnectedReview = ConnectToStoresHOC(Review, () => {});

class Configure extends React.Component {
  static get propTypes() {
    return {
      manifest:       PropTypes.object,
      inputs:         PropTypes.object,
      predecessorId:  PropTypes.string,
      testMode:       PropTypes.bool,
      bsl:            PropTypes.number.isRequired,
      onBack:         PropTypes.func,
      onNext:         PropTypes.func,
      backDisplay:    PropTypes.string,
      validator:      PropTypes.object,
      validated:      PropTypes.bool,
      onValidate:     PropTypes.func,
      onInvalidate:   PropTypes.func,
      onNewValidator: PropTypes.func,
      requestDate:    PropTypes.string,
      showRequestDateInputParameters: PropTypes.bool,
      onRequestDateChange: PropTypes.func,
      onToggleRequestDate: PropTypes.func,
      customInputsConfig:  PropTypes.object,
      customInputs:        PropTypes.object,
      csvInputs: PropTypes.object
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onClickValidate     = this.onClickValidate.bind(this);
    this.onChange            = this.onChange.bind(this);
    this.onChangePredecessor = this.onChangePredecessor.bind(this);
    this.getValidator        = this.getValidator.bind(this);
    this.state = {
      validateRunInputs: undefined,
      validateCustomInputs: undefined,
      validatePredecessorInput: undefined
    };
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  async validatePredecessorId() {
    let errorMessage;

    this.setState({
      validatingPredecessor: true
    });

    try {
      const { predecessorId } = this.props;

      if (predecessorId === '') {
        throw new Error('Please enter a Run ID');
      }

      if (predecessorId) {
        try {
          const run = await RunAPI.get(predecessorId);
          if (run.data.attributes.organization_id !== this.props.organizationId) {
            throw new Error();
          }
        } catch (err) {
          throw new Error(`Run ID ${predecessorId} not found in organization. Please specify a valid ID.`);
        }
      }
    } catch (e) {
      errorMessage = e.message;
      NotificationActions.createNotification({
        text: errorMessage,
        isError: true
      });
    } finally {
      this.setState({
        validatePredecessorInput: errorMessage,
        validatingPredecessor: false
      });
    }
  }

  async onClickValidate() {
    await this.validatePredecessorId();

    if (Manifest.hasErrors(this.props.manifest.inputs, this.props.inputs)) {
      this.setState(
        {
          validateRunInputs: true
        },
        () => {
          const errorNode = $('.has-error').first()[0];
          if (errorNode) errorNode.scrollIntoView();
        }
      );
    } else if (!this.state.validatePredecessorInput) {
      const validator = this.getValidator();
      validator.start();
      this.props.onNewValidator(validator);
    }
  }

  // reset validated if user changes inputs after validating
  onChange(inputs, csvInputs) {
    LaunchRunActions.protocolInputsChanged(inputs);
    if (csvInputs) {
      LaunchRunActions.csvUploadChanged(csvInputs);
    }
    return this.props.onInvalidate();
  }

  onChangePredecessor(id) {
    this.props.onPredecessorIdChange(id);

    return this.props.onInvalidate();
  }

  onCustomPropertiesChange(inputs) {
    LaunchRunActions.customPropertiesChanged(inputs);
  }

  getValidator() {
    return new RunValidator({
      manifest:  this.props.manifest,
      inputs:    this.props.inputs,
      test_mode: this.props.testMode,
      bsl:       this.props.bsl,
      organization_id: this.props.organizationId,

      onChange: () => {
        if (this._mounted) {
          this.forceUpdate();
        }
        // It is possible for more than one validator polling request to be in transit
        if (!this.props.validator) return;
        if (this.props.validator.preview && !this.props.validated) {
          this.props.onValidate();
        }
      }
    });
  }

  calculateMinTime(date) {
    const isToday = Moment(date).isSame(Moment(), 'day');
    if (isToday) {
      return Moment();
    }
    return Moment().startOf('day');
  }

  calculateMaxTime(date) {
    return Moment(date).endOf('day');
  }

  getCurrentDate(date) {
    const minTime = Moment(date);
    const isToday = Moment(date).isSame(Moment(), 'day') && minTime.isBefore(Moment());
    let actualDate;
    if (date === undefined) {
      actualDate = undefined;
    } else if (isToday) {
      // Calculate remainder to nearest 30 mins
      const remainder = 30 - (Moment().minute() % 30);
      actualDate = (Moment().add(remainder, 'm')).toDate();
    } else {
      actualDate = minTime.toDate();
    }
    this.props.onRequestDateChange(actualDate);
  }

  renderOptions() {
    const isCCSOrg = SessionStore.hasFeature('ccs_org');
    const { customInputsConfig } = this.props;

    return isCCSOrg || customInputsConfig ? (
      <div className="launch-run">
        <Section title="Options" className="options">
          {isCCSOrg && this.renderRequestDateOption()}
          {customInputsConfig && this.renderCustomProperties()}
        </Section>
      </div>
    ) : null;
  }

  renderCustomProperties() {
    const { customInputsConfig } = this.props;
    return (
      <LaunchRunInputs
        showErrors={this.state.validateCustomInputs}
        inputTypes={customInputsConfig}
        inputs={this.props.customInputs}
        onChange={this.onCustomPropertiesChange}
        test_mode={this.props.testMode}
      />
    );
  }

  renderRequestDateOption() {
    const { showRequestDateInputParameters, onToggleRequestDate } = this.props;

    return (
      <React.Fragment>
        <div className="launch-run options__toggle-with-label">
          <Toggle
            name="request-date-time-toggle"
            value={showRequestDateInputParameters ? 'on' : 'off'}
            onChange={onToggleRequestDate}
          />
          <span>Add Request Date</span>
        </div>
        {showRequestDateInputParameters && (
          <div className="launch-run">
            {this.renderRequestDate()}
            {this.renderRequestTime()}
          </div>
        )}
      </React.Fragment>
    );
  }

  renderPredecessorRun() {
    return (
      <EditPredecessorRun
        predecessorId={this.props.predecessorId}
        onChange={this.onChangePredecessor}
        error={this.state.validatePredecessorInput}
      />
    );
  }

  renderRequestDate() {
    return (
      <div className="request-date-picker">
        <h4 className="tx-type--heavy tx-inline tx-inline--xxxs">
          Request Date
        </h4>
        <DatePicker
          minDate={new Date()}
          date={this.props.requestDate}
          onChange={e => this.getCurrentDate(e.target.value.date)}
          isSelectField
          popperPlacement="right"
        />
      </div>
    );
  }

  renderRequestTime() {
    return (
      <div className="request-time-picker">
        <h4 className="tx-type--heavy tx-inline tx-inline--xxxs">
          Request Time
        </h4>
        <DatePicker
          isTimeSelector
          date={this.props.requestDate}
          minTime={this.calculateMinTime(this.props.requestDate)}
          maxTime={this.calculateMaxTime(this.props.requestDate)}
          onChange={e => this.props.onRequestDateChange(e.target.value.date)}
          isSelectField
          popperPlacement="right"
        />
      </div>
    );
  }

  render() {
    const hasValidator = this.props.validator != undefined;
    const validatorRunning = hasValidator
      ? this.props.validator.running
      : undefined;

    let nextBtnName;
    if (this.props.validated) {
      nextBtnName = 'Next';
    } else if (hasValidator && this.props.validator.running) {
      nextBtnName = 'Validating';
    } else {
      nextBtnName = 'Validate';
    }

    const isAdminAndNotTestOrg = Transcriptic.current_user.system_admin && !Transcriptic.organization.test_account;

    return (
      <div className="standard-protocol-inputs">
        <div id="launch">
          <LaunchRunInputs
            showErrors={this.state.validateRunInputs}
            inputTypes={this.props.manifest.inputs}
            inputs={this.props.inputs}
            organizationId={this.props.organizationId}
            labId={this.props.labId}
            onChange={this.onChange}
            test_mode={this.props.testMode}
            csvInputs={this.props.csvInputs}
          />
          <Divider size="medium" />
          <div className="launch-run">
            {this.renderPredecessorRun()}
          </div>
          {this.renderOptions()}
          {this.props.validator != undefined && (
            <div className="modal-body">
              <ValidationProgress validator={this.props.validator} />
            </div>
          )}
          <div className="validation-footer">
            <MultiStepModalPane
              onNavigateNext={
                this.props.validated ? this.props.onNext : this.onClickValidate
              }
              nextBtnName={nextBtnName}
              backBtnName={this.props.backDisplay}
              btnClass="btn-medium"
              waitingOnResponse={
                hasValidator ? this.props.validator.running : this.state.validatingPredecessor
              }
              nextBtnDisabled={
                validatorRunning || isAdminAndNotTestOrg
              }
              nextBtnDisabledText={
                isAdminAndNotTestOrg
                  ? 'Admins cannot launch runs'
                  : undefined
              }
              onNavigateBack={this.props.onBack}
              backBtnDisabled={validatorRunning}

            />
          </div>
        </div>
      </div>
    );
  }
}

const ConnectedConfigure = ConnectToStoresHOC(Configure, () => {});

export default ConnectedLaunchRunSequence;
