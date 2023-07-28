import React from 'react';
import classnames from 'classnames';
import keycode from 'keycode';
import PropTypes from 'prop-types';

import CharControllableInput from 'main/components/CharControllableInput';

/*
A text label that can be toggled between view/edit modes.
*/
class EditInPlace extends React.Component {
  static get propTypes() {
    return {
      onSave: PropTypes.func.isRequired,
      ignoreIfUnchanged: PropTypes.bool,
      value: PropTypes.string,
      onCancel: PropTypes.func,
      clearOnEdit: PropTypes.bool,
      className: PropTypes.string,
      showIcon: PropTypes.bool,
      startInEdit: PropTypes.bool,
      beganEditing: PropTypes.func,
      decorate: PropTypes.bool,
      illegalChars: PropTypes.array
    };
  }

  constructor() {
    super();

    this.state = {
      editAction: 'showing',
      editedText: ''
    };

    this.done = this.done.bind(this);
    this.edit = this.edit.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.save = this.save.bind(this);
  }

  componentWillMount() {
    if (this.props.startInEdit && !(this.state.editAction === 'editing')) {
      this.edit();
    }
  }

  onTextChange(value) {
    this.setState({ editedText: value });
  }

  edit() {
    const value = this.props.clearOnEdit ? '' : this.props.value;

    this.setState({ editAction: 'editing', editedText: value }, () => {
      if (this.props.beganEditing) this.props.beganEditing();
    });
  }

  save(key) {
    const valueUnchanged = this.state.editedText === this.props.value;
    if (valueUnchanged && this.props.ignoreIfUnchanged) {
      this.done();
    } else {
      this.setState({ editAction: 'saving' }, () => {
        this.props.onSave(this.state.editedText, this.done, key);
      });
    }
  }

  cancel() {
    this.setState({ editedText: this.props.value, editAction: 'showing' }, () => {
      if (this.props.onCancel) this.props.onCancel();
    });
  }

  keyDown(e) {
    const char = keycode(e);
    if (char === 'enter') {
      this.save(13);
    } else if (char === 'esc') {
      this.cancel();
    }
  }

  done() {
    this.setState({ editAction: 'showing' });
  }

  render() {
    const classes = {
      decorate: this.props.decorate
    };

    classes[this.state.editAction] = true;
    const { disableEdit } = this.props;
    return (
      <div
        style={{ display: 'inline-block' }}
        className={classnames(
          classes,
          this.props.className,
          'edit-in-place'
        )}
      >
        <Choose>
          <When condition={this.state.editAction === 'editing'}>
            <ExpandingInput
              focus={this.state.editAction === 'editing'}
              onChange={this.onTextChange}
              onKeyDown={this.keyDown}
              onBlur={this.save}
              value={this.state.editedText}
              illegalChars={this.props.illegalChars}
            />
          </When>
          <When condition={this.state.editAction === 'saving'}>
            <div className="text-container">{this.state.editedText}</div>
          </When>
          <Otherwise>
            <div className="text-container"  {...(disableEdit ? {} : { onClick: this.edit })}>
              <span className="text">{this.props.value}</span>{' '}
              <If condition={this.props.showIcon}>
                <i
                  className="fa fa-edit"
                  style={{ fontSize: '80%' }}
                />
              </If>
            </div>
          </Otherwise>
        </Choose>
      </div>
    );
  }

}

EditInPlace.defaultProps = {
  clearOnEdit: false,
  value: '',
  showIcon: true,
  decorate: true,
  ignoreIfUnchanged: true
};

class ExpandingInput extends React.Component {
  static get propTypes() {
    return {
      onKeyDown: PropTypes.func,
      onChange: PropTypes.func,
      onBlur: PropTypes.func,
      illegalChars: PropTypes.array,
      value: PropTypes.string,
      focus: PropTypes.bool
    };
  }

  componentDidMount() {
    if (this.props.focus && this.props.value) {
      this.charInput.inputNode.setSelectionRange(this.props.value.length, this.props.value.length);
    }
  }

  render() {
    return (
      <div className="expanding-input">
        <div>
          <span>{this.props.value}</span>
          <br />
        </div>
        <CharControllableInput
          ref={(node) => { this.charInput = node; }}
          autoFocus={this.props.focus}
          onChange={this.props.onChange}
          onKeyDown={this.props.onKeyDown}
          onBlur={this.props.onBlur}
          value={this.props.value}
          illegalChars={this.props.illegalChars}
        />
      </div>
    );
  }
}

export { EditInPlace, ExpandingInput };
