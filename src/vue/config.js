function rewrite(options, node, attr) {
  const { attrsList = [], attrsMap = {}, rawAttrsMap = {} } = node;

  if (
    Array.isArray(options.alias) &&
    attrsList.filter(
      (a) => options.alias.findIndex((el) => a.value.indexOf(el) > -1) > -1
    ).length > 0
  ) {
    return node;
  }

  node.attrsList = attrsList.map((a) => {
    if (a.name === attr) {
      a.name = `data-${attr}`;
    }
    if (a.name === `:${attr}`) {
      a.name = `:data-${attr}`;

      if (attr === "style") {
        a.value = `JSON.stringify(${a.value})`;
      }
    }

    return a;
  });

  Object.keys(attrsMap).forEach((a) => {
    if (a === attr) {
      node.attrsMap[`data-${attr}`] = attrsMap[a];
      delete node.attrsMap[attr];
    }
    if (a === `:${attr}`) {
      node.attrsMap[`:data-${attr}`] = attrsMap[a];
      delete node.attrsMap[`:${attr}`];
    }
  });

  Object.keys(rawAttrsMap).forEach((a) => {
    if (a === `${attr}`) {
      node.rawAttrsMap[`data-${attr}`] = rawAttrsMap[a];
      delete node.rawAttrsMap[`${attr}`];
    }
    if (a === `:${attr}`) {
      node.rawAttrsMap[`:data-${attr}`] = rawAttrsMap[a];
      delete node.rawAttrsMap[`:${attr}`];
    }
  });

  return node;
}

function rewriteHTML(options, node, attr) {
  const { attrsList, attrsMap, rawAttrsMap } = node;
  if (
    Array.isArray(options.alias) &&
    attrsList.filter(
      (a) => options.alias.findIndex((el) => a.value.indexOf(el) > -1) > -1
    ).length > 0
  ) {
    return node;
  }

  node.attrsList = attrsList.map((a) => {
    if (a.name === attr) {
      a.name = `:data-html`;
    }

    return a;
  });

  Object.keys(rawAttrsMap).forEach((a) => {
    if (a === attr) {
      node.rawAttrsMap[`:data-html`] = rawAttrsMap[a];
      delete node.rawAttrsMap[attr];
    }
  });

  return node;
}

/**
 * 重写老代码的<img src>和 <tag style="backgroundImage">
 * * */
function rewriteImgDataSrcAttrs(options, node) {
  // 新增v-no-compile禁止任何编译期间的操作
  if (node.attrsList.filter((a) => a.name === "v-no-compile").length) {
    return node;
  }

  if (node.attrsList.filter((a) => a.name === "v-html").length) {
    node = rewriteHTML(options, node, "v-html");
  }

  if (node.attrsList.filter((a) => a.name === ":style").length) {
    node = rewrite(options, node, "style");
  }

  if (node.tag === "img") {
    node = rewrite(options, node, "src");
    node = rewrite(options, node, "alt");
  }

  return node;
}

// vue.config.js chainWebpack配置
function LazyloadImgVueConfig(config, options = {}) {
  config.module
    .rule("vue")
    .use("vue-loader")
    .options({
      compilerOptions: {
        modules: [
          {
            preTransformNode: rewriteImgDataSrcAttrs.bind(this, options),
          },
        ],
      },
    });
}

// webpack configuration配置
function LazyloadImgWebpackLoader(options) {
  return {
    test: /\.vue$/,
    use: {
      loader: "vue-loader",
      options: {
        compilerOptions: {
          modules: [
            {
              preTransformNode: rewriteImgDataSrcAttrs.bind(this, options),
            },
          ],
        },
      },
    },
  };
}

export {
  rewriteImgDataSrcAttrs,
  LazyloadImgVueConfig,
  LazyloadImgWebpackLoader,
};
