'use strict';

var parser = require('@babel/parser');
var env = require('jsdoc/env');
var logger = require('jsdoc/util/logger');
var TypescriptParser = require('ast-parser');

// exported so we can use them in tests
var parserOptions = exports.parserOptions = {
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateProperties',
        'classProperties',
        'decorators2',
        'doExpressions',
        'dynamicImport',
        'estree',
        'exportExtensions',
        'functionBind',
        'functionSent',
        'importMeta',
        'jsx',
        'decorators-legacy',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining'
    ],
    ranges: true,
    sourceType: env.conf.sourceType
};
var typescriptParserOptions = exports.typescriptParserOptions = {
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
    plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateProperties',
        'classProperties',
        'decorators2',
        'doExpressions',
        'dynamicImport',
        'typescript',
        'exportExtensions',
        'functionBind',
        'functionSent',
        'importMeta',
        'jsx',
        'decorators-legacy',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining'
    ],
    ranges: true,
    sourceType: env.conf.sourceType
};
// TODO: docs
/* eslint-disable no-empty-function */
var AstBuilder = exports.AstBuilder = function() {};
/* eslint-enable no-empty-function */

function parse(source, filename) {
    var ast;
    var length = filename.length;
    var options = parserOptions;
    var isTS = filename.indexOf('.ts') !== length - 3 || filename.indexOf('.tsx') !== length - 4;

    try {
        if (isTS) {
            options = typescriptParserOptions;
        }
        ast = parser.parse(source, options);

        if (isTS) {
            TypescriptParser.convert(ast);
        }
        // console.log(JSON.stringify(ast, null, 2));
    }
    catch (e) {
        logger.error('Unable to parse %s: %s', filename, e.message);
    }

    return ast;
}

// TODO: docs
AstBuilder.prototype.build = function(source, filename) {
    return parse(source, filename);
};
