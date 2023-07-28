import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Spinner,
  Card,
  ReactionPreview,
  Divider,
  Button,
  SinglePaneModalContent,
  ZeroState,
  PizzaTracker,
  Banner,
} from '@transcriptic/amino';
import NotificationActions from 'main/actions/NotificationActions';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants     from '@strateos/features';
import FeatureStore         from 'main/stores/FeatureStore';
import CompoundAPI from 'main/api/CompoundAPI';
import { CompoundSourceSelectorEMoleculesModalActions } from './CompoundSourceSelector/CompoundSourceEmoleculesActions';
import ReactantTable from './ReactantTable';
import ProductTable from './ProductTable';
import SolventTable from './SolventTable';
import SubmitButton from './SubmitButton';
import RunLink from './RunLink';
import MaterialComponent from './MaterialComponent';
import { ReactionAPI } from './ReactionAPI';
import { getEMolecules } from './EMoleculesAPI';
import './ReactionPageSummary.scss';

export const submitReactionDisabledToolTip = 'Looks like you need permission to submit reaction: Please contact your admin';

// Review a reaction and potentially submit it to be turned into a run
export default function ReactionPageSummary({
  reaction,
  setReaction,
  isFetchingUpdatedReaction,
  reactionAPI,
  setActiveStepIndex,
  isMaterialResolved,
  polling,
  setPolling,
  setIsSubmitting,
}) {
  // immediately start polling for the run if it is in "SUBMITTED" state
  const [labId, setLabId] = useState();
  const [disableEditOnSubmission, setDisableEditOnSubmission] = useState(reaction.status === 'SUBMITTED' || reaction.status === 'RUN_CREATED' || isFetchingUpdatedReaction);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationInfo, setValidationInfo] = useState({
    title: '',
    subTitle: '',
    error: null,
    activeStepIndex: 0,
    failedStepIndex: -1,
  });

  const canSubmitReaction = FeatureStore.hasFeature(FeatureConstants.EDIT_SUBMIT_REACTION);
  const isSubmitting = polling || isFetchingUpdatedReaction;

  useEffect(
    () => {
      LabConsumerActions.loadLabsForCurrentOrg().done(() => {
        const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
        if (firstLabConsumer) {
          setLabId(firstLabConsumer.getIn(['lab', 'id']));
        }
      });
    }, []
  );

  useEffect(
    () => {
      if (isSubmitting) {
        setDisableEditOnSubmission(true);
      } else if (!isFetchingUpdatedReaction) {
        setDisableEditOnSubmission(reaction.status === 'SUBMITTED' || reaction.status === 'RUN_CREATED');
      }
      if (reaction.status === 'RUN_CREATED') {
        const validation = getValidationInfo('success');
        setValidationInfo(validation);
      }
      if (reaction.status === 'SUBMITTED_WITH_ERRORS') {
        const validation = getValidationInfo('error', reaction.submissionErrors);
        setValidationInfo(validation);
      }
    }, [polling, isFetchingUpdatedReaction]
  );

  useEffect(
    () => {
      const orgId = SessionStore.getOrg().get('id');
      const searchTypes = ['EXACT', 'ALTERNATE'];
      const reactants = reaction.reactants.filter(reactant => !reactant.additionalProperties.pin);
      Promise.all(
        searchTypes.map(searchType => {
          return reactants.map((reactant) =>
            getEMolecules(orgId, reactant.originalCompound.smiles, searchType)
              .then((results) => {
                return { searchType: searchType, smiles: reactant.originalCompound.smiles, data: CompoundSourceSelectorEMoleculesModalActions.parseEMolecules(results) };
              })
              .fail((_) => {
                return null;
              })
          );
        })
      )
        .then((results) => {
          results.flat().forEach(result => {
            result.done(structure => {
              if (!CompoundSourceSelectorEMoleculesModalActions.searchOptions().eMoleculesData.getIn([structure.searchType, structure.smiles])) {
                CompoundSourceSelectorEMoleculesModalActions.updateState({
                  eMoleculesData: CompoundSourceSelectorEMoleculesModalActions.searchOptions().eMoleculesData
                    .setIn([structure.searchType, structure.smiles], structure.data)
                });
              }
            });
          });
        });
    }, []
  );

  useEffect(() => {
    const reactants = reaction.reactants.filter(reactant => !reactant.additionalProperties.pin);
    const smilesArray = _.map(reactants, 'smiles');
    const encodedSmilesArray = smilesArray.map(smile => encodeURIComponent(smile));
    CompoundAPI.index({
      filters: {
        smiles: encodedSmilesArray.join(),
        source: 'public'
      }
    });
  }, []);

  const updateReactants = (newReactant) => {
    const reactants = reaction.reactants.map(reactant => (newReactant.id === reactant.id ? newReactant : reactant));
    setReaction({ ...reaction, reactants: reactants });
    NotificationActions.createNotification({
      text: 'Material resolved successfully!',
      isSuccess: true,
    });
  };

  const buttonDisableTooltip = () => {
    if (!canSubmitReaction) {
      return submitReactionDisabledToolTip;
    } else if (isSubmitting) {
      return 'Reaction being submitted';
    } else if (!reaction.projectId) {
      return 'Select a project';
    } else if (reaction.status === 'SUBMITTED' || reaction.status === 'RUN_CREATED') {
      return 'Reaction already submitted';
    } else if (!isMaterialResolved()) {
      return 'Resolve all materials';
    } else if (!reaction.batch) {
      return 'Reaction is out-of-date (no batch) and cannot be submitted. Please create a new reaction and try again.';
    }
    return undefined;
  };

  const getValidationInfo = (status, error = null) => {
    switch (status) {
      case 'inProgress':
        return {
          title: 'Your reaction is being validated!',
          subTitle: 'You can access your run link once the validation is complete.',
          error,
          activeStepIndex: 0,
          failedStepIndex: -1,
        };
      case 'success':
        return {
          title: 'Great work ! You have successfully resolved materials and your run is being submitted.',
          subTitle: 'You will receive an email confirmation with your reaction summary and run reference ID. We will notify you once your run is complete. You will now be directed to your run page.',
          error,
          activeStepIndex: 1,
          failedStepIndex: -1,
        };
      case 'error':
        return {
          title: 'Unfortunately, your reaction could not be submitted.',
          subTitle: <span>We’ve encountered issues with your submission , please correct the errors and resubmit or contact our <a href="https://support.strateos.com">support team</a></span>,
          error,
          activeStepIndex: 1,
          failedStepIndex: 0,
        };
    }
  };

  // eln adapter does the validation to ensure one and only one limiting reagent is present
  let limitingReagent = _.find(reaction.reactants, reactant => reactant.limiting);
  limitingReagent = { ...limitingReagent.compound, reagentId: limitingReagent.refRxnId };

  // eln adapter does the validation to ensure that there is at least one nonLimitingReagent
  const nonLimitingReagents = reaction.reactants.reduce((result, reactant) => {
    if (!reactant.limiting) result.push({ ...reactant.compound, reagentId: reactant.refRxnId });
    return result;
  }, []);

  const finalProduct = { ...reaction.products[0].compound, reagentId: reaction.products[0].refRxnId };
  const bannerMessage = (_.isEmpty(reaction.submissionErrors) || _.isString(reaction.submissionErrors))
    ? ''
    : reaction.submissionErrors.map(error => error.message || error).join(', ');

  const setSubmitting = () => {
    setReaction({
      ...reaction,
      status: 'SUBMITTED',
      submissionErrors: [],
    });
    const validation = getValidationInfo('inProgress');
    setValidationInfo(validation);
    setShowValidationModal(true);
    setIsSubmitting(true);
  };

  return (
    <div className="reaction-page-summary">
      <SinglePaneModalContent
        modalSize="large"
        title="Validation"
        modalOpen={showValidationModal}
        onDismissed={(isSubmitting) ? () => {} : () => setShowValidationModal(false)}
      >
        <ZeroState
          title={validationInfo.title}
          subTitle={validationInfo.subTitle}
          zeroStateSvg="/images/devices-illustration.svg"
        />
        <PizzaTracker
          steps={[{ title: '', iconClass: '.' }]}
          activeStepIndex={validationInfo.activeStepIndex}
          color="green"
          failedStepIndex={validationInfo.failedStepIndex}
        />
        {!_.isEmpty(reaction.submissionErrors) && (
          <Banner
            bannerType="error"
            bannerMessage={bannerMessage}
          />
        )}
        <div className="reaction-page-summary--modal-button">
          <Button
            heavy
            size="small"
            type="primary"
            onClick={() => setShowValidationModal(false)}
            disabled={isSubmitting}
          >Ok, got it
          </Button>
        </div>
      </SinglePaneModalContent>
      <div
        className="run-link"
      >
        <div>
          <h3 className="run-label">RUN</h3>
          {
            (isSubmitting)
              ? <Spinner size="small" />
              : <RunLink runId={reaction.runId} projectId={reaction.projectId} />
          }
        </div>
      </div>
      <div className="reaction-page-summary__card">
        <MaterialComponent
          materials={reaction.reactants}
          updateReactants={updateReactants}
          reactionId={reaction.id}
          labId={labId}
          disableUpdateColumn={disableEditOnSubmission}
        />
      </div>
      <div className="reaction-page-summary__card">
        <Card>
          <h2 className="reaction-page-summary__card-title">Reaction Summary</h2>
          <Divider slim size="small" />
          <div>
            <label className="top-field-label">SYNTHESIS</label>
            <ReactionPreview
              limitingReagent={limitingReagent}
              nonLimitingReagents={nonLimitingReagents}
              additionalReagents={reaction.solvents.map(solvent => solvent.resource.name)}
              reactionTime={reaction.conditions ? reaction.conditions.duration : reaction.conditions}
              reactionTemperature={reaction.conditions ? reaction.conditions.temperature : reaction.conditions}
              reactionReactor={reaction.conditions ? reaction.conditions.reactorType : reaction.conditions}
              finalProduct={finalProduct}
            />
          </div>
          <div className="reactants">
            <label>REACTANTS</label>
            <div className="reactants__table">
              <ReactantTable
                reactants={reaction.reactants}
              />
            </div>
          </div>
          <div className="product">
            <label>PRODUCT</label>
            <div className="product__table">
              <ProductTable
                product={reaction.products}
              />
            </div>
          </div>
          <div className="solvent">
            <div>
              <label>SOLVENT</label>
              <div className="solvent__table">
                <SolventTable
                  solvents={reaction.solvents}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="reaction-page-summary__footer">
        <Button
          link
          heavy
          size="small"
          type="primary"
          onClick={() => setActiveStepIndex(0, reaction.status)}
        >Back
        </Button>
        <SubmitButton
          disabled={disableEditOnSubmission || !reaction.projectId || !isMaterialResolved() || !canSubmitReaction || !reaction.batch}
          reactionId={reaction.id}
          label={buttonDisableTooltip()}
          onSuccess={() => {
            setPolling(true);
          }}
          onFailure={(reason) => {
            NotificationActions.createNotification({
              text: `Failed to submit reaction: ${reason}`,
              isError: true
            });
          }}
          ReactionAPI={reactionAPI}
          setSubmitting={setSubmitting}
        />
      </div>
    </div>
  );
}

ReactionPageSummary.propTypes = {
  reaction: PropTypes.object.isRequired,
  reactionAPI: PropTypes.instanceOf(ReactionAPI).isRequired,
  isFetchingUpdatedReaction: PropTypes.bool.isRequired,
  isMaterialResolved: PropTypes.func.isRequired,
  setActiveStepIndex: PropTypes.func.isRequired,
  polling: PropTypes.bool.isRequired,
  setPolling: PropTypes.func.isRequired,
  setIsSubmitting: PropTypes.func.isRequired,
};
