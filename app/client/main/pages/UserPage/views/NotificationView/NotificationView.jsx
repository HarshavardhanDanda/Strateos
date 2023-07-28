import _         from 'lodash';
import bindAll   from 'lodash/bindAll';
import PropTypes from 'prop-types';
import React     from 'react';

import UserActions   from 'main/actions/UserActions';
import NotificationActions from 'main/actions/NotificationActions';
import SessionStore from 'main/stores/SessionStore';
import { TabLayout } from 'main/components/TabLayout';

import Header from 'main/pages/UserPage/components/Header.jsx';
import Footer from 'main/pages/UserPage/components/Footer.jsx';
import { LabeledInput, Select, Spinner, TextBody, TextTitle } from '@transcriptic/amino';
import NotificationPreferences from './NotificationPreferences';
import { NotificationGroups, TopicIdentifiers } from './NotificationGroups';

import './NotificationView.scss';

class NotificationView extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      hasChanges: false,
      loaded: false,
      currentOrg: SessionStore.getOrg(),
      orgTopics: [],
      initValues: [],
      subscribedTopics: []
    };
    bindAll(this, 'revert', 'onUpdateNotifications', 'onCheckboxChange', 'onEmailToggleClicked');
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.currentOrg != prevState.currentOrg) {
      this.fetchData();
    }
  }

  fetchData() {
    try {
      UserActions.getTopicsOfOrgType(this.state.currentOrg.get('org_type'))
        .then(response => {
          this.setState({ orgTopics: response.content });
          UserActions.getSubscriptions(this.state.currentOrg.get('id'), this.props.user.get('id'))
            .then(subscriptionResponse => {
              if (subscriptionResponse.content.length > 0) {
                const result = this.extractSubscribedTopics(subscriptionResponse.content);
                this.setState({
                  initValues: [...new Set(result)].sort(),
                  subscribedTopics: result,
                  loaded: true
                });
              } else {
                this.setState({
                  initValues: [],
                  subscribedTopics: [],
                  loaded: true
                });
              }
              this.setDisabledTopicCategories();
            });
        });
    } catch (err) {
      NotificationActions.handleError(err);
    }
  }

  defaultValues() {
    return [
      'notify_for_my_run_status',
      'notify_for_org_run_status',
      'notify_for_my_run_schedule',
      'notify_for_org_run_schedule',
      'notify_for_stale_container',
      'notify_for_my_intake_kit_shipped',
      'notify_for_intake_kit_shipped',
      'notify_for_my_shipment_checked_in',
      'notify_for_shipment_checked_in'
    ];
  }

  extractSubscribedTopics(subscriptions) {
    const individualScopedTopics = [];
    const orgScopedTopics = [];
    const subscribedTopics = {};
    subscriptions.forEach(subscription => {
      if (subscription.scope === 'INDIVIDUAL') {
        const scopedTopicIds = subscription.topicChannelDetails.map(tc => tc.topicId);
        individualScopedTopics.push(...this.state.orgTopics.filter(topic => this.getScopedTopics(topic, scopedTopicIds)));
      } else if (subscription.scope === 'ORG') {
        const scopedTopicIds = subscription.topicChannelDetails.map(tc => tc.topicId);
        orgScopedTopics.push(...this.state.orgTopics.filter(topic => this.getScopedTopics(topic, scopedTopicIds)));
      }
    });
    subscribedTopics.INDIVIDUAL = individualScopedTopics;
    subscribedTopics.ORG = orgScopedTopics;
    let result = [];
    Object.entries(subscribedTopics).forEach(topics => {
      result = [...result, ...this.generateNotificationOptions(topics[1], topics[0])];
    });
    return result;
  }

  getScopedTopics(currentTopic, scopedTopicIds) {
    if (scopedTopicIds.indexOf(currentTopic.id) !== -1) {
      return currentTopic.id;
    }
  }

  generateNotificationOptions(subscribedTopics, scope) {
    let notificationOptions = [];
    subscribedTopics.forEach(topic => {
      const  { name } = topic;
      if (name.includes('run.scheduled')) {
        notificationOptions = this.generateNotificationObject(notificationOptions, scope, 'notify_for_my_run_schedule', 'notify_for_org_run_schedule');
      } else if (name.includes(TopicIdentifiers.run)) {
        notificationOptions = this.generateNotificationObject(notificationOptions, scope, 'notify_for_my_run_status', 'notify_for_org_run_status');
      } else if (name.includes(TopicIdentifiers.container)) {
        notificationOptions = this.generateNotificationObject(notificationOptions, scope, '', 'notify_for_stale_container');
      } else if (name.includes(TopicIdentifiers.intake_kit)) {
        notificationOptions = this.generateNotificationObject(notificationOptions, scope, 'notify_for_my_intake_kit_shipped', 'notify_for_intake_kit_shipped');
      } else if (name.includes(TopicIdentifiers.shipment)) {
        notificationOptions = this.generateNotificationObject(notificationOptions, scope, 'notify_for_my_shipment_checked_in', 'notify_for_shipment_checked_in');
      }
    });
    return notificationOptions;
  }

  generateNotificationObject(notificationOptions, scope, individualTopic = '', orgTopic = '') {
    if (scope === 'INDIVIDUAL' && individualTopic.length > 0) {
      notificationOptions.push(individualTopic);
    } else if (scope === 'ORG' && orgTopic.length > 0) {
      notificationOptions.push(orgTopic);
    }
    return notificationOptions;
  }

  equalsOriginal(currentNotifications) {
    return _.isEqual(currentNotifications.sort(), this.state.initValues);
  }

  revert() {
    this.setState({
      hasChanges: false,
      subscribedTopics: this.state.initValues
    });
    this.setDisabledTopicCategories();
  }

  setDisabledTopicCategories() {
    Object.entries(NotificationGroups).forEach(preference => {
      const preferenceGroup = NotificationGroups[preference[0]];

      if (!preference[1].some(topic => this.state.initValues.includes(topic))) {
        preferenceGroup.disabled = true;
      } else {
        preferenceGroup.disabled = false;
      }
    });
  }

  onCheckboxChange(state, name) {
    const selectedNotificationsWithoutCurrentGroup = this.state.subscribedTopics.filter(type => !NotificationGroups[name].includes(type));
    state[name].forEach(type => selectedNotificationsWithoutCurrentGroup.push(type));
    this.setState({
      hasChanges: !this.equalsOriginal(selectedNotificationsWithoutCurrentGroup),
      subscribedTopics: selectedNotificationsWithoutCurrentGroup
    });
  }

  onEmailToggleClicked(name, value) {
    const selectedNotifications = {};
    const { subscribedTopics, initValues } =  this.state;
    const notifications = NotificationGroups[name];
    if (value === 'off') {
      const selectedTopics = subscribedTopics.filter(st => !notifications.includes(st));
      this.setState({
        hasChanges: !this.equalsOriginal(selectedTopics),
        subscribedTopics: selectedTopics
      });
      notifications.disabled = true;
    } else {
      notifications.disabled = false;
      selectedNotifications[name] = notifications.filter(n => initValues.includes(n));
      this.onCheckboxChange(selectedNotifications, name);
    }
  }

  onUpdateNotifications(buttonCallback) {
    const userPreferences = {};
    this.defaultValues().forEach(val => {
      if (this.state.subscribedTopics.includes(val)) {
        userPreferences[val] = true;
      } else {
        userPreferences[val] = false;
      }
    });
    return UserActions.updateUserPreferences({
      user_preferences: userPreferences,
      org_id: this.state.currentOrg.get('id'),
      org_type: this.state.currentOrg.get('org_type')
    }).done(() => {
      this.setState({
        hasChanges: false,
        initValues: this.state.subscribedTopics
      });
      buttonCallback();
    });
  }

  getUserOrgs() {
    const userCollabOrgs = this.props.user.get('organizations');
    return userCollabOrgs.map(org => {
      return {
        value: org.get('id'),
        name: org.get('name')
      };
    });
  }

  render() {
    const userOrgs = this.getUserOrgs();
    return (
      <TabLayout className="notification-view">
        <div className="account-layout">
          <TextTitle tag="h3" branded={false}>Notification settings</TextTitle>
          <TextBody branded={false}>Strateos may still send you important notifications about your account and alerts outside your preferred notification settings</TextBody>
          <br />
          <div>
            <LabeledInput label="Organization">
              <Select
                placeholder={this.state.currentOrg.get('name')}
                options={userOrgs}
                value={this.state.currentOrg.get('name')}
                onChange={e => {
                  const selectedOrg = this.props.user.get('organizations').filter(org => org.get('id').includes(e.target.value));
                  this.setState({ currentOrg: selectedOrg.first() });
                }}
              />
            </LabeledInput>
          </div>
          {this.state.loaded ? (
            <div className="notification-view__information-section">
              <div className="notification-view__content">
                <Header title="Manage your preferences" />
                <NotificationPreferences
                  onEmailToggleClicked={this.onEmailToggleClicked}
                  onCheckboxChange={this.onCheckboxChange}
                  selectedCheckboxes={this.state.subscribedTopics}
                />
              </div>
              <Footer
                showCancel={this.state.hasChanges}
                onSave={this.onUpdateNotifications}
                saveEnabled={this.state.hasChanges}
                onCancel={this.revert}
              />
            </div>
          )
            : (
              <Spinner />
            )}
        </div>
      </TabLayout>
    );
  }

}

export default NotificationView;
