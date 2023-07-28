// Since toBlob isn't supported in IE we hackily use a data url and conver to a file.
//
// https://stackoverflow.com/questions/35940290/
// how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f
function dataURLtoBlob(dataurl) {
  const arr   = dataurl.split(',');
  const mime  = arr[0].match(/:(.*?);/)[1];
  const bstr  = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

const  base64ToBlob = (base64, filename, type) => {
  const binaryString =  window.atob(base64);
  const binaryLen = binaryString.length;

  const arrayBuffer = new ArrayBuffer(binaryLen);
  const uIntArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binaryLen; i++) {
    uIntArray[i] = binaryString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { name: filename, type: type, lastModifiedDate: new Date() });
};

const downloadBlob = (blob, filename) => {
  const a = document.createElement('a');
  a.style = 'display: none';
  document.body.appendChild(a);
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default {
  dataURLtoBlob,
  base64ToBlob,
  downloadBlob
};
