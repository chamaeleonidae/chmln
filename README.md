# Chameleon JavaScript Library

Easily add Chameleon to your product

The Chameleon JavaScript Library is a set of methods attached to a global `chmln` object intended to be used by websites wishing to [run tours or something ?????]. A full reference is available [here](docs url now ?????).

## Installation via NPM

This library is available as a package on NPM. to install into a project using NPM with a front-end packager such as Browserify or Webpack:

```shell
  npm install --save @chamaeleonidae/chmln
```

You can then require the lib like a standard Node.js module:

```javascript
const chmln = require('@chamaeleonidae/chmln');

chmln.init('YOUR_TOKEN');
chmln.identify('USER_ID', { email: 'user@email.com', ... });
chmln.track('An event');
```

## Usage

TODO: Describe function usage and it's params
