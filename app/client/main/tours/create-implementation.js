import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

import Urls                from 'main/util/urls';
import ModalActions        from 'main/actions/ModalActions';
import ImplementationStore from 'main/admin/stores/ImplementationStore';

// this function is used as a workaround for async dom events
// (react rendering and ajax-dependent views)
let lastScan;
const scan = (element, cb, count = 0) => {
  clearTimeout(lastScan);      // prevent concurrent scans

  // only scan for 5 seconds
  if (count > 20) {
    return;
  }

  if (document.querySelector(element)) {
    cb();
  } else {
    lastScan = setTimeout(() => scan(element, cb, count + 1), 250);
  }
};

const tour = new Shepherd.Tour({
  defaults: {
    cancelIcon: {
      enabled: true
    },
    classes: 'shepherd-theme-arrows',
    scrollTo: true,
    arrow: true
  }
});

tour.addSteps([
  {
    id: 'choose-organization',
    title: 'Choose the Organizaiton',
    text: 'Search for the implementation customer and select their organization',
    attachTo: {
      element: '.search-field',
      on: 'top'
    },
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      },
      {
        text: 'Next',
        action() {
          ModalActions.open('NewImplementationModal');
          return scan('.create-org', () => this.next());
        }
      }
    ]
  },
  {
    id: 'create-implementation',
    title: 'Create Implementation',
    text: 'Confirm the above looks good and then click create',
    attachTo: {
      element: '.create-org',
      on: 'bottom'
    },
    advanceOn: {
      element: '.create-org',
      event: 'click'
    },
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      }
    ]
  },
  {
    id: 'welcome',
    title: 'Welcome',
    text: 'Here is your implementation organization.<br><br>Everything created ' +
              'within this organization will be hidden from the customer.<br><br>' +
              'Would you like to select customer inventory to transfer to your ' +
              'implementation?',
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      },
      {
        text: 'Yes',
        action() {
          const customer = ImplementationStore.first().getIn(['customer', 'subdomain']);
          window.location = Urls.use(customer).inventory() + '/samples?continueTour=true';
          return scan('.btn-info', () => this.next());
        }
      }
    ]
  },
  {
    id: 'select-inventory',
    title: 'Select Inventory',
    text: 'Click here to select inventory to transfer to your implementation.',
    attachTo: {
      element: '.tx-checkbox__icon',
      on: 'top'
    },
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      }
    ]
  },
  {
    id: 'transfer-inventory',
    title: 'Transfer Inventory',
    text: 'Once you have selected the inventory you want, click here to ' +
             'transfer to your implementation.',
    attachTo: {
      element: '.fa-exchange',
      on: 'bottom'
    },
    when: {
      show: () => {
        document.querySelector('.fa-exchange').addEventListener('click', () => {
          scan('.transfer-btn', () => tour.next());
        });
      }
    },
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      }
    ]
  },
  {
    title: 'Confirm Transfer',
    text: 'Confirm the above looks good and then click here transfer to your implementation',
    attachTo: {
      element: '.transfer-btn',
      on: 'bottom'
    },
    when: {
      show: () => {
        document.querySelector('.transfer-btn').addEventListener('click', () => {
          const implementation = ImplementationStore.first().getIn(['implementation', 'subdomain']);
          // need to let the transfer request fire before navigating
          setTimeout(() => { window.location = Urls.use(implementation).projects() + '?continueTour=true&step=6'; }, 250);
        });
      }
    },
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      }
    ]
  },
  {
    title: 'Done!',
    text: 'Your implementation has been set up.',
    buttons: [
      {
        text: 'Cancel',
        action: tour.cancel
      },
      {
        text: 'OK',
        action() {
          this.complete();
        }
      }
    ]
  }
]);

export { tour, scan };
