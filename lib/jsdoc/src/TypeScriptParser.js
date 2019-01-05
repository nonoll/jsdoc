var traverse = require("@babel/traverse").default;
var t = require("@babel/types");
var u = require("@daybrush/utils");

function _getTypeId(str) {
  return str ? "$ts:" + str : "";
}
function getTypeId() {
  return _getTypeId(this.string);
}

function _find(type, info) {
  if (!info) {
    return;
  }
  if (info.nodeType === type) {
    return info;
  }
  for (var key in info) {
    if (typeof info[key] === "object") {
      var result = _find(type, info[key]);

      if (result) {
        return result;
      }
    }
  }
}

function find(type, node) {
  return _find(type, parse(node));
}

function map(arr, property) {
  return arr.map(function (v) {
    return v[property];
  });
}
function read(node, types, others) {
  var obj = {};

  for (var name in types) {
    var type = types[name];

    if (type === "type") {
      obj[name] = parse(node[name], node);
    } else if (type === "array") {
      obj[name] = (node[name] || []).map(function (n) {
        return parse(n, node);
      });
    } else if (type === "get") {
      obj[name] = parse(node[name], node).string;
    } else if (type === "value") {
      obj[name] = name in node ? node[name] : "";
    }
  }
  for (var name in others) {
    obj[name] = others[name];

    if (typeof obj[name] === "string") {
      if (obj[name] === "template") {
        continue;
      } else if (obj[name].indexOf("@alias:") === 0) {
        obj[name] = obj[obj[name].substring(7)];
      } else {
        obj[name] = _replaceTemplate(obj[name], obj, "string");
      }
    }
  }
  if (obj.template) {
    obj.string =  _replaceTemplate(obj[name], obj, "string");
  }
  return obj;
}
function removeQuotation(str) {
  return str ? str.replace(/^'([^']*)'$/g, "$1").replace(/^"([^"]*)"$/g, "$1") : "";
}
function getValue(target, type, values) {
  if (Array.isArray(target)) {
    return target.map(function (v) {
      return v[type] || v.string;
    }).join(removeQuotation(values[1]) || ", ")
  } else if (typeof target === "object") {
    return target[type] || target.string;
  } else if (typeof target === "undefined") {
    return "";
  } else {
    return target;
  }
}
function replaceHTML(nodeType, content) {
  return content ? '<span class="ts-style ts-' + nodeType.replace("TS", "").toLowerCase() + '>' + content + '</span>' : '';
}
function _replaceTemplate(str, info, type) {
  return str.replace(/\$([a-z]*)\{((?:(?:'[^']*')|(?:"[^"]*")|(?:[^}]))*)\}/g, function (all, syntax, value) {
    var values = u.splitComma(value);
    var target = info[values[0]];
    if (syntax === "if") {
      var condition;
      if (Array.isArray(target)) {
        condition = !!target.length;
      } else if (typeof target === "object") {
        condition = !!target.string;
      } else {
        condition = !!target;
      }
      var rv = condition ? values[1] : values[2];
      
      return (rv || "").split("+").map(function (v) {
        var str2 = v.trim();

        if (str2.indexOf("'") > -1 || str2.indexOf('"') > -1) {
          return removeQuotation(str2);
        } else {
          return getValue(info[str2], type, []);
        }
      }).join("");
    }
    return getValue(target, type, values);
  });
}
function replaceTemplate(str, info) {
  if (!info.string) {
    info.string = _replaceTemplate(str, info, "string");
  }
  info.html = _replaceTemplate(str, info, "html");
}

function debug(func, selector) {
  var searchFunc = function () {
    return false;
  }
  if (selector && selector !== "*") {
    if (typeof selector === "string") {
      searchFunc = function (info, node, parentNode) {
        return node.type.toLowerCase().indexOf(selector.toLowerCase()) > -1;
      };
    } else if (selector instanceof RegExp) {
      searchFunc = function (info, node, parentNode) {
        return node.type.match(selector);
      };
    } else if (typeof selector === "function") {
      searchFunc = selector;
    }
  }
  
  var original = types._parse;

  
  types._parse = function (node, parentNode) {
    var info = original(node, parentNode);

    if (searchFunc(info, node, parentNode)) {
      func(info, node, parentNode);
    }
    return info;
  }
}
var types = {
  _parse: function(node, parentNode) {
    var rv = {};
    var nodeType = node.type;
    if (types[nodeType]) {
      rv = types[nodeType](node, parentNode);  
    } else {
      rv = {
        isNotExist: true,
      }
    }
    rv.nodeType = nodeType;
  
    if (rv.template) {
      replaceTemplate(rv.template, rv);
    }
    !("string" in rv) && (rv.string = rv.nodeType || "");
    if (!rv.html) {
      rv.html = replaceHTML(rv.nodeType, rv.string.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  
    return rv;
  },
  ExportNamedDeclaration: function (node) {
    var info = read(node, {
      declaration: "type",
      specifiers: "array",
      source: "value",
    }, {
      template: "export ${declaration}",
    });

    return info;
  },
  TSInterfaceDeclaration: function TSInterfaceDeclaration(node) {
    var info = read(node, {
      id: "type",
      typeParameters: "type",
      extends: "array",
      body: "type",
      declare: "value",
    }, {
      template: "interface ${id}${typeParameters} $if{extends, 'extends '}${extends, ', '} {\n${body, '\n'}\n}",
    });

    return info;
  },
  TSInterfaceBody: function TSInterfaceBody(node) {
    var info = read(node, {
      body: "array",
    });

    return info.body;
  },
  TSPropertySignature: function TSPropertySignature(node) {
    return read(node, {
      key: "type",
      typeAnnotation: "type",
      initializer: "type",
      computed: "value",
      optional: "value",
      readonly: "value",
    }, {
      template: "${key}$if{optional,'?'}: ${typeAnnotation}",
    });
  },
  TSThisType: function TSThisType(node) {
    return {
      string: "this",
    }
  },
  TSIndexSignature: function TSIndexSignature(node) {
    var info = read(node, {
      parameters: "array",
      typeAnnotation: "type",
      readonly: "value",
    });

    info.key = {
      string: "[" + map(info.parameters, "string").join(", ") + "]",
      html: "[" + map(info.parameters, "html").join(", ") + "]",
    };
    info.template = "$if{readonly,'readonly'}${key}: ${typeAnnotation}";
    return info;
    
  },
  TSMethodSignature: function TSMethodSignature(node) {
    var info = read(node, {
      key: "type",
      typeParameters: "type",
      parameters: "array",
      typeAnnotation: "type",
      computed: "value",
      optional: "value",
    }, {
      type: "${typeParameters}(${parameters}) => $if{typeAnnotation, typeAnnotation, 'void'}",
      template: "${key}$if{optional,'?'}${typeParameters}(${parameters})$if{typeAnnotation,': '}${typeAnnotation}"
    });
    return info;
  },
  TSExpressionWithTypeArguments: function TSExpressionWithTypeArguments(node) {
    var info = read(node, {
      expression: "type",
      typeParameters: "type",
    }, {
      string: "${expression}$if{typeParameters, '<'}${typeParameters}$if{typeParameters, '>'}",
    });

    return info;
  },
  TSCallSignatureDeclaration: function TSCallSignatureDeclaration(node) {
    var info = read(node, {
      typeParameters: "type",
      parameters: "array",
      typeAnnotation: "type",
    });
    var key = {
      string: `${info.typeParameters.string}(${info.parameters.map(param => param.string).join(", ")})`,
      html: `${info.typeParameters.html}(${info.parameters.map(param => param.html).join(", ")})`,
    };
    info.key = key;
    info.name = key;
    info.type = info.typeAnnotation.string;
    info.template = "${key}: ${typeAnnotation}";
    
    return info;
  },
  TSTupleType: function TSTupleType(node) {
    return read(node, {
      elementTypes: "array",
    }, {
      template: "[${elementTypes}]"
    });
  },
  TSTypePredicate: function TSTypePredicate(node) {
    var info = read(node, {
      parameterName: "type",
      typeAnnotation: "type",
    }, {
      template: "${parameterName} is ${typeAnnotation}",
    });
    return info;
  },
  TSTypeAliasDeclaration: function TSTypeAliasDeclaration(node) {
    var info = read(node, {
      id: "type",
      typeParameters: "type",
      typeAnnotation: "type",
      declare: "value",
    });
    info.template = "${id}${typeParameters} = ${typeAnnotation}";
    return info;
  },
  TSLiteralType: function TSLiteralType(node) {
    return parse(node.literal, node);
  },
  StringLiteral: function StringLiteral(node) {
    return {
      template: "${id}",
      id: `"${node.value}"`,
    };
  },
  NumericLiteral: function NumericLiteral(node) {
    return {
      template: "${id}",
      id: `${node.value}`,
    }
  },
  BooleanLiteral: function BooleanLiteral(node) {
    return {
      template: "${id}",
      id: node.value,
    }
  },
  ObjectPattern: function ObjectPattern(node) {
    var info = read(node, {
      properties: "array",
      decorators: "array",
      typeAnnotation: "type",
    });
    info.template = "{${properties}}$if{typeAnnotation, ': '}${typeAnnotation}";
    return info;
  },
  ObjectProperty: function (node) {
    const info = read(node, {
      key: "type",
      value: "type",
      computed: "value",
      shortahnd: "value",
      decorators: "array",
    });
    info.teamplte = "${value}";
    return info;
  },
  AssignmentPattern: function (node) {
    const info = read(node, {
      left: "type",
      right: "type",
      decorators: "array",
      typeAnnotation: "type",
    });
    info.template = "${left} = ${right}";
    return info;
  },
  TSTypeLiteral: function (node) {
    const info = read(node, {
        members: "array",
    }, {
      template: "$if{members, '{'}${members}$if{members, '}'}",
    });
    info.string = + info.members.length ? "{" + info.members.map(m => m.string).join(", ") + "}" : "";
    return info;
  },
  ClassMethod: function (node) {
    return read(node, {
      key: "type",
      params: "array",
      generator: "value",
      async: "value",
      returnType: "type",
      typeParameters: "type",
    }, {
      parameters: "@alias:params",
      template: "${key}${typeParameters}(${parameters})$if{returnType, ': ' + returnType}",
    });
  },
  MethodDefinition: function (node) {
    return read(node.value, {
      params: "array",
      generator: "value",
      async: "value",
      returnType: "type",
      typeParameters: "type",
    }, {
      key: parse(node.key, node),
      parameters: "@alias:params",
      template: "${key}${typeParameters}(${parameters})$if{returnType, ': ' + returnType}",
    });
  },
  TSDeclareMethod: function TSDeclareMethod(node) {
    return this.ClassMethod(node);
  },
  ClassDeclaration: function ClassDeclaration(node) {
    return read(node, {
      id: "type",
      superClass: "type",
      decorators: "array",
      abstract: "value",
      declare: "value",
      implements: "array",
      minxins: "value",
      superTypeParameters: "type",
      typeParameters: "type",
    }, {
      template: "$if{decorators, decorators + '\n'}class ${id}${typeParameters}$if{superClass, ' extends ' + superClass}$if{implements, ' implements ' + implements}",
    });
  },
  Decorator: function Decorator(node) {
    return read(node, {
      expression: "type",
    }, {
      template: "@${expression}",
    });
  },
  ArrayExpression: function ArrayExpression(node) {
    return read(node, {
      elements: "array",
    }, {
      template: "[${elements}]",
    });
  },
  ObjectExpression: function ObjectExpression(node) {
    return read(node, {
      properties: "array",
    }, {
      template: "{${properties}}",
    });
  },
  TemplateLiteral: function TemplateLiteral(node) {
    const info = read(node, {
      quasis: "array",
      expressions: "array",
    });
    const quasis = info.quasis;
    const expressions = info.expressions;

    var str = quasis[0] ? quasis[0].string : "";
    var length = quasis.length;

    for (var i = 1; i < length; ++i) {
      str += "${" + expressions[i - 1].string + "}";
      str += quasis[i].string;
    }
    info.string = "`" + str + "`";
    return info;
  },
  TemplateElement: function TemplateElement(node) {
    return read(node, {
      value: "value",
      tail: "value",
    }, {
      template: "${value}",
    });
  },
  CallExpression: function (node) {
    return read(node, {
      callee: "type",
      arguments: "array",
      optional: "value",
      typeArguments: "type",
      typeParameters: "type",
    }, {
      template: "${callee}${typeParameters}(${arguments})",
    });
  },
  MemberExpression: function (node) {
    return read(node, {
      object: "type",
      property: "type",
      copmuted: "value",
      optional: "value",
    }, {
      template: "${object}.${property}",
    });
  },
  ThisExpression: function (node) {
    return {
      template: "this",
      key: "this",
    }
  },
  BinaryExpression: function (node) {
    return read(node, {
      operator: "value",
      left: "type",
      right: "type"
    }, {
      template: "${left} ${operator} ${right}"
    });
  },
  TSTypeOperator: function (node) {
    return read(node, {
      operator: "value",
      typeAnnotation: "type",
    }, {
      template: "${operator} ${typeAnnotation}",
    });
  },
  TSTypeParameter: function (node, parentNode) {
    return read(node, {
      constraint: "type",
      default: "type",
      name: "value",
    }, {
      template: "${name}${constraint}$if{constraint, ' extends ' + constraint}$if{default, ' = ' + default}",
    });
  },
  TSConstructSignatureDeclaration: function (node, parentNode) {
    return read(node, {
      typeParameters: "type",
      parameters: "array",
      typeAnnotation: "type"
    }, {
      template: "new${typeParameters}(${parameters})$if{typeAnnotation, ': ' + typeAnnotation}"
    });
  },
  TSNeverKeyword: function (node) {
    return {
      template: "never",
      key: "never",
    }
  },
  TSNumberKeyword: function (node) {
    return {
      template: "number",
      key: "number",
    }
  },
  TSStringKeyword: function (node) {
    return {
      template: "string",
      key: "string",
    }
  },
  TSVoidKeyword: function (node) {
    return {
      template: "void",
      key: "void",
    }
  },
  TSBooleanKeyword: function (node) {
    return {
      template: "boolean",
      key: "boolean",
    }
  },
  TSAnyKeyword: function (node) {
    return {
      template: "any",
      key: "any",
    }
  },
  FunctionDeclaration: function (node) {
    return read(node, {
      id: "type",
      params: "array",
      returnType: "type",
      typeParameters: "type",
      aysnc: "value",
      declare: "value",
      generator: "value",
    }, {
      parameters: "@alias:params",
      template: "$if{declare, 'declare '}$if{async, 'async '}function${generator, '*'} ${id}(${parameters})$if{returnType, ':  ' + returnType}",
    });
  },
  TSDeclareFunction: function (node) {
    return this.FunctionDeclaration(node);
  },
  Identifier: function (node) {
    return read(node, {
      typeAnnotation: "type",
      name: "value",
      optional: "value",
    }, {
      id: "@alias:name",
      template: "${id}$if{optional, '?'}$if{typeAnnotation, ': ' + typeAnnotation}",
    });
  },
  TSFunctionType: function (node) {
    return read(node, {
      parameters: "array",
      returnType: "type",
      typeParameters: "type",
    }, {
      template: "${typeParameters}(${parameters}) => ${returnType}",
    });
  },
  TSTypeAnnotation: function (node) {
    return read(node, {
      typeAnnotation: "type",
    }, {
      template: "${typeAnnotation}",
    });
  },
  TSUnionType: function (node) {
    // A | B | C
    return read(node, {
      types: "array",
    }, {
      template: "${types, ' | '}",
    });
  },
  TSIntersectionType: function (node) {
    // A & B & C
    return read(node, {
      types: "array",
    }, {
      template: "${types, ' & '}",
    });
  },
  TSParenthesizedType: function (node) {
    // (A)
    return read(node, {
      typeAnnotation: "type",
    }, {
      template: "(${typeAnnotation})",
    });
  },
  TSTypeParameterDeclaration: function (node) {
    // <A, B, C, D>
    // <T, U, R>
    return read(node, {
      params: "array",
    }, {
      string: "$if{params, '<' + params + '>'}",
    });
  },
  TSTypeReference: function (node) {
    // ?
    return read(node, {
      typeName: "type",
      typeParameters: "type",
    }, {
      template: "${typeName}${typeParameters}",
    });
  },
  TSTypeParameterInstantiation: function (node) {
    // parent: TSTypeParameterDeclaration
    // T, U, R
    // A, B, C
    return read(node, {
      params: "array",
    }, {
      template: "${params}",
    });
  },
  TSArrayType: function (node) {
    // number[]
    // string[]
    return read(node, {
      elementType: "type",
    }, {
      template: "${elementType}[]",
    });
  },
  RestElement: function (node) {
    // ...args
    // ...args: any[],
    return read(node, {
      argument: "type",
      typeAnnotation: "type",
    }, {
      template: "...${argument}$if{typeAnnotation, '; ' + typeAnnotation}",
      id: "...${argument}",
    })
  },
  TSIndexedAccessType: function (node) {
    return read(node, {
      objectType: "type",
      indexType: "type",
    }, {
      template: "${objectType}[${indexType}]"
    });
  },
  TSConstructorType: function (node) {
    return read(node, {
      typeParameters: "type",
      typeAnnotation: "type",
      parameters: "array",
    }, {
      template: "new${typeParameters}(${parameters}) => ${typeAnnotation}",
    })
  }
};
function parse(node, parentNode) {
  var rv = {};

  if (!node || !node.type) {
    rv = {
      string: "",
      html: "",
      nodeType: "",
    };
  } else {
    rv = types._parse(node, parentNode);
  }
  rv.typeId = getTypeId;
  return rv;
}

function convert(ast) {
  traverse(ast, {
    ClassMethod(path) {
      const node = path.node;
      node.type = "MethodDefinition";
      node.value = t.functionExpression(null, node.params, node.body, node.generator, node.async);
      node.value.returnType = node.returnType
      node.value.typeParameters = node.typeParameters

      node.value.start = node.start + node.key.name.length;
      node.value.end = node.end;
      node.value.loc = {
        start: {
          line: node.loc.start.line,
          column: 0,
        },
        end: {
          line: node.loc.end.line,
          column: node.loc.end.column,
        }
      };
    }
  });
}

debug(function (info, node, parentNode) {
  console.log("register TS TYPE: " + node.type, "parent TS Type: " + (parentNode && parentNode.type));
}, function (info) {
  return info.isNotExist;
});

debug(function (info) {
  console.log(info.string);
}, "TSConstructorType");

exports.debug = debug;
exports.toTSFunctionType
exports.parse = parse;
exports.find = find
exports.getTypeId = _getTypeId;
exports.convert = convert;