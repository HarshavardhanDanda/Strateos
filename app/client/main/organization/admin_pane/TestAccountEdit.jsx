import PropTypes from 'prop-types';
import React     from 'react';

class TestAccountEdit extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.save = this.save.bind(this);
    this.state = {
      testAccount: props.initialTestAccount
    };
  }

  save() {
    return this.props.saveOrganization('test_account', this.state.testAccount);
  }

  render() {
    return (
      <div>
        <h3>Test account?</h3>
        <input
          type="checkbox"
          checked={this.state.testAccount ? 'checked' : undefined}
          onChange={(e) => {
            return this.setState(
              {
                testAccount: e.target.checked
              },
              this.save
            );
          }}
        />
      </div>
    );
  }
}

TestAccountEdit.displayName = 'TestAccountEdit';

TestAccountEdit.propTypes = {
  initialTestAccount: PropTypes.bool,
  saveOrganization: PropTypes.func.isRequired
};

export default TestAccountEdit;
