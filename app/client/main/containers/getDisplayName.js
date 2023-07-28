const getDisplayName = (reactComponent) => {
  return reactComponent.displayName || reactComponent.name || 'Component';
};

export default getDisplayName;
