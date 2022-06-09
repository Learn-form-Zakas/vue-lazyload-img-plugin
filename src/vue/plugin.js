import LazyLoad from "../core/lazyload";

const MyPlugin = {};
MyPlugin.install = function (Vue, options) {
  Vue.mixin({
    mounted() {
      this.$nextTick(() => {
        LazyLoad(this.$el, options);
      });
    },
    updated() {
      this.$nextTick(() => {
        LazyLoad(this.$el, options);
      });
    },
  });
};

export default MyPlugin;
