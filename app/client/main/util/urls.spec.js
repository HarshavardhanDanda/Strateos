import { expect } from 'chai';
import Urls from './urls';

describe('User Application Urls', () => {

  beforeEach(() => {
    Urls.use('strateos');
  });

  describe('Vendor Resources Page', () => {
    it('should return correct base vendor URL', () => {
      expect(Urls.vendor_page()).to.equal('/strateos/vendor');
    });
    it('should return correct materials page URL', () => {
      expect(Urls.material_page()).to.equal('/strateos/vendor/materials');
    });
    it('should return correct new materials page URL', () => {
      expect(Urls.new_material()).to.equal('/strateos/vendor/materials/new');
    });
    it('should return correct edit/details materials page URL', () => {
      expect(Urls.material(1234)).to.equal('/strateos/vendor/materials/1234');
    });
    it('should return correct material orders checkin page URL', () => {
      expect(Urls.material_orders_checkin_page()).to.equal('/strateos/vendor/orders/checkin');
    });
    it('should return correct material orders bulk checkin csv page URL', () => {
      expect(Urls.material_orders_checkin_csv_page()).to.equal('/strateos/vendor/orders/checkincsv');
    });
    it('should return correct URL for getting vendors list used for filtering', () => {
      expect(Urls.commercial_vendors()).to.equal('/_commercial/vendors');
    });
  });

  describe('Material Order Checkin', () => {
    it('should return correct bulk create container API', () => {
      expect(Urls.bulk_create_containers_api()).to.equal('/api/containers/bulk_create_containers');
    });
  });

  describe('Intake kits page', () => {
    it('should return correct intake kits URL', () => {
      expect(Urls.ships()).to.equal('/api/intake_kits');
    });
  });

  describe('Runs page', () => {
    it('should return correct Related Runs URL', () => {
      expect(Urls.run_related_runs('ProjID123', 'RunID456'))
        .to.equal('/strateos/ProjID123/runs/RunID456/related_runs');
      expect(Urls.runspage_related_runs('RunID123', 'RunView456', 'status'))
        .to.equal('/strateos/runspage/RunView456/status/runs/RunID123/related_runs');
      expect(Urls.runspage_instructions('RunID123', 'RunView456', 'status'))
        .to.equal('/strateos/runspage/RunView456/status/runs/RunID123/instructions');
    });
  });

  describe('Materials page', () => {
    it('should return correct URL for global stats of given orderable material component', () => {
      expect(Urls.omc_global_stats('omatc1234')).to.equal('/api/orderable_material_components/omatc1234/global_stats');
    });
  });

  describe('Inventory page', () => {
    it('should return correct URL to check whether containers are transferable', () => {
      expect(Urls.are_containers_transferable()).to.equal('/api/containers/is_transferable');
    });

    it('should return correct URL for relocating containers', () => {
      expect(Urls.relocate_many()).to.equal('/api/containers/relocate_many');
    });
  });

  describe('Collaborators Resource', () => {
    it('should return correct URL for creating collaborator', () => {
      expect(Urls.create_collaborator('transcriptic', 'org924')).to.equal('/transcriptic/collaborators?org_id=org924');
    });

    it('should return correct URL for destroying collaborator', () => {
      expect(Urls.destroy_collaborator('transcriptic', 'c124', 'org924')).to.equal('/transcriptic/collaborators/c124?org_id=org924');
    });

    it('should return correct URL for removing collaborators for a user', () => {
      expect(Urls.remove_collaborators()).to.equal('/api/v1/actions/collaborators/remove_collaborators');
    });
  });

  describe('Customer organization', () => {
    it('should return correct URL for customer organization', () => {
      expect(Urls.customer_organization('org123')).to.equal('/strateos/customers/organization/org123');
    });
  });

  describe('Addresses', () => {
    it('list addresses URL', () => {
      expect(Urls.org_addresses_api('org123', 'transcriptic')).to.equal('/transcriptic/addresses?org_id=org123');
    });

    it('create address URL', () => {
      expect(Urls.org_addresses_api('org123', 'transcriptic')).to.equal('/transcriptic/addresses?org_id=org123');
    });

    it('update address URL', () => {
      expect(Urls.org_address_api('adr123', 'org123', 'transcriptic')).to.equal('/transcriptic/addresses/adr123?org_id=org123');
    });

    it('delete address URL', () => {
      expect(Urls.org_address_api('adr123', 'org123', 'transcriptic')).to.equal('/transcriptic/addresses/adr123?org_id=org123');
    });
  });

  describe('Security page', () => {
    it('should return correct URL to update organization given with subdomain and id', () => {
      expect(Urls.update_organization('transcriptic', 'org13')).to.equal('/transcriptic?org_id=org13');
    });
  });

  describe('Materials bulk checkin form', () => {
    it('should return correct URL for material checkin', () => {
      expect(Urls.material_checkin()).to.equal('/api/kit_orders/material_checkin');
    });
  });

  describe('Billing page', () => {
    it('should return correct URL to update or destroy billing contact given with subdomain and organization id', () => {
      expect(Urls.customer_billing_contact('bc1', 'transcriptic', 'org13')).to.equal('/transcriptic/billing_contacts/bc1?org_id=org13');
    });

    it('should return correct URL to get billing contact given with subdomain and organization id', () => {
      expect(Urls.customer_billing_contacts('transcriptic', 'org13')).to.equal('/transcriptic/billing_contacts?org_id=org13');
    });

    it('should return correct URL to get billing contact given without organization id and given with contact id', () => {
      expect(Urls.billing_contact('bc1')).to.equal('/strateos/billing_contacts/bc1');
    });

    it('should return correct URL to get invoices given with subdomain and organization id', () => {
      expect(Urls.get_invoices('transcriptic', 'org13')).to.equal('/transcriptic/invoices?org_id=org13');
    });

    it('should return correct URL to get credits given with subdomain and organization id', () => {
      expect(Urls.get_credits('transcriptic', 'org13')).to.equal('/transcriptic/credits?org_id=org13');
    });

    it('should return correct URL to get payment method given with subdomain and organization id', () => {
      expect(Urls.get_payment_methods('transcriptic')).to.equal('/transcriptic/payment_methods');
    });

    it('should return correct URL to update or destroy payment method given with subdomain and organization id', () => {
      expect(Urls.org_payment_method('pymethod1', 'transcriptic', 'org13')).to.equal('/transcriptic/payment_methods/pymethod1?org_id=org13');
    });

    it('should return correct URL to get organizations given with subdomain and organization id', () => {
      expect(Urls.get_organization('transcriptic', 'org13')).to.equal('/transcriptic?org_id=org13');
    });

    it('should return correct URL to create payment method given with subdomain and organization id', () => {
      expect(Urls.create_payment_methods('transcriptic', 'org13')).to.equal('/transcriptic/payment_methods?org_id=org13');
    });

    it('should return correct URL to get the subscriptions of the user in a given org', () => {
      expect(Urls.subscriptions('org13', 'user1')).to.equal('/api/org_subscriptions/org13?filter[userId]=user1');
    });

    it('should return correct URL to get the subscriptions of given org', () => {
      expect(Urls.subscriptions('org13')).to.equal('/api/org_subscriptions/org13');
    });

    it('should return correct URL to get the topics of the given org type', () => {
      expect(Urls.topics_of_org_type('CCS')).to.equal('/api/topics_of_org_type/CCS');
    });

    it('should return correct URL to create or delete synthesis program items', () => {
      expect(Urls.synthesis_program_item('sp1', 'batches')).to.equal('/api/v1/synthesis_programs/sp1/relationships/batches');
    });
  });

  describe('Post run program', () => {
    it('should return correct URL to create and execute post run program', () => {
      expect(Urls.create_and_execute_post_run_program()).to.equal('/api/program_executions');
    });
  });

  describe('Billing page', () => {
    it('should return correct URL for billing page', () => {
      expect(Urls.billing()).to.equal('/strateos/bills');
    });
  });

  describe('Audit page', () => {
    it('should return correct URL for audit page', () => {
      expect(Urls.audit()).to.equal('/strateos/audit');
    });
  });

  describe('Operator Dashboard page', () => {
    it('should return correct URL for operator dashboard page', () => {
      expect(Urls.operator_dashboard()).to.equal('/strateos/operator_dashboard');
      expect(Urls.operator_dashboard_deref('workcell1')).to.equal('/strateos/operator_dashboard/-/workcell1');
    });
  });

  describe('Audit configuration', () => {
    it('should return correct URL to get audit configuration', () => {
      expect(Urls.audit_configuration('org1')).to.equal('/service/audit_trail/api/v1/audit-configuration/org1');
    });

    it('should return correct URL to get audit configuration history', () => {
      expect(Urls.audit_configuration_history('org1')).to.equal('/service/audit_trail/api/v1/audit-configuration/org1/history');
    });
  });

  describe('Mixtures', () => {
    it('should return correct URL to get mixture by id', () => {
      expect(Urls.mixtures('mix123')).to.equal('/api/mixtures/mix123');
    });
  });

  describe('Bulk data ingestor service', () => {
    it('should return correct URL to validate the zip file', () => {
      expect(Urls.bulk_data_ingestor_validate()).to.equal('/service/BULK_INGESTION/api/v1/jobs/validate');
    });

    it('should return correct URL to upload the zip file', () => {
      expect(Urls.bulk_data_ingestor_upload()).to.equal('/service/BULK_INGESTION/api/v1/jobs');
    });
  });
});
