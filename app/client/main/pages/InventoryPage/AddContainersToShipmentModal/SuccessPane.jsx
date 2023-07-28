import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Button, Divider, StatusPill } from '@transcriptic/amino';

import { MultiStepModalPane, clonedPropNames } from 'main/components/Modal';

import SortableContainerTable from './SortableContainerTable';

import './SuccessPane.scss';

class SuccessPane extends React.Component {
  static get propTypes() {
    return {
      validContainers: PropTypes.oneOfType([PropTypes.arrayOf(Immutable.Map), PropTypes.instanceOf(Immutable.List)]).isRequired,

      // passed in from modal hoc.
      onDismiss: PropTypes.func.isRequired
    };
  }

  render() {
    const { validContainers } = this.props;

    return (
      <MultiStepModalPane
        classNames={{ 'add-containers-to-shipment-modal-success': true }}
        key="success"
        isFinalPane
        {..._.pick(this.props, clonedPropNames)}
      >
        <div className="tx-stack">
          <img
            alt=""
            className="tx-stack__block--xxlg"
            src="/images/icons/inventory_browser_icons/success-check.svg"
          />
          <h2 className="tx-stack__block--xxlg">
            The following containers have been added to your shipping cart
          </h2>

          <Divider size="small">
            <StatusPill type="success" text="Valid" icon="fa-check" />
          </Divider>

          <SortableContainerTable containers={validContainers} />

          <Button
            type="primary"
            size="large"
            height="tall"
            onClick={() => { this.props.onDismiss(); }}
          >
            Done
          </Button>
        </div>
      </MultiStepModalPane>
    );
  }
}

SuccessPane.defaultProps = {
  onDismiss: () => {}
};

export default SuccessPane;
