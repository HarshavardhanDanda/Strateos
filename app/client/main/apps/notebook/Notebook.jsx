import React from 'react';
import $ from 'jquery';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { EditInPlace } from 'main/components/EditInPlace';
import NotebookActions from 'main/actions/NotebookActions';

class Notebook extends React.Component {
  static get propTypes() {
    return {
      onCloseNotebook: PropTypes.func,
      notebook: PropTypes.instanceOf(Immutable.Map),
      project: PropTypes.instanceOf(Immutable.Map),
      height: PropTypes.number
    };
  }

  constructor() {
    super();

    this.closeNotebook = this.closeNotebook.bind(this);
    this.pushCell = this.pushCell.bind(this);
  }

  closeNotebook() {
    this.notebookIframe.contentWindow.postMessage({ op: 'close' }, '*');

    if (this.props.onCloseNotebook) {
      this.props.onCloseNotebook();
    }
  }

  pushCell(text, autoexec = false) {
    this.notebookIframe.contentWindow.postMessage(
      {
        op: 'push-cell',
        text,
        autoexec
      },
      '*'
    );
  }

  render() {
    // TODO: Use the same user_id|email|token regardless of signed in user.
    //
    // The code below will link to the a Jupyter server for the
    // currently logged in user and not to the Jupyter server of
    // the user who created the notebook.  This means that two different
    // users could be manipulating the same notebook via different Jupyter
    // servers.  We should investigate if this is better than allowing them both to
    // share the same Jupyter server or if it is even possible.
    //
    // The other problem is that our credentials (email/token) will be
    // different based on user, which means that the code might not work
    // depending on user.  For the time being this is solved because the
    // NotebookDrawer only displays notebooks that are owned by the current user,
    // but this is a bandaid fix.
    const { project, notebook } = this.props;

    const queryString = $.param({
      organization: Transcriptic.organization.subdomain,
      project: project.get('id'),
      user_id: Transcriptic.current_user.id,
      email: Transcriptic.current_user.email,
      token: Transcriptic.current_user.authentication_token,
      notebook: notebook.get('path')
    });

    const url = `${process.env.JUPYTER_URL}/spawn?${queryString}`;

    return (
      <div>
        <div className="notebook-title">
          <span className="name">
            <EditInPlace
              value={notebook.get('name')}
              onSave={(title, done) => {
                NotebookActions.update(
                  project.get('id'),
                  notebook.get('id'),
                  {
                    notebook: { name: title }
                  }
                )
                  .done(done);
              }}
            />
          </span>
          <a className="action-close" onClick={this.closeNotebook}>
            Close
          </a>
        </div>
        <iframe
          title="notebook"
          ref={(node) => { this.notebookIframe = node; }}
          style={{ height: this.props.height }}
          src={url}
        />
      </div>
    );
  }
}

export default Notebook;
