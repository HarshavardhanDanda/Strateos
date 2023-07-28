import React, { useState, useEffect } from 'react';
import {
  Button,
  ButtonGroup,
  Divider,
  LabeledInput,
  TextInput,
  RadioGroup,
  Radio,
  DataTable,
  EditActionButtons,
  TagInput,
  TypeAheadInput,
  Select
} from '@transcriptic/amino';
import _ from 'lodash';
import './ReactionPageConfiguration.scss';
import BatchAPI from 'main/api/BatchAPI.js';
import LibraryAPI from 'main/api/LibraryAPI';
import CompoundAPI from 'main/api/CompoundAPI';
import NotificationActions from 'main/actions/NotificationActions';
import classNames from 'classnames';
import ReactionAPI from './ReactionAPI';
import ProjectSelector from './ProjectSelector';
import {
  TextField,
  Concentration,
} from './ReactionPageConfigurationComponents/ConfigInputs';

export default function ReactionPageConfiguration({
  setActiveStepIndex,
  reaction,
  setReaction,
  readOnly,
  synthesisPrograms,
  onSelectSynthesisProgram,
  selectedSynthesisProgram
}) {

  const [coiID, setCOIID] = useState('');
  const [showCOIEditButton, setShowCOIEditButton] = useState('hidden');
  const [requesterInput, setRequesterInput] = useState('');
  const [originalRequester, setOriginalRequester] = useState({});
  const [requesterSuggestions, setRequesterSuggestions] = useState([]);
  const [originalProjectName, setOriginalProjectName] = useState('');
  const [libraryKeyWords, setLibraryKeyWords] = useState('');
  const [debouncedLibKeyWords, setDebouncedLibKeyWords] = useState('');
  const [librarySuggestions, setLibrarySuggestions] = useState([]);

  useEffect(() => {
    setOriginalRequester(reaction.requester);
    setRequesterInput(reaction.requester.name);
    setOriginalProjectName(reaction.projectName);
  }, []);

  useEffect(() => {
    _.debounce(setDebouncedLibKeyWords, 300)(libraryKeyWords);
  }, [libraryKeyWords]);

  useEffect(() => {
    getLibrarySuggestions(debouncedLibKeyWords);
  }, [debouncedLibKeyWords]);

  const saveRequester = async (selectedUser) => {
    const { value } = selectedUser;
    if (!_.find(reaction.users, ['value', value]) && value !== '') {
      NotificationActions.createNotification({
        isError: true,
        text: `${selectedUser} does not exist`
      });
      setRequesterInput(originalRequester.name);
    } else {
      try {
        await ReactionAPI.updateProject(reaction.id,
          [
            {
              op: 'replace',
              path: '/requesterUserId',
              value: selectedUser.value,
            }
          ]
        );
        setRequesterInput(selectedUser.name);
        const text = selectedUser.name ? `${selectedUser.name} selected` : `${originalRequester.name} removed`;
        NotificationActions.createNotification({
          text,
          isSuccess: true,
        });
        setReaction({
          ...reaction,
          requester: selectedUser,
          requesterUserId: selectedUser.value
        });
        setOriginalRequester(selectedUser);
      } catch (e) {
        setRequesterInput(originalRequester.name);
        NotificationActions.createNotification({
          text: 'Failed to select requester',
          isError: true,
        });
      }
    }
  };

  const suggest = (e) => {
    const { value } = e.target;
    if (!reaction || value === undefined) return;
    setRequesterInput(value);
    const filteredUsers = reaction.users.filter(user => user.name.includes(_.capitalize(value)));
    const suggestions = value ? filteredUsers : reaction.users;
    const users = _.sortBy(suggestions, ['name']);
    setRequesterSuggestions(users);
  };

  const saveCOIID = async () => {
    if (!coiID) return;
    try {
      const attributes = {
        external_system_id: coiID,
      };
      await CompoundAPI.updateCompound(reaction.compound.data.id, attributes);
      setReaction({
        ...reaction,
        external_system_id: coiID,
      });
      setShowCOIEditButton('hidden');
      NotificationActions.createNotification({
        text: `${coiID} set successfully`,
        isSuccess: true,
      });
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const getLibrarySuggestions = async () => {
    const name = debouncedLibKeyWords;
    if (!name.trim() || libraryKeyWords !== name) return;
    try {
      const suggestions = await LibraryAPI.getLibraries({ name });
      setLibrarySuggestions(suggestions.data);
    } catch (e) {
      NotificationActions.createNotification({
        text: 'Failed to get library suggestions',
        isError: true
      });
    }
  };

  const createLibrary = async (name) => {
    const isAssociated = reaction.libraries.find(library => library.attributes.name === name);
    const selectedLibrary = librarySuggestions.find(library => library.attributes.name === name);
    if (isAssociated) {
      NotificationActions.createNotification({
        text: `Library with name ${name} is already associated with the product compound.`,
        isError: true,
      });
    } else if (!selectedLibrary) {
      try {
        const payload = {
          data: {
            type: 'libraries',
            attributes: {
              name,
            },
            relationships: {
              compounds: {
                data: [
                  {
                    type: 'compounds',
                    id: reaction.compound.data.id
                  }
                ]
              }
            }
          }
        };
        const newLibrary = await LibraryAPI.createLibrary(payload);
        displayNewLibrary(newLibrary.data);
        NotificationActions.createNotification({
          text: `${name} successfuly added.`,
          isSuccess: true,
        });
      } catch (e) {
        NotificationActions.handleError(e);
      }
    } else {
      selectLibrary(selectedLibrary);
    }
  };

  const selectLibrary = async (library) => {
    try {
      await LibraryAPI.addCompoundsToLibrary([reaction.compound.data.id], library.id);
      displayNewLibrary(library);
      NotificationActions.createNotification({
        text: `Product compound added to library ${library.attributes.name}`,
        isSuccess: true,
      });
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const displayNewLibrary = (library) => {
    const libraries = reaction.libraries;
    libraries.push(library);
    setReaction({
      ...reaction,
      libraries,
    });
  };

  const removeLibrary = async (index) => {
    const libraries = reaction.libraries;
    const library = libraries[index];
    try {
      await LibraryAPI.removeCompoundsFromLibrary([reaction.compound.data.id], library.id);
      libraries.splice(index, 1);
      setReaction({
        ...reaction,
        libraries,
      });
      NotificationActions.createNotification({
        text: `Product compound removed from library ${library.attributes.name}`,
        isSuccess: true,
      });
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const updateProductType = async (e) => {
    try {
      const { value } = e.target;
      const type = value === 'INTERMEDIATE_PRODUCT' ? 'Intermediate' : 'Final';
      const attributes = {
        product_type: value
      };
      await BatchAPI.update(reaction.batchId, attributes, { version: 'v1' });
      setReaction({
        ...reaction,
        product_type: value
      });
      NotificationActions.createNotification({
        text: `${type} product type selected`,
        isSuccess: true
      });
    } catch (e) {
      NotificationActions.handleError(e);
    }
  };

  const updateProject = (newProject) => {
    const { value, name } = newProject;
    setReaction({
      ...reaction,
      projectName: name,
      projectId: value,
    });
    ReactionAPI.updateProject(reaction.id,
      [
        {
          op: 'replace',
          path: '/projectId',
          value: newProject.value
        }
      ]
    )
      .then(
        (_) => {
          setOriginalProjectName(name);
          NotificationActions.createNotification({
            text: 'Project updated successfully!',
            isSuccess: true,
          });
        }
      ).fail(
        (..._) => {
          NotificationActions.createNotification({
            text: 'Failed to update project',
            isError: true,
          });
          setReaction({
            ...reaction,
            projectName: originalProjectName,
          });
        }
      );
  };

  const coiEditable = !reaction.external_system_id;

  const storageCondition = [{
    Concentration: <Concentration reaction={reaction} />,
    Solvent: <TextField placeholder={reaction.solvent} />,
    'Container type': <TextField placeholder={reaction.containerType} />,
    Temperature: <TextField placeholder={reaction.temperature} />,
  }];

  return (
    <div className="reaction-page-configuration">
      <section className="reaction-page-configuration__product-section">
        <div>
          <h2 className="reaction-page-configuration__title">Let’s start by setting up some basic information for your reaction</h2>
          <Divider size="medium" slim />
        </div>
        <div className="reaction-page-configuration__inputs-container">
          <div className="reaction-page-configuration__inputs">
            <LabeledInput label="Requester">
              <TypeAheadInput
                name="requesterUserId"
                placeholder={'Start by selecting the requester for this reaction'}
                value={requesterInput}
                suggestions={requesterSuggestions}
                onChange={(e) => suggest(e)}
                onSuggestedSelect={(selectedUser) => saveRequester(selectedUser)}
                onClear={() => saveRequester({ name: '', value: '' })}
                disabled={readOnly}
              />
            </LabeledInput>
          </div>
          <div className="reaction-page-configuration__inputs">
            <LabeledInput label="Experiment Name">
              <TextInput name="experiment-name" disabled value={reaction.name} />
            </LabeledInput>
          </div>
          <div className="reaction-page-configuration__inputs">
            <LabeledInput label="Project Name">
              <ProjectSelector
                placeholder="Start by typing your Strateos project name"
                projectName={reaction.projectName}
                updateProject={updateProject}
                disabled={readOnly}
              />
            </LabeledInput>
          </div>
          <div className="reaction-page-configuration__inputs">
            <LabeledInput label="Synthesis Program">
              <Select
                value={selectedSynthesisProgram}
                options={synthesisPrograms}
                onChange={onSelectSynthesisProgram}
                disabled={_.isEmpty(synthesisPrograms) || readOnly}
                nullable
              />
            </LabeledInput>
          </div>
        </div>
      </section>
      <section className="reaction-page-configuration__product-section">
        <div>
          <h2 className="reaction-page-configuration__title">Configure details for your synthesized product</h2>
          <Divider size="medium" />
        </div>
        <div className="reaction-page-configuration__inputs-container">
          <div className="reaction-page-configuration__inputs">
            <LabeledInput label="Library number" tip="Start typing and choose an existing library number from the dropdown list or hit enter to add a new library number" icon="info">
              <TagInput
                onCreate={name => createLibrary(name)}
                onChange={text => setLibraryKeyWords(text)}
                emptyText="Start by typing a library name"
                suggestions={librarySuggestions.map(library => library.attributes.name)}
                disabled={readOnly}
              >
                {
                  reaction.libraries.map(
                    (tag, i) => {
                      const tagKey = `tag${i}`;
                      return (<TagInput.Tag text={tag.attributes.name} key={tagKey} onRemove={() => removeLibrary(i)} />);
                    }
                  )
                }
              </TagInput>
            </LabeledInput>
          </div>
          <div className="reaction-page-configuration__inputs-group">
            <div
              className="reaction-page-configuration__inputs"
              onClick={() => {
                if (!reaction.external_system_id && !readOnly) {
                  setShowCOIEditButton('show');
                }
              }}
            >
              <LabeledInput label="Product Compound External Reference ID" tip="Product Compound External Reference ID cannot be modified after it is assigned." disableFormatLabel icon="info">
                <TextInput
                  value={reaction.external_system_id || coiID}
                  disabled={!coiEditable || readOnly}
                  fullWidth
                  onChange={(e) => setCOIID(e.target.value)}
                />
              </LabeledInput>
            </div>
            <div className={classNames(
              'reaction-page-configuration__editButtons',
              `reaction-page-configuration__editButtons--${showCOIEditButton}`,
            )}
            >
              <EditActionButtons
                status="editing"
                onSave={() => saveCOIID()}
                onCancel={() => setCOIID('')}
              />
            </div>
          </div>
        </div>
        <div className="reaction-page-configuration__item-group">
          <h3 className="reaction-page-configuration__item-title">How will your final compound be used?</h3>
          <div>
            <RadioGroup
              name="product_type"
              value={reaction.product_type}
              onChange={(e) => updateProductType(e)}
            >
              <Radio id="final" name="final" value="FINAL_PRODUCT" label="Final Product" disabled={readOnly} />
              <Radio id="intermediate" name="intermediate" value="INTERMEDIATE_PRODUCT" label="Intermediate Product" disabled={readOnly} />
            </RadioGroup>
          </div>
        </div>
        <div className="reaction-page-configuration__item-group">
          <h3 className="reaction-page-configuration__item-title">Storage Conditions</h3>
          <div className="reaction-page-configuration__table__container">
            <div className="reaction-page-configuration__table__table-content">
              <DataTable
                data={storageCondition}
                headers={Object.keys(storageCondition[0])}
                theme="grey"
                border={false}
                headerHeight={40}
                rowHeight={60}
              />
            </div>
            <div className="reaction-page-configuration__table__overlay" />
          </div>
        </div>
      </section>
      <section className="reaction-page-configuration__buttons">
        <ButtonGroup orientation="horizontal">
          <Button
            heavy
            size="small"
            type="primary"
            onClick={() => setActiveStepIndex(1, reaction.status)}
          >Next
          </Button>
        </ButtonGroup>
      </section>
    </div>
  );
}
