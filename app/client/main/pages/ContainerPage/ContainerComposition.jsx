import PropTypes from 'prop-types';
import React     from 'react';

import AliquotAPI                  from 'main/api/AliquotAPI';
import CompoundStore               from 'main/stores/CompoundStore';
import { Spinner }                 from '@transcriptic/amino';
import CompoundListView            from 'main/components/Compounds/CompoundListView';

class ContainerComposition extends React.Component {
  static get propTypes() {
    return {
      id: PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);
    this.state = {
      compound_ids: [],
      loading: true
    };
  }

  componentDidMount() {
    this.fetch(this.props.id);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.fetch(this.props.id);
    }
  }

  fetch(id) {
    this.setState({ loading: true }, () => {
      const options = {
        fields: { aliquots: ['id'] },
        includes: ['compounds']
      };

      AliquotAPI.getByContainerId(id, options)
        .done(resp => {
          const compound_ids = (resp.included || []).map(c => c.id);

          this.setState({ compound_ids, loading: false });
        });
    });
  }

  render() {
    if (this.state.loading) {
      return <Spinner />;
    }

    const compounds = CompoundStore.getByIds(this.state.compound_ids);

    return <CompoundListView compounds={compounds} />;
  }
}

export default ContainerComposition;
