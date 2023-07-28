import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import RunActions     from 'main/actions/RunActions';
import { uploadFile } from 'main/util/uploader';
import { Tooltip } from '@transcriptic/amino';

// TODO This should be in /ManageInstruction/
class InstructionDataUpload extends React.Component {
  static get propTypes() {
    return {
      instruction:         PropTypes.instanceOf(Immutable.Map).isRequired,
      dataset:             PropTypes.instanceOf(Immutable.Map),
      onInstructionChange: PropTypes.func
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      percentDone: 0,
      uploading: false
    };

    this.inputRef = React.createRef();
  }

  componentDidUpdate() {
    if (this.state.uploading) {
      window.onbeforeunload = () => {
        return 'You have uploads in progress';
      };
    } else {
      window.onbeforeunload = undefined;
    }
  }

  componentWillUnmount() {
    window.onbeforeunload = undefined;
  }

  onFilesSelected(event) {
    const fileList = event.target.files;
    if (fileList.length !== 1) {
      return;
    }

    const file = fileList.item(0);
    this.setState({
      uploading: true
    });

    uploadFile(file, file.name).progress((data) => {
      return this.setState({ percentDone: data.percentDone });
    }).done((resp) => {
      this.setState({ uploading: false, percentDone: 0 });

      const data = {
        data: {
          name: file.name,
          size: file.size,
          upload_id: resp.id
        }
      };

      return RunActions.attachInstructionData(this.props.instruction.get('id'), data).done((instruction) => {
        return this.props.onInstructionChange(instruction);
      });
    });
  }

  openFileSelector() {
    if (this.props.dataset || this.state.uploading) {
      return;
    }
    this.inputRef.current.click();
  }

  render() {
    return (
      <div
        className={`lab-checkbox databox ${this.props.dataset ? 'set' : ''}`}
        title={this.state.uploading ? 'Upload in progress' : 'Attach a dataset'}
        onClick={() => this.openFileSelector()}
      >
        <Choose>
          <When condition={this.state.uploading}>
            <i className="fa fa-sync fa-spin uploading-icon" />
          </When>
          <Otherwise>
            <Tooltip
              placement="bottom"
              title="Attach or modify a dataset linked to this instruction"
            >
              <i className="fa fa-hashtag" />
            </Tooltip>
          </Otherwise>
        </Choose>
        <div
          className="upload-progress"
          style={{
            width: `${this.state.percentDone}%`
          }}
        />
        <input
          type="file"
          hidden
          ref={this.inputRef}
          disabled={this.props.dataset || this.state.uploading}
          onChange={e => this.onFilesSelected(e)}
        />
      </div>
    );
  }
}

export default InstructionDataUpload;
