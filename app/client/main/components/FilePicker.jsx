import PropTypes from 'prop-types';
import React     from 'react';

import { range } from 'main/util/Numbers';
import classnames from 'classnames';

/*
 * This component provides you with a file input component, preceeded by the
 * paperclip (attachment) icon.
 */
class FilePicker extends React.Component {

  static get propTypes() {
    return {
      onFilesSelected: PropTypes.func.isRequired,
      multiple:        PropTypes.bool,
      title:           PropTypes.string,
      accept:          PropTypes.string,
      disabled:        PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      multiple: true,
      title: 'Attach files',
      disabled: false
    };
  }

  constructor(props) {
    super(props);
    this.onFilesSelected = this.onFilesSelected.bind(this);
  }

  onFilesSelected(event) {
    const fileList = event.target.files;
    if (!fileList.length) return;

    const files = [...range(0, fileList.length)].map(i => fileList.item(i));
    this.props.onFilesSelected(files);
  }

  render() {
    return (
      <span
        className={classnames(
          'btn',
          'btn-default',
          'attachment-uploader__upload',
          { disabled: this.props.disabled })
        }
        title={this.props.title}
      >
        <i className="fa fa-paperclip" />
        <span> {this.props.title}</span>
        <input
          type="file"
          multiple={this.props.multiple}
          accept={this.props.accept}
          onChange={this.onFilesSelected}
          disabled={this.props.disabled}
        />
      </span>
    );
  }
}

export default FilePicker;
