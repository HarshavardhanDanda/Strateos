import { expect } from 'chai';
import IntercomInitializer from '.';

describe('IntercomInitializer', () => {
  const user = { id: 'user', name: 'John Doe', email: 'john@doe.com', created_at: '2021-02-02T08:36:23.086-08:00' };
  const org = { subdomain: 'transcriptic' };

  it('sets user info in intercomSettings', () => {
    IntercomInitializer.load(user, org);
    expect(window.intercomSettings).to.not.null;
    expect(window.intercomSettings.name).to.be.equal('John Doe');
    expect(window.intercomSettings.email).to.be.equal('john@doe.com');
    expect(window.intercomSettings.org_subdomain).to.be.equal('transcriptic');
    expect(window.intercomSettings.created_at).to.be.equal(1612283783);
  });
});
