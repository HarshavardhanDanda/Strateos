// TODO: remove these from the window and delete this file
// This is gross and makes testing more difficult
// PLEASE DO NOT ADD NEW THINGS TO THE WINDOW

/*
NOTE: This sets up global variables which are implicit requirements throughout lots of our code.
      This module is not meant to export anything.  It just needs to be imported once to have
      its side effects take action.
*/

import Urls from 'main/util/urls';

window.Transcriptic = {
  setContext(context) {
    this.authentication_token = context.authentication_token;
    this.csrfToken            = context.csrf_token;
    this.current_user         = context.user;
    this.masquerading         = context.masquerading;
    this.organization         = context.organization;

    window.Feature = context.feature;

    if (this.organization && this.organization.subdomain) {
      Urls.use(this.organization.subdomain);
    }
  }
};

// bootsrap-sass requires jquery to be defined on the window
window.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap-sass');

// These are required because of the embeded views for notebooks, eliminate as soon as
// notebooks can require these on their own.
window.Immutable = require('immutable');

const _ = require('lodash');

window._ = _;
window.Moment = require('moment');

const Accounting = require('accounting');

Accounting.settings.currency.format = {
  pos: '%s%v',
  zero: '%s%v',
  neg: '(%s%v)'
};
window.Accounting = Accounting;
