import React from 'react';

const CampgroundForm = ({ campground = null, isEditing = false, apiPath, children, ...props }) => {
  return React.createElement(
    'div',
    {
      'data-testid': 'campground-form',
      ...props,
    },
    children
  );
};

export default CampgroundForm;
