import Papa from 'papaparse';
import SessionStore from 'main/stores/SessionStore';

const downloadCSV = (csv, fileName, inNewTab = false) => {
  const link = document.createElement('a');
  if (inNewTab) {
    link.target = '_blank';
  }
  link.download = `${fileName}.csv`;
  link.href = `data:text/csv;charset=utf-16,${encodeURIComponent(csv)}`;
  link.click();
  return link;
};

const downloadCSVFromJSON = (CSVJson, fileName) => downloadCSV(Papa.unparse(CSVJson), fileName);

const generateBulkUploadRequest = (compounds, dryRun, isPublicCompound) => {
  if (isPublicCompound) {
    return compounds.map((compound) => {
      return {
        attributes: {
          compound: {
            smiles: compound.smiles
          },
          name: compound.name || '',
          reference_id: compound.reference_id || '',
          labels: compound.labels || []
        },
        actions: {
          dry_run: dryRun
        },
        type: 'compounds'
      };
    });
  } else {
    return compounds.map((compound) => {
      return {
        attributes: {
          compound: {
            smiles: compound.smiles
          },
          organization_id: SessionStore.getOrg().get('id'),
          name: compound.name || '',
          reference_id: compound.reference_id || '',
          labels: compound.labels || []
        },
        actions: {
          dry_run: dryRun
        },
        type: 'compounds'
      };
    });
  }
};

export default { downloadCSV, downloadCSVFromJSON, generateBulkUploadRequest };
