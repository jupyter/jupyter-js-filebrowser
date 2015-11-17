Jupyter JS Filebrowser
======================

File browser for Jupyter.

[API Docs](http://jupyter.github.io/jupyter-js-filebrowser/)


Package Install
---------------

**Prerequisites**
- [node](http://nodejs.org/)

```bash
npm install --save jupyter-js-filebrowser
```


Source Build
------------

**Prerequisites**
- [git](http://git-scm.com/)
- [node 0.12+](http://nodejs.org/)

```bash
git clone https://github.com/jupyter/jupyter-js-filebrowser.git
cd jupyter-js-filebrowser
npm install
npm run build
```

**Rebuild**
```bash
npm run clean
npm run build
```


Run Tests
---------

Follow the source build instructions first.

```bash
npm test
```


Build Docs
----------

Follow the source build instructions first.

```bash
npm run docs
```

Navigate to `docs/index.html`.


Build Example
-------------

Follow the source build instructions first.
Requires a Python install with the Jupyter notebook.

```bash
npm run build:example
```

Change to `example` directory and run `python main.py`.


Supported Runtimes
------------------

The runtime versions which are currently *known to work* are listed below.
Earlier versions may also work, but come with no guarantees.

- IE 11+
- Firefox 32+
- Chrome 38+


Bundle for the Browser
----------------------

Follow the package install instructions first.

```bash
npm install --save-dev browserify
browserify myapp.js -o mybundle.js
```


Usage Examples
--------------

**Note:** This module is fully compatible with Node/Babel/ES6/ES5. Simply
omit the type declarations when using a language other than TypeScript.
