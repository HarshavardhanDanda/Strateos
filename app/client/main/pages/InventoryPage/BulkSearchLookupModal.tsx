import React, { useState } from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import { ZeroState, TextArea, TextBody } from '@transcriptic/amino';
import String from 'main/util/String';
import ModalActions from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';
import ManageContainerModal from './ManageContainerModal';

interface Props {
  onApplyFilter: (containerIds: string[]) => void;
  searchField: { name: string, value: string };
  searchOptions: Immutable.Map<string, never>;
}

function BulkSearchLookupModal(props: Props) {
  const [textAreaInput, setTextAreaInput] = useState<string>('');
  const [searchTextArray, setSearchTextArray] = useState<string[]>([]);

  const getDelimiter = () => {
    return props.searchField.name === 'name' ? /[,\n]+/ : '';
  };

  const onBulkSearchSubmit = () => {
    const filteredBulkSearchArray = String.splitWithRegex(textAreaInput, getDelimiter()).filter(bulkSearch => !_.isEmpty(bulkSearch));

    if (filteredBulkSearchArray.length) {
      setSearchTextArray(filteredBulkSearchArray);
      beforeModalClose();
      ModalActions.open(ManageContainerModal.MODAL_ID);
    }
  };

  const onManageSubmit = (containerIds) => {
    props.onApplyFilter(containerIds);
    setSearchTextArray([]);
  };

  const onManageCancel = () => {
    setSearchTextArray([]);
  };

  const beforeModalClose = () => {
    setTextAreaInput('');
    ModalActions.close(BulkSearchLookupModal.MODAL_ID);
  };

  const onInputChange = (event) => {
    setTextAreaInput(event.target.value);
  };

  const isTextAreaInputValid = () => {
    return !!textAreaInput.replace(/[,\n\s]+/, '');
  };

  const renderTextBody = (text:String, tag:String) => {
    return <TextBody tag={tag} heavy>{text}</TextBody>;
  };

  const renderTextBodyPreface = (
    <TextBody>
      Search for a list of containers by {renderTextBody('copying', 'span')} and {renderTextBody('pasting', 'span')}
    </TextBody>
  );

  const renderSearchDescription = () => {
    switch (props.searchField.name) {
      case 'barcode':
        return (<TextBody>{renderTextBodyPreface} a column from your csv into the text area below or {renderTextBody('scanning', 'span')} the container&apos;s barcode</TextBody>);
      case 'id':
      case 'name':
        return (<TextBody>{renderTextBodyPreface} a column from your csv into the text area below</TextBody>);
      default:
        return '';
    }
  };

  return (
    <>
      <SinglePaneModal
        title={`Look up ${props.searchField.name}s`}
        modalSize="large"
        onAccept={onBulkSearchSubmit}
        disableDismiss={!isTextAreaInputValid()}
        modalId={BulkSearchLookupModal.MODAL_ID}
        onDismissed={beforeModalClose}
      >
        <ZeroState
          title={`Look up ${props.searchField.name}s`}
          subTitle={renderSearchDescription()}
          zeroStateSvg="/images/containers-illustration.svg"
        >
          <TextArea
            value={textAreaInput}
            onChange={onInputChange}
            fullWidth
            autoFocus
          />
        </ZeroState>
      </SinglePaneModal>
      <ManageContainerModal
        key="ManageContainerModal"
        searchTextArray={searchTextArray}
        onManageSubmit={onManageSubmit}
        searchOptions={props.searchOptions}
        searchField={props.searchField}
        onManageCancel={onManageCancel}
      />
    </>
  );
}
BulkSearchLookupModal.MODAL_ID = 'BULK_SEARCH_LOOK_UP_MODAL';
export default BulkSearchLookupModal;
