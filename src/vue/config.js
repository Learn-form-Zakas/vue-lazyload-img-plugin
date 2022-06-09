function rewrite(options, node, attr) {
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
      a.name = `data-dxylazyload-${attr}`;
    }
    if (a.name === `:${attr}`) {
      a.name = `:data-dxylazyload-${attr}`;

      if (attr === "style") {
        a.value = `JSON.stringify(${a.value})`;
      }
    }

    return a;
  });

  Object.keys(attrsMap).forEach((a) => {
    if (a === attr) {
      node.attrsMap[attr === "style" ? "dataStyle" : "dataSrc"] = attrsMap[a];
      delete node.attrsMap[attr];
    }
    if (a === `:${attr}`) {
      node.attrsMap[`:data-dxylazyload-${attr}`] = attrsMap[a];
      delete node.attrsMap[`:${attr}`];
    }
  });

  Object.keys(rawAttrsMap).forEach((a) => {
    if (a === `:${attr}`) {
      node.rawAttrsMap[`:data-dxylazyload-${attr}`] = rawAttrsMap[a];
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
      a.name = `:data-dxy-html`;
    }

    return a;
  });

  Object.keys(rawAttrsMap).forEach((a) => {
    if (a === attr) {
      node.rawAttrsMap[`:data-dxy-html`] = rawAttrsMap[a];
      delete node.rawAttrsMap[attr];
    }
  });

  return node;
}

/**
 * 重写老代码的<img src>和 <tag style="backgroundImage">
 * * */
function rewriteImgDataSrcAttrs(options, node) {
  // 新增v-no-complie禁止任何编译期间的操作
  if (node.attrsList.filter((a) => a.name === "v-no-complie").length) {
    return node;
  }

  if (node.attrsList.filter((a) => a.name === "v-html").length) {
    return rewriteHTML(options, node, "v-html");
  }

  if (node.attrsList.filter((a) => a.name === ":style").length) {
    return rewrite(options, node, "style");
  }

  if (node.tag === "img") {
    return rewrite(options, node, "src");
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
