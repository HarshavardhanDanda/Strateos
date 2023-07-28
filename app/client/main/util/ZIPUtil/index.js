import saveAs from 'jszip/vendor/FileSaver.js';

const downloadZip = (zip, fileName) => {
  zip.generateAsync({ type: 'blob' })
    .then((content) => {
      saveAs(content, `${fileName}.zip`);
    });
};

export default { downloadZip };
