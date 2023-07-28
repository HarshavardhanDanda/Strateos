import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { Card, Spinner, Page, PizzaTracker } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import NotificationActions from 'main/actions/NotificationActions';
import ProjectActions from 'main/actions/ProjectActions';
import RunActions from 'main/actions/RunActions';
import CompoundAPI from 'main/api/CompoundAPI.js';
import BatchAPI from 'main/api/BatchAPI.js';
import LibraryAPI from 'main/api/LibraryAPI';
import SynthesisProgramAPI from 'main/api/SynthesisProgramAPI';
import AccessControlActions from 'main/actions/AccessControlActions';
import { TabLayout } from 'main/components/TabLayout';
import ReactionAPI from './ReactionAPI';
import ReactionPageHeader from './ReactionPageHeader';
import ReactionPageConfiguration from './ReactionPageConfiguration';
import ReactionPageSummary from './ReactionPageSummary';
import './ReactionPage.scss';
import { PageLayout } from '../../components/PageLayout';

// Top level page for reaction preview and submission (to create a run)
function ReactionPage(props) {
  const [isFetching, setIsFetching] = useState(true);
  const [reaction, setReaction] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [projectData, setProjectData] = useState(undefined);
  const [runData, setRunData] = useState(undefined);
  const [synthesisProgramId, setSynthesisProgramId] = useState(undefined);
  const [synthesisPrograms, setSynthesisPrograms] = useState([]);
  const [progressBarIndex, setProgressBarIndex] = useState(0);
  const [configStepIndex, setConfigStepIndex] = useState(0);
  const [polling, setPolling] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reactionId = props.match.params.reactionId;
  const reactionAPI = props.ReactionAPI || ReactionAPI;

  useEffect(async () => {
    if (!reactionId || !isFetching) return;

    try {
      const reactionFetched = await getReaction(reactionId);
      const { createdBy, status, projectId, runId, batchId, requesterUserId } = reactionFetched;
      let projectName = '';

      if (status === 'RUN_CREATED') {
        setProgressBarIndex(2);
        setConfigStepIndex(1);
      }

      if (projectId && runId) {
        const run = await getRun(projectId, runId);
        setRunData(run);
      }

      if (projectId && !projectData) {
        const project = await getProject(projectId);
        setProjectData(project);
        projectName = project.name;
      }

      if (!user) {
        const reactionCreator = await getReactionCreator(createdBy);
        setUser(reactionCreator);
      }

      if (!reaction) {
        const compoundId = reactionFetched.products[0].compound.linkId;

        const compound = await getCompound(compoundId);
        const userIDs = await getUserIDs();
        const COIIDs = compound.data.attributes.external_system_ids;
        const orgID = compound.data.attributes.organization_id || userIDs[0].contextId;
        const external_system_id = _.isEmpty(COIIDs) ? '' : COIIDs.find(coiid => coiid.organization_id === orgID).external_system_id;

        const users = await getUsers(userIDs);

        const requester = requesterUserId ? users.find(user => user.value === requesterUserId) : {};

        const organization_id = compound.data.attributes.organization_id;
        const batch = batchId ? await getBatch(batchId) : undefined;
        const synthProgramFromBatch = batch ? batch.data.relationships.synthesis_program.data : undefined;
        const product_type = batch ? batch.data.attributes.product_type || 'FINAL_PRODUCT' : 'FINAL_PRODUCT';

        const response = await LibraryAPI.getLibraries({ compound_id: compoundId });
        const libraries = response.data;
        const synthesisPrograms = await getSynthesisPrograms(organization_id);
        setSynthesisPrograms(synthesisPrograms);
        if (synthProgramFromBatch) {
          setSynthesisProgramId(synthProgramFromBatch.id);
        }

        const updatedReaction = _.assignIn(reactionFetched, {
          product_type,
          organization_id,
          compound,
          external_system_id,
          users,
          requester,
          projectName,
          libraries,
          batch,
          temperature: 'Ambient',
          containerType: ['A1 Vial'],
          solvent: 'DMSO',
          form: 'DMSO',
          concentration: 10,
        });
        setReaction(updatedReaction);
      } else {
        setReaction(_.assignIn(reaction, reactionFetched));
      }

    } catch (e) {
      NotificationActions.handleError(e);
    } finally {
      setIsFetching(false);
      setIsSubmitting(false);
    }
  }, [reactionId, isFetching]);

  useEffect(() => {
    if (!reaction) return;
    const isNotEditable = reaction.status === 'SUBMITTED' || reaction.status === 'RUN_CREATED' || isFetching || polling;
    setReadOnly(isNotEditable);
  }, [isFetching, polling]);

  useEffect(
    () => {
      if (!polling || !reaction) return;
      reactionAPI.pollForRun(reaction.id)
        .then(
          (res) => {
            setIsFetching(true);
            if (res != true) {
              NotificationActions.createNotification({
                text: 'Run could not be created',
                isError: true
              });
            }
          },
          (e) => {
            NotificationActions.createNotification({
              text: `Failed to get run: ${e}`,
              isError: true
            });
          }
        )
        .finally(() => setPolling(false));
    },
    [polling]
  );

  const getReaction = (reactionId) => {
    try {
      return reactionAPI.get(reactionId);
    } catch (e) {
      NotificationActions.createNotification({
        text: `Failed to fetch reaction due to ${e.message}`,
        isError: true
      });
    }
  };

  const getReactionCreator = (userId) => {
    try {
      return UserActions.load(userId);
    } catch (e) {
      NotificationActions.createNotification({
        text: `Failed to fetch user ${userId} due to ${e.message}`,
        isError: true
      });
    }
  };

  const getProject = (projectId) => {
    try {
      return ProjectActions.load(projectId);
    } catch (e) {
      NotificationActions.createNotification({
        text: `Failed to fetch project ${projectId} due to ${e.message}`,
        isError: true
      });
    }
  };

  const getRun = (projectId, runId) => {
    try {
      return RunActions.load(projectId, runId);
    } catch (e) {
      NotificationActions.createNotification({
        text: `Failed to fetch run ${runId} due to ${e.message}`,
        isError: true
      });
    }
  };

  const getCompound = (compoundId) => {
    try {
      return CompoundAPI.get(compoundId);
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const getUserIDs = () => {
    try {
      return AccessControlActions.loadPermissions({});
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const getBatch = (batchId) => {
    try {
      return BatchAPI.get(batchId, { version: 'v1', includes: ['synthesis_program'] });
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const getUsers = async (userIDs) => {
    try {
      const allUsers = await UserActions.loadUsers(_.map(userIDs, 'userId'));
      const filteredUsers = _.uniqBy(allUsers, 'name');
      return filteredUsers.reduce((userList, user) => [...userList, { value: user.id, name: user.name }], []);
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const getSynthesisPrograms = async (organization_id) => {
    try {
      const response = await SynthesisProgramAPI.getSynthesisProgramByOrganization(organization_id);
      return response.data;
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const setActiveStepIndex = (index, runStatus) => {
    if (runStatus !== 'RUN_CREATED') {
      setProgressBarIndex(index);
    }
    setConfigStepIndex(index);
  };

  const onSelectSynthesisProgram = async (event) => {
    const value = event.target.value;
    let updatedSynthesisProgram;

    if (value === synthesisProgramId) {
      return;
    }

    if (synthesisProgramId) {
      try {
        await SynthesisProgramAPI.removeBatchFromSynthesisProgram(synthesisProgramId, reaction.batch.data.id);
        updatedSynthesisProgram = null;
      } catch (e) {
        NotificationActions.handleError(e);
      }
    }

    if (value) {
      try {
        await SynthesisProgramAPI.addBatchToSynthesisProgram(value, reaction.batch.data.id);
        updatedSynthesisProgram = value;
      } catch (e) {
        NotificationActions.handleError(e);
      }
    }

    if (updatedSynthesisProgram !== undefined) {
      setSynthesisProgramId(updatedSynthesisProgram);
    }

    const batch = await getBatch(reaction.batch.data.id);
    if (batch) {
      const updatedReaction = _.assignIn(reaction, { batch });
      setReaction(updatedReaction);
    }
  };

  const buildSynthesisProgramOptions = (synthesisPrograms) => {
    return synthesisPrograms.map((synthesisProgram) =>
      ({
        value: synthesisProgram.id,
        name: synthesisProgram.attributes.name
      })
    );
  };

  const isMaterialResolved = () => {
    const unresolvedMaterial = _.find(reaction.reactants, reactant => !reactant.additionalProperties.pin && !reactant.source);
    return unresolvedMaterial === undefined;
  };

  const renderSteps = () => {
    return configStepIndex === 0 ? (
      <ReactionPageConfiguration
        setActiveStepIndex={setActiveStepIndex}
        reaction={reaction}
        projectData={projectData}
        setReaction={setReaction}
        readOnly={readOnly}
        selectedSynthesisProgram={synthesisProgramId}
        synthesisPrograms={buildSynthesisProgramOptions(synthesisPrograms)}
        onSelectSynthesisProgram={onSelectSynthesisProgram}
      />
    ) : (
      <ReactionPageSummary
        reaction={reaction}
        user={user}
        fetchReaction={() => {
          setIsFetching(true);
        }}
        onReactionFetched={setReaction}
        isFetchingUpdatedReaction={isFetching}
        reactionAPI={reactionAPI}
        setActiveStepIndex={setActiveStepIndex}
        isMaterialResolved={isMaterialResolved}
        setReaction={setReaction}
        setPolling={setPolling}
        polling={polling}
        setIsSubmitting={setIsSubmitting}
      />
    );
  };

  if (!reactionId) return <Card>A reaction id is required.</Card>;

  if (reaction && user) {
    return (
      <div className="reaction-preview-page">
        <Page title="Reaction">
          <PageLayout
            PageHeader={(
              <ReactionPageHeader
                user={user}
                status={isSubmitting ? 'SUBMITTED' : reaction && reaction.status}
                materialsResolved={isMaterialResolved()}
                timestamp={reaction && reaction.createdOn}
                run={runData}
                project={projectData}
              />
            )}
            className
          >
            <TabLayout>
              <Card>
                <section className="reaction-preview-page--progress-bar">
                  <PizzaTracker
                    steps={[
                      { title: 'Additional Configuration' },
                      { title: 'Summary Review' },
                    ]}
                    activeStepIndex={reaction.status === 'RUN_CREATED' ? 2 : progressBarIndex}
                    onChange={(index) => setActiveStepIndex(index)}
                  />
                </section>
                <section>
                  {renderSteps()}
                </section>
              </Card>
            </TabLayout>
          </PageLayout>
        </Page>
      </div>
    );
  } else if (isFetching) {
    return <Spinner />;
  } else {
    return <Page statusCode={404} />; // todo: this could also be a 500, need to get error message from backend
  }
}

export default ReactionPage;
