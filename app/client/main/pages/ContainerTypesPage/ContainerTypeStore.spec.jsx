import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import { expect } from 'chai';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

function mockContainerType(n, is_retired = false) {
  return {
    id: `${n}`,
    attributes: {
      acceptable_lids: [
        'screw-cap'
      ],
      col_count: 1,
      height_mm: '117.2',
      is_tube: true,
      retired_at: is_retired ? '2021-02-27T11:34:55.483-08:00' : null
    },
    type: 'container_types'
  };
}

describe('ContainerTypeStore', () => {
  beforeEach(() => {
    ContainerTypeStore._empty();
    const containerTypes = { data: [mockContainerType(0), mockContainerType(1), mockContainerType(2, true)] };

    JsonAPIIngestor.ingest(containerTypes);
  });

  it('should receive data', () => {
    expect(ContainerTypeStore.getAll().size).to.be.eq(3);
  });

  it('should get attributes', () => {
    const containerType = ContainerTypeStore.getById('0');

    expect(containerType.get('is_tube')).to.be.eq(true);
    expect(containerType.get('height_mm')).to.be.eq('117.2');
    expect(containerType.get('col_count')).to.be.eq(1);
    expect(containerType.get('acceptable_lids').get(0)).to.be.eq('screw-cap');
  });

  it('should only return non-retired container types when usableContainerTypes() is called', () => {
    const usableContainerTypes = ContainerTypeStore.usableContainerTypes().toJS();

    expect(usableContainerTypes.length).to.be.eq(2);
    expect(usableContainerTypes[0].retired_at).equal(null);
    expect(usableContainerTypes[1].retired_at).equal(null);
  });
});
