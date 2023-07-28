const getIdFromEmbeddedId = (embeddedId) => {
  return embeddedId.split('.')[0];
};

export default getIdFromEmbeddedId;
