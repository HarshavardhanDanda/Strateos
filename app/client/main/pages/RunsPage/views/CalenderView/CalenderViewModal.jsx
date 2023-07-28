import React      from 'react';
import _          from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import CalenderView    from 'main/pages/RunsPage/views/CalenderView';
import {  Button } from '@transcriptic/amino';

class CalenderViewModal extends React.Component {

  renderFooter(onDismiss) {
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button type="secondary" size="small" onClick={onDismiss}>Close</Button>
      </div>
    );
  }

  render() {
    const { history } = this.props;

    return (
      <SinglePaneModal
        modalId="CALENDER_VIEW_MODAL"
        title="View Schedule"
        modalSize="xlg"
        footerRenderer={this.renderFooter}
        beforeDismiss={this.props.onClose}
        noScroll
      >
        <CalenderView
          history={history}
        />
      </SinglePaneModal>
    );
  }

}

export default CalenderViewModal;
