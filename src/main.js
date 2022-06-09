// base core 公共底层逻辑
export { default as LazyLoadImg } from "./core/lazyload";
// vue config
export { default as LazyLoadImgPlugin } from "./vue/plugin";
export {
  rewriteImgDataSrcAttrs,
  LazyloadImgVueConfig,
  LazyloadImgWebpackLoader,
} from "./vue/config";
