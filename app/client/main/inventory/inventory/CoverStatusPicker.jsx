import React from 'react';
import PropTypes from 'prop-types';

import { RadioGroup, Radio } from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';

import { SinglePaneModal } from 'main/components/Modal';

export default class CoverStatusPicker extends React.Component {

  static get MODAL_ID() {
    return 'COVER_STATUS_PICKER';
  }

  static get propTypes() {
    return {
      options: PropTypes.arrayOf(PropTypes.object).isRequired,
      onChange: PropTypes.func
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      value: 'uncovered'
    };
  }

  updateCoverStatus() {
    const { value } = this.state;
    // use `null` instead of `undefined` because it will be set as `nil` in the back end.
    // eslint-disable-next-line no-null/no-null
    this.props.onChange(value === 'uncovered' ? null : value);
    this.dismiss();
  }

  onChange(value) {
    this.setState({ value });
  }

  dismiss() {
    ModalActions.close(CoverStatusPicker.MODAL_ID);
  }

  render() {
    const { options } = this.props;

    return (
      <SinglePaneModal
        modalId={CoverStatusPicker.MODAL_ID}
        title="Select cover status"
        onAccept={() => this.updateCoverStatus()}
        acceptText="Assign"
      >
        <RadioGroup
          name="cover-status"
          value={this.state.value}
          onChange={e => this.onChange(e.target.value)}
        >
          {options.map((option, index) => <Radio key={`radio-${index}`} {...option} />)}
        </RadioGroup>
      </SinglePaneModal>
    );
  }
}
