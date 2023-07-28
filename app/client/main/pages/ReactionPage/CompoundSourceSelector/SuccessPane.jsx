import PropTypes from 'prop-types';
import React from 'react';
import { MultiStepModalPane } from 'main/components/Modal';
import 'main/pages/ReactionPage/CompoundSourceSelector/SuccessPane.scss';

function SuccessPane(props) {
  return (
    <div className="shipment-created-success">
      <MultiStepModalPane
        key="renderSuccessNote"
        {...props}
        btnClass="btn-md"
        nextBtnName="Ok, got it"
        showBackButton={false}
        onNavigateNext={props.onAcknowledge}
      >
        <div className="row">
          <div className="col-xs-12 col-sm-8 col-sm-offset-2 shipment-created-success__header-message">
            <img
              alt=""
              className="shipment-created-success__materials-illustration tx-stack__block tx-stack__block--xxs"
              src="/images/materials-illustration.svg"
            />
            <h3 className="tx-stack__block tx-stack__block--xxs">
              {props.headerMessage}
            </h3>
          </div>
        </div>
        <div className="shipment-created-success__shipment-content">
          <div className="row">
            <div
              className="col-xs-12 col-sm-4 col-sm-offset-4 shipment-created-success__instructions tx-stack tx-stack--sm"
            >
              {props.instructionContent}
            </div>
          </div>
        </div>
      </MultiStepModalPane>
    </div>
  );
}

SuccessPane.defaultProps = {
  headerMessage: 'Thanks for adding new samples to your Inventory. Please ship them to us.'
};

SuccessPane.propTypes = {
  onAcknowledge: PropTypes.func.isRequired,
  headerMessage: PropTypes.string,
  instructionContent: PropTypes.node
};

export default SuccessPane;
