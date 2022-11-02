<!-- prettier-ignore -->
# vue-lazuload-img-plugin

vue loader 插件 —— 图片懒加载以及自动压缩（包括背景图、富文本）

> 🌟🌟🌟 **老项目优化利器， 无需动任何业务代码** 🌟🌟🌟，如`src`批量改成`data-src`之类的操作，
> <br />webpack 引入本插件即可实现全局图片性能优化，具体操作详见下文

压缩技术支持来自 —— [《阿里云 oss-图片高级压缩》](https://help.aliyun.com/document_detail/135444.html)

1.  **有设置固定宽高时**`（如 <img width="200" /> ）`

    判断 图片过小时`minSize=64`不压缩，如 icon 图标
    <br />判断 图片过大时`maxSize=16393`不压缩，oss 不支持压缩高/宽超过 16383px

2.  **未设置固定高宽时**`（利用图片自身natural高宽占位渲染，常见于富文本）`

    先 **渐进式加载**（1%质量图`q_1` ） 以获取占位宽高，并添加 `onload` 事件
    <br /> 在 `onload` 事件中继续执行上述**【操作 1 】**

<img src="https://github.com/Learn-form-Zakas/vue-lazyload-img-plugin/blob/master/xmind/前端性能优化-图片.png"/>

## Install <a href="https://npmjs.org/package/vue-lazyload-img-plugin"><img alt="npm version" src="http://img.shields.io/npm/v/vue-lazyload-img-plugin.svg?style=flat-square"></a> <a href="https://npmjs.org/package/vue-lazyload-img-plugin"><img alt="npm dm" src="http://img.shields.io/npm/dm/vue-lazyload-img-plugin.svg?style=flat-square"></a>

```bash
npm i vue-lazyload-img-plugin
```

# 1. Vue 项目使用步骤

## 第一步 vue.config.js 配置

> 原理：利用 loader 将`<img src>`修改为`<img src='{thumbnail src}' data-src='{origin src}'>`

```js
// vue.config.js
const lazyloadImgVueConfig = require('vue-lazyload-img-plugin').LazyloadImgVueConfig

// ...

chainWebpack(config) {
  // ...
  lazyloadImgVueConfig(config,options);//options同webpack config
}
```

### 如果没有`vue.config.js`而是用的`webpack.config.js`配置

```js
// webpack config
const lazyloadImgWebpackLoader =
  require("vue-lazyload-img-plugin").LazyloadImgWebpackLoader;

{
  resolve: {
    alias: {
      '@': rootPath('src'),
      vue$: 'vue/dist/vue.esm.js',
      images: rootPath('src/assets/images'),
    },
  },
  module: {
    rules: [
      lazyloadImgWebpackLoader(options:{alias:['@','vue$','images']}), //详见目录##config options
      // 如果有配'vue-loader'请注释掉代码，否则会有loader重复冲突
      // {
      // test: /\.vue$/,
      // loader: 'vue-loader',
      // },
    ];
  }
}
```

### config options

| 属性  | 描述             | 默认值 |
| ----- | ---------------- | ------ |
| alias | 图片路径资源别名 | []     |

---

## 第二步 Vue.use(plugin) 安装插件

> 原理：利用 plugin 在 vue 组件的 beforeCreate 阶段监听 img dom 的生成和可视区域监听
> 当 img 可视时，再将 origin 资源加载到当前 img 上

<b>`/main.js`文件</b>

```js
import { LazyLoadImgPlugin } from "vue-lazyload-img-plugin";

Vue.use(LazyLoadImgPlugin, pluginOptions); // options见目录#plugin options
```

### plugin options

| 属性    | 描述                               | 默认值              |
| ------- | ---------------------------------- | ------------------- |
| host    | **正则**匹配需要被应用的图床服务器 | 无，需必填          |
| reg     | **正则**匹配需要被引用的图片类型   | `.jpg\|.jpeg\|.png` |
| maxSize | 接受压缩的最大图片尺寸             | 16383               |
| minSize | 接受压缩的最小图片尺寸             | 64                  |

> `maxSize`说明: Maximum width and height allowed is 16383 pixels for converting webp.

---

# 2. html 标签属性补充

> 可在 html 标签内添加额外配置属性

| 属性          | 描述                                           | 默认值  |
| ------------- | ---------------------------------------------- | ------- |
| v-no-lazyload | 不接受懒加载                                   | `false` |
| v-no-compress | 不接受图片压缩                                 | `false` |
| v-no-compile  | 在编译期间禁止改动，即不接受任何处理(vue 项目) | `false` |

```html
<!-- 图片不接受懒加载 -->
<img src="" v-no-lazyload />

<!-- 图片不接受压缩 -->
<img src="" v-no-compress />

<!-- 背景图片不接受懒加载和压缩 -->
<div style="background:url('')" v-no-lazyload v-no-compress></div>

<!-- 禁止本插件对此标签的任何改动 -->
<img src="" v-no-compile />
<!-- 只支持一层标签，暂不支持为父标签设置后影响子标签的行为 -->
<div style="background:url('')" v-no-compile></div>

<!-- 🌟 可通过主动添加query参数覆盖动态压缩参数 -->
<img
  src="http://image-demo.oss-cn-hangzhou.aliyuncs.com/example.jpg?x-oss-process=image/resize,p_50"
/>

<!-- 富文本内所有图片不接受懒加载 -->
<div v-html="..." v-no-lazyload></div>
<!-- 富文本内所有图片和背景图都不支持压缩 -->
<div v-html="..." v-no-compress></div>
<!-- 禁止本插件对富文本有任何改动 -->
<div v-html="..." v-no-compile></div>
```

# 3. tips

1. 存在 DOM 操作时，请在`$nextTick`回调后执行

   ```js
   mounted(){
    this.$nextTick(() => {
      // DOM操作
      ...
    });
   }
   ```

2. 图片源资源地址被存储在`data-origin-src`中
   ```js
   // 可从这里获取源地址
   img.dataset.originSrc;
   ```
3. 为`<img/>`提前设定好高宽就可以减少一次服务器请求
