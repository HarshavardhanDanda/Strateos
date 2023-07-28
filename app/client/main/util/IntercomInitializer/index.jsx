const IntercomInitializer = {
  instance() {
    const i = function() {
      // eslint-disable-next-line prefer-rest-params
      i.c(arguments);
    };
    i.q = [];
    i.c = function(...args) {
      i.q.push(args);
    };
    return i;
  },

  injectIntoDOM() {
    const d = document;
    const s = d.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://widget.intercom.io/widget/' + window.intercomSettings.app_id;
    const x = d.getElementsByTagName('script')[0];
    if (x && x.parentNode) {
      x.parentNode.insertBefore(s, x);
    }
  },

  init() {
    const w = window;
    const ic = w.Intercom;
    if (typeof ic === 'function') {
      ic('reattach_activator');
      ic('update', w.intercomSettings);
    } else {
      w.Intercom = this.instance();
      if (document.readyState === 'complete') {
        this.injectIntoDOM();
      } else if (w.attachEvent) {
        w.attachEvent('onload', this.injectIntoDOM);
      } else {
        w.addEventListener('load', this.injectIntoDOM, false);
      }
    }
  },

  load(user, org, user_intercom_hash) {
    // User objects aren't the same on each subdomain, some are missing user. API expects seconds, not milliseconds
    const createdAt = user.created_at ? parseInt(new Date(user.created_at).getTime() / 1000, 10) : undefined;
    window.intercomSettings = {
      app_id: process.env.INTERCOM_APP_ID,
      name: user.name,
      email: user.email,
      org_subdomain: org.subdomain,
      created_at: createdAt,
      user_hash: user_intercom_hash
    };
    this.init();
  }
};

export default IntercomInitializer;
