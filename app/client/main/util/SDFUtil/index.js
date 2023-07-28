const downloadSDF = (sdf, fileName, inNewTab = false) => {
  const link = document.createElement('a');
  if (inNewTab) {
    link.target = '_blank';
  }
  link.download = `${fileName}.sdf`;
  link.href = `data:chemical/x-mdl-sdfile;charset=utf-16,${encodeURIComponent(sdf)}`;
  link.click();
  return link;
};

export default { downloadSDF };
