var traverse = require("@babel/traverse").default;
var t = require("@babel/types");

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
function read(node, types) {
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
      obj[name] = node[name];
    }
  }
  return obj;
}
var types = {
  ExportNamedDeclaration: function (node) {
    var info = read(node, {
      declaration: "type",
      specifiers: "array",
      source: "value",
    });
    info.string = "export " + info.declaration.string;

    return info;
  },
  TSInterfaceDeclaration: function TSInterfaceDeclaration(node) {
    var info = read(node, {
      id: "type",
      typeParameters: "type",
      extends: "array",
      body: "type",
      declare: "value",
    });

    info.string = "interface " + info.id.string + info.typeParameters.string + " " + (info.extends.length ? "extends " : "") +
      map(info.extends, "string").join(",") + "{\n" + map(info.body, "string").join("\n") + "\n}";
    info.html = "interface " + info.id.html + info.typeParameters.html + " " + (info.extends.length ? "extends " : "") +
      map(info.extends, "html").join(",") + "{\n" + map(info.body, "html").join("\n") + "\n}";

    return info;
  },
  TSInterfaceBody: function TSInterfaceBody(node) {
    var info = read(node, {
      body: "array",
    });

    return info.body;
  },
  TSPropertySignature: function TSPropertySignature(node) {
    var info = read(node, {
      key: "type",
      typeAnnotation: "type",
      initializer: "type",
      computed: "value",
      optional: "value",
      readonly: "value",
    });

    info.string = info.key.string + (info.optional ? "?" : "") + info.typeAnnotation.string;
    info.html = info.key.html + (info.optional ? "?" : "") + info.typeAnnotation.html;
    
    return info;
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
    };
    info.string = (info.readonly ? "readonly " : "") + info.key.string + ": " + info.typeAnnotation.string;
    info.html = (info.readonly ? "readonly " : "") + info.key.string + ": " + info.typeAnnotation.html;
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
    });

    info.string = info.key.string + (info.optional ? "?" : "") + info.typeParameters.string  +
      map(info.parameters, "string").join(", ") + (info.typeAnnotation.string ? ": " + info.typeAnnotation.string : "");
    info.type = info.typeParameters.string + "(" + map(info.parameters, "string").join(", ") + " => " + (info.typeAnnotation.string || "void");

    return info;
  },
  TSExpressionWithTypeArguments: function TSExpressionWithTypeArguments(node) {
    const expression = parse(node.expression, node);
    const typeParameters = parse(node.typeParameters, node);

    return {
      string: expression.string + (typeParameters.string ? `<${typeParameters.string}>` : ""),
      html: expression.string + (typeParameters.html ? `<${typeParameters.html}>` : ""),
      expression,
      typeParameters,
    }
  },
  TSCallSignatureDeclaration: function TSCallSignatureDeclaration(node) {
    const typeParameters = parse(node.typeParameters, node);
    const parameters = (node.parameters || []).map(param => parse(param, node));
    const typeAnnotation = parse(node.typeAnnotation, node);
    const key = {
      string: `${typeParameters.string}(${parameters.map(param => param.string).join(", ")})`,
    };
    return {
      string: `${key}: ${typeAnnotation.string}`,
      html: `${typeParameters.string}(${parameters.map(param => param.html).join(", ")}): ${typeAnnotation.html}`,
      key: key,
      name: key,
      type: typeAnnotation.string,
      typeParameters,
      parameters,
      typeAnnotation,
    }
  },
  TSTupleType: function TSTupleType(node) {
    const elementTypes = node.elementTypes.map(tp => parse(tp, node));

    return {
      string: `[${elementTypes.map(tp => tp.string).join(", ")}]`,
      html: `[${elementTypes.map(tp => tp.html).join(", ")}]`,
      elementTypes,
    }
  },
  TSTypePredicate: function TSTypePredicate(node) {
    const parameterName = parse(node.parameterName, node);
    const typeAnnotation = parse(node.typeAnnotation, node);

    return {
      string: `${parameterName.string} is ${typeAnnotation.string}`,
      parameterName,
      typeAnnotation,
    }
  },
  TSTypeAliasDeclaration: function TSTypeAliasDeclaration(node) {
    const id = parse(node.id, node);
    const typeParameters = parse(node.typeParameters, node);
    const typeAnnotation = parse(node.typeAnnotation, node);
    const declare = node.declare;

    return {
      string: `${id.string}${typeParameters.string} = ${typeAnnotation.string}`,
      id,
      typeParameters,
      typeAnnotation,
      declare,
    }
  },
  TSLiteralType: function TSLiteralType(node) {
    return parse(node.literal, node);
  },
  StringLiteral: function StringLiteral(node) {
    return {
      string: `"${node.value}"`,
      id: `"${node.value}"`,
    };
  },
  NumericLiteral: function NumericLiteral(node) {
    return {
      string: `${node.value}`,
      id: `${node.value}`,
    }
  },
  BooleanLiteral: function BooleanLiteral(node) {
    return {
      string: node.value,
      id: node.value,
    }
  },
  ObjectPattern: function ObjectPattern(node) {
    const properties = node.properties.map(property => parse(property, node));
    const decorators = (node.decorators || []).map(dec => parse(dec, node));
    const typeAnnotation = parse(node.typeAnnotation, node);
    return {
      string: `{${properties.map(property => property.string).join(", ")}}${typeAnnotation.string ? ": " + typeAnnotation.string : ""}`,
      html: `{${properties.map(property => property.html).join(", ")}}${typeAnnotation.string ? ": " + typeAnnotation.html : ""}`,
      properties,
      decorators,
      typeAnnotation,
    }
  },
  ObjectProperty: function (node) {
    const info = read(node, {
      key: "type",
      value: "type",
      computed: "value",
      shortahnd: "value",
      decorators: "array",
    });
    info.string = `${info.value.string}`;
    return info;
  },
  AssignmentPattern: function (node) {
    const info = read(node, {
      left: "type",
      right: "type",
      decorators: "array",
      typeAnnotation: "type",
    });

    info.string = `${info.left.string}${info.right.string ? " = " : ""}${info.right.string}`;
    return info;
  },
  TSTypeLiteral: function (node) {
    const info = read(node, {
        members: "array",
    });
    info.string = + info.members.length ? "{" + info.members.map(m => m.string).join(", ") + "}" : "";
    return info;
  },
  ClassMethod: function (node) {
    const {key, params: parameters, generator, async, returnType, typeParameters} = read(node, {
      key: "type",
      params: "array",
      generator: "value",
      async: "value",
      returnType: "type",
      typeParameters: "type",
    })

    return {
      string: `${key.string}${typeParameters.string}(${parameters.map(v => v.string).join(", ")})${returnType.string ? ": " : ""}${returnType.string}`,
      html: `${key.html}${typeParameters.html}(${parameters.map(v => v.html).join(", ")})${returnType.string ? ": " : ""}${returnType.html}`,
      key,
      typeParameters,
      generator,
      async,
      parameters,
      returnType,
    };
  },
  MethodDefinition: function (node) {
    const key = parse(node.key, node);
    const {params: parameters, generator, async, returnType, typeParameters} = read(node.value, {
      params: "array",
      generator: "value",
      async: "value",
      returnType: "type",
      typeParameters: "type",
    })
    return {
      string: `${key.string}${typeParameters.string}(${parameters.map(v => v.string).join(", ")})${returnType.string ? ": " : ""}${returnType.string}`,
      html: `${key.html}${typeParameters.html}(${parameters.map(v => v.html).join(", ")})${returnType.string ? ": " : ""}${returnType.html}`,
      key,
      typeParameters,
      generator,
      async,
      parameters,
      returnType,
    };
  },
  TSDeclareMethod: function TSDeclareMethod(node) {
    return this.ClassMethod(node);
  },
  ClassDeclaration: function ClassDeclaration(node) {
    const info = read(node, {
      id: "type",
      superClass: "type",
      decorators: "array",
      abstract: "value",
      declare: "value",
      implements: "array",
      minxins: "value",
      superTypeParameters: "type",
      typeParameters: "type",
    });    
    info.string = `${info.decorators.map(d => d.string).join("\n")}${info.decorators.length ? "\n" : ""}class ${info.id.string}${info.typeParameters.string}${info.superClass.string ? " extends " : ""}${info.superClass.string}${info.implements.length ? " implements " : ""}${info.implements.map(i => i.string).join(", ")}`

    return info;
  },
  Decorator: function Decorator(node) {
    const info = parse(node.expression);

    return {
      string: `@${info.string}`,
      expression: info,
    }
  },
  ArrayExpression: function ArrayExpression(node) {
    const info = read(node, {
      elements: "array",
    });
    info.string = `[${info.elements.map(e => e.string).join(", ")}]`;

    return info;
  },
  ObjectExpression: function ObjectExpression(node) {
    const info = read(node, {
      properties: "array",
    });
    info.string = `{${info.properties.map(p => p.string).join(", ")}}`;
    return info;
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
    const info = read(node, {
      value: "value",
      tail: "value",
    });

    info.string = info.value;

    return info;
  },
  CallExpression: function (node) {
    const info = read(node, {
      callee: "type",
      arguments: "array",
      optional: "value",
      typeArguments: "type",
      typeParameters: "type",
    });

   info.string = `${info.callee.string}${info.typeParameters.string}(${info.arguments.map(a => a.string).join(", ")})`;
   return info;
  },
  MemberExpression: function (node) {
    const info = read(node, {
      object: "type",
      property: "type",
      copmuted: "value",
      optional: "value",
    });

    info.string = `${info.object.string}.${info.property.string}`;

    return info;
  },
  ThisExpression: function (node) {
    return {
      string: "this",
      key: "this",
    }
  },
  BinaryExpression: function (node) {
    const info = read(node, {
      operator: "value",
      left: "type",
      right: "type"
    });
    info.string = `${info.left.string} = ${info.right.string}`;
    return info;
  },
  TSTypeOperator: function (node) {
    const info = read(node, {
      operator: "value",
      typeAnnotation: "type",
    });
    info.string = `${info.operator || ""} ${info.typeAnnotation.string}`;
    return info;
  },
  TSTypeParameter: function (node, parentNode) {
    const info = read(node, {
      constraint: "type",
      default: "type",
      name: "value",
    });
    info.string = `${info.name}${info.constraint.string ? ` extends ${info.constraint.string}` : ""}${info.default.string ? " = " + info.default.string : ""}`;
    info.html = `${info.name}${info.constraint.string ? ` extends ${info.constraint.html}` : ""}${info.default.html ? " = " + info.default.html : ""}`;

    return info;
  },
  TSConstructSignatureDeclaration: function (node, parentNode) {
    const info = read(node, {
      typeParameters: "type",
      parameters: "array",
      typeAnnotation: "type"
    });
    info.string = `new${info.typeParameters.string}(${info.parameters.map(p => p.string).join(", ")})${info.typeAnnotation.string ? ": " : ""}${info.typeAnnotation.string}`;

    return info;
  }
};
function parse(node, parentNode) {
  let rv = {};

  if (!node || !node.type) {
    rv = {
      kind: "none",
      string: "",
      nodeType: "",
    };
  } else {
    const nodeType = node.type;

    if (nodeType === "TSUnionType") {
      const childs = node.types.map(n => parse(n, node));

      rv = {
        kind: "split",
        string: childs.map(node => node.string).join(" | "),
        html: childs.map(node => node.html).join(" | "),
        childs,
      };
    } else if (nodeType === "TSIntersectionType") {
      const childs = node.types.map(n => parse(n, node));

      rv = {
        kind: "split",
        string: childs.map(node => node.string).join(" & "),
        html: childs.map(node => node.html).join(" & "),
        childs,
      };
    } else if (nodeType === "TSParenthesizedType") {
      const child = parse(node.typeAnnotation, node);

      rv = {
        kind: "none",
        string: `(${child.string})`,
        html: `(${child.html})`,
        child,
      };
    } else if (nodeType === "TSFunctionType") {
      const parameters = node.parameters.map(n => parse(n, node));
      const returnType = parse(node.typeAnnotation, node);
      const typeParameters = parse(node.typeParameters, node);

      rv = {
        kind: "function",
        string: `${typeParameters.string}(${parameters.map(v => v.string).join(", ")}) => ${returnType.string}`,
        html: `${typeParameters.html}(${parameters.map(v => v.html).join(", ")}) =&gt; ${returnType.html}`,
        typeParameters,
        parameters,
        returnType,
      };

    } else if (nodeType === "FunctionDeclaration" || nodeType === "TSDeclareFunction") {
      const id = parse(node.id, node);
      const parameters = node.params.map(n => parse(n, node));
      const returnType = parse(node.returnType, node);
      const typeParameters = parse(node.typeParameters, node);
      const async = !!node.async;
      const declare = node.declare;
      const generator = node.generator;

      rv = {
        kind: "function",
        string: `${declare ? "delcare " : ""}${async ? "async " : ""}function${generator ? "*" : ""} ${id.string}(${parameters.map(param => param.string).join(", ")})${returnType.string ? ": " : ""}${returnType.string}`,
        html: `${declare ? "delcare " : ""}${async ? "async " : ""}function${generator ? "*" : ""} ${id.html}(${parameters.map(param => param.html).join(", ")})${returnType.string ? ": " : ""}${returnType.html}`,
        typeParameters,
        parameters,
        returnType,
        async,
        declare,
        generator,
      };
    } else if (nodeType === "TSNumberKeyword") {
      rv = {
        kind: "keyword",
        string: "number",
      }
    } else if (nodeType === "TSStringKeyword") {
      rv = {
        kind: "keyword",
        string: "string",
      }
    } else if (nodeType === "TSVoidKeyword") {
      rv = {
        kind: "keyword",
        string: "void",
      }
    } else if (nodeType === "TSBooleanKeyword") {
      rv = {
        kind: "keyword",
        string: "boolean",
      }
    } else if (nodeType === "TSAnyKeyword") {
      rv = {
        kind: "keyword",
        string: "any",
      }
    } else if (nodeType === "TSTypeAnnotation") {
      return parse(node.typeAnnotation, node);
    } else if (nodeType === "TSTypeParameterDeclaration") {
      const childs = node.params.map(param => parse(param, node));

      if (!childs.length) {
        rv = {
          kind: "parameters",
          string: "",
          childs,
        }
      } else {
        rv = {
          kind: "parameters",
          string: `<${childs.map(child => child.string).join(", ")}>`,
          html: `&lt;${childs.map(child => child.html).join(", ")}&gt;`,
          childs,
          nodeType,
        }
      }
    } else if (nodeType === "Identifier") {
      const typeAnnotation = parse(node.typeAnnotation, node);
      const id = node.name;
      const optional = node.optional;
      const optionalString = optional ? "?" : "";
      const optionalHTML = optional ? `<span class="ts-style ts-optional">?</span>` : "";
      rv = {
        string: `${id}${optionalString}${typeAnnotation.string ? ": " : ""}${typeAnnotation.string}`,
        html: `${id}${optionalHTML}${typeAnnotation.html ? ": " : ""}${typeAnnotation.html}`,
        id,
        optional,
        typeAnnotation,
      };
    } else if (nodeType === "TSTypeReference") {
      const typeName = parse(node.typeName, node);
      const typeParameters = parse(node.typeParameters, node);

      rv = {
        string: typeName.string + (typeParameters.string ? `<${typeParameters.string}>` : ""),
        html: typeName.html + (typeParameters.html ? `&lt;${typeParameters.html}&gt;` : ""),
        typeName,
        typeParameters,
      }
    } else if (nodeType === "TSTypeParameterInstantiation") {
      const params = node.params.map(param => parse(param, node));

      rv = {
        string: params.map(param => param.string).join(", "),
        html: params.map(param => param.html).join(", "),
        params,
      }
    } else if (nodeType === "TSArrayType") {
      const elementType = parse(node.elementType, node);

      rv = {
        string: `${elementType.string}[]`,
        html: `${elementType.html}[]`,
        elementType,
      };
    } else if (nodeType === "RestElement") {
      const argument = parse(node.argument, node);
      // const decorators = parse(node.decorators);
      const typeAnnotation = parse(node.typeAnnotation, node);

      rv = {
        string: `...${argument.string}${typeAnnotation.string ? `: ${typeAnnotation.string}` : ""}`,
        html: `...${argument.html}${typeAnnotation.html ? `: ${typeAnnotation.html}` : ""}`,
        id: `...${argument.string}`,
        argument,
        typeAnnotation,
      };
    } else if (types[nodeType]) {
      rv = types[nodeType](node, parentNode);
      
    } else {
      console.log("register TS TYPE: " + nodeType, "parent TS Type: " + (parentNode && parentNode.type));
      rv = {}
    }
    rv.nodeType = nodeType;
  }
  !rv.isTypeScript && rv.string && (rv.isTypeScript = rv.nodeType.indexOf("TS") > -1);
  !("string" in rv) && (rv.string = rv.nodeType || "");
  rv.typeId = getTypeId;
  rv.html = rv.string ? `<span class="ts-style ts-${rv.nodeType.replace("TS", "").toLowerCase()}">${rv.html || rv.string}</span>` : "";
  return rv;
};
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
exports.toTSFunctionType
exports.parse = parse;
exports.find = find
exports.getTypeId = _getTypeId;
exports.convert = convert;