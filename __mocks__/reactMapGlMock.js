const React = require('react');

module.exports = {
  Map: ({ children, ...props }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'map',
        ...props,
      },
      children
    ),
  Marker: ({ children, ...props }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'marker',
        ...props,
      },
      children
    ),
  Popup: ({ children, ...props }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'popup',
        ...props,
      },
      children
    ),
  NavigationControl: (props) =>
    React.createElement('div', {
      'data-testid': 'navigation-control',
      ...props,
    }),
  GeolocateControl: (props) =>
    React.createElement('div', {
      'data-testid': 'geolocate-control',
      ...props,
    }),
  Source: ({ children, ...props }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'source',
        ...props,
      },
      children
    ),
  Layer: (props) =>
    React.createElement('div', {
      'data-testid': 'layer',
      ...props,
    }),
};
