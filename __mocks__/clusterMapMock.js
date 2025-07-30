import React from 'react';

const ClusterMap = ({ campgrounds, children, ...props }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'cluster-map',
      ...props,
    },
    children
  );
};

export default ClusterMap;
