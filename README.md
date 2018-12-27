@daybrush/jsdoc [![npm version](https://badge.fury.io/js/%40daybrush%2Fjsdoc.svg)](https://badge.fury.io/js/%40daybrush%2Fjsdoc)
=======

```bash
npm install --save-dev @daybrush/jsdoc
```

## Support Typescript from version 0.3.0
* [Scene.js Typescript API Documentation](http://daybrush.com/scenejs/release/latest/doc/index.html)
* [fjx.js Typescript API Documentation](http://daybrush.com/fjx/release/latest/doc/index.html)
* type
```ts
// jsdoc
/**
 * @typedef {() => void} A - description
 */

// for typescript
/**
 * @typedef - description
 */
export type A = () => void;

```
* interface
```ts
// jsdoc
/**
 * @typedef {TSInterface} A - description
 * @property {boolean} a
 * @property {string} a
 * @property {() => void} c
 */

// for typescript
/**
 * @typedef - description
 */
export interface A {
    a: boolean;
    b: string;
    c: () => void;
}
```

* function

```ts
// jsodc
/**
 * @function
 * @param {A | C} a
 * @param {B} b
 * @param {C} c
 * @returns {C} 
 */
export function A(a, b) {

}

// for typescript
/**
 */
export function A(a: C);
export function A(a: A, b; B): C {

}
```
* class method
```ts
// jsdoc
/**
 * @extends B
 * @implements C
 */
class A extends B {
    /**
     * @param {A} a
     * @param {B} b
     * @param {C} c
     */
    aaa(a, b, c) {}
}

// for typescript
/**
 */
class A extends B {
    /**
     */
    aaa(a: A, b: B, c: C) {}
}
```

* jsdoc.json
```json
{
    "plugins": [],
	"recurseDepth": 10,
	"opts": {
        "template": "./node_modules/daybrush-jsdoc-template",
        "destination": "./doc/"
    },
    "source": {
        "include": ["./src", "README.md"], 
        "includePattern": "(.+\\.js(doc|x)?|.+\\.ts(doc|x)?)$",
        "excludePattern": "(^|\\/|\\\\)_"
    },
    "sourceType": "module",
    "tags": {
        "allowUnknownTags": true,
        "dictionaries": ["jsdoc","closure"]
    },
    "templates": {
        "cleverLinks": false,
        "monospaceLinks": false
    }
}
```


JSDoc 3
=======

[![Build Status](https://travis-ci.org/jsdoc3/jsdoc.svg?branch=master)](http://travis-ci.org/jsdoc3/jsdoc)

An API documentation generator for JavaScript.

Want to contribute to JSDoc? Please read `CONTRIBUTING.md`.

Installation and Usage
----------------------

JSDoc supports Node.js 4.2.0 and later. You can install JSDoc globally or in your project's
`node_modules` folder.

To install the latest version on npm globally (may require `sudo`; [learn how to fix
this](https://docs.npmjs.com/getting-started/fixing-npm-permissions)):

    npm install -g jsdoc

To install the latest version on npm locally and save it in your package's `package.json` file:

    npm install --save-dev jsdoc

**Note**: By default, npm adds your package using the caret operator in front of the version number
(for example, `^3.5.2`). We recommend using the tilde operator instead (for example, `~3.5.2`),
which limits updates to the most recent patch-level version. See [this Stack Overflow
answer](https://stackoverflow.com/questions/22343224) for more information about the caret and tilde
operators.

To install the latest development version locally, without updating your project's `package.json`
file:

    npm install git+https://github.com/jsdoc3/jsdoc.git

If you installed JSDoc locally, the JSDoc command-line tool is available in `./node_modules/.bin`.
To generate documentation for the file `yourJavaScriptFile.js`:

    ./node_modules/.bin/jsdoc yourJavaScriptFile.js

Or if you installed JSDoc globally, simply run the `jsdoc` command:

    jsdoc yourJavaScriptFile.js

By default, the generated documentation is saved in a directory named `out`. You can use the
`--destination` (`-d`) option to specify another directory.

Run `jsdoc --help` for a complete list of command-line options.

Templates and Tools
-------------------

The JSDoc community has created numerous templates and other tools to help you generate and
customize your documentation. Here are just a few:

### Templates

+ [jaguarjs-jsdoc](https://github.com/davidshimjs/jaguarjs-jsdoc)
+ [DocStrap](https://github.com/docstrap/docstrap) ([example](https://docstrap.github.io/docstrap))
+ [jsdoc3Template](https://github.com/DBCDK/jsdoc3Template)
  ([example](https://github.com/danyg/jsdoc3Template/wiki#wiki-screenshots))
+ [minami](https://github.com/Nijikokun/minami)
+ [docdash](https://github.com/clenemt/docdash) ([example](http://clenemt.github.io/docdash/))
+ [tui-jsdoc-template](https://github.com/nhnent/tui.jsdoc-template) ([example](https://nhnent.github.io/tui.jsdoc-template/latest/))

### Build Tools

+ [JSDoc Grunt plugin](https://github.com/krampstudio/grunt-jsdoc)
+ [JSDoc Gulp plugin](https://github.com/mlucool/gulp-jsdoc3)

### Other Tools

+ [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown)
+ [Integrating GitBook with
JSDoc](https://medium.com/@kevinast/integrate-gitbook-jsdoc-974be8df6fb3)

For More Information
--------------------

+ Documentation is available at [Use JSDoc](http://usejsdoc.org).
+ Contribute to the docs at [jsdoc3/jsdoc3.github.com](https://github.com/jsdoc3/jsdoc3.github.com).
+ [Join JSDoc's Slack channel](https://jsdoc-slack.appspot.com/).
+ Ask for help on the [JSDoc Users mailing list](http://groups.google.com/group/jsdoc-users).
+ Post questions tagged `jsdoc` to [Stack
Overflow](http://stackoverflow.com/questions/tagged/jsdoc).

License
-------

JSDoc 3 is copyright (c) 2011-present Michael Mathews <micmath@gmail.com> and the [contributors to
JSDoc](https://github.com/jsdoc3/jsdoc/graphs/contributors).

JSDoc 3 is free software, licensed under the Apache License, Version 2.0. See the file `LICENSE.md`
in this distribution for more details.
