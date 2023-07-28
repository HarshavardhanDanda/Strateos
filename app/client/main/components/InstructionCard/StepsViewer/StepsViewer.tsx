import React, { useState } from 'react';
import classNames from 'classnames';

import './StepsViewer.scss';
import _ from 'lodash';
import { Button } from '@transcriptic/amino';

interface Props {
  title: string,
  steps: string[]
}

function StepsViewer(props: Props) {

  const { title, steps } = props;

  const [collapsed, setCollapsed] = useState(true);

  const renderButtonText = () => {

    const text  = collapsed && steps.length > 1 ? 'Show all steps' : 'Hide all steps';

    return (
      <Button
        link
        type="primary"
        className="steps-viewer__button-text"
        height="short"
        onClick={() => setCollapsed(true)}
      >
        {text}
      </Button>
    );
  };

  const renderStep = (step, index) => {

    const isLastStep = index === steps.length;

    return (
      <div className="steps-viewer__step" key={`${step}-${index}`}>
        <div className="steps-viewer__step-index">
          <div>
            <p className="param__label"> Step {index} </p>
          </div>
          <div
            className={classNames(
              !isLastStep && !collapsed && 'steps-viewer__step-line'
            )}
          />
        </div>

        <div className="steps-viewer__step-content">
          <p className="param__value">{step}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="steps-viewer">
      <div
        className="steps-viewer__heading"
        onClick={() => {
          setCollapsed(!collapsed);
        }}
      >
        <div className="steps-viewer__title param__label">
          {title}
        </div>
        <div>
          {renderButtonText()}
        </div>
      </div>
      {collapsed && !_.isEmpty(steps) && (
        <div className="steps-viewer__collapsed-text steps-viewer__body">{renderStep(steps[0], 1)}</div>
      )}
      {!collapsed && !_.isEmpty(steps) && (
        <div className="steps-viewer__body">
          {steps.map((step, index) => renderStep(step, index + 1))}
        </div>
      )}
    </div>
  );
}

export default StepsViewer;
