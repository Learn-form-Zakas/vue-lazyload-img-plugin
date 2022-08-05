import LazyLoad from "../core/lazyload";

const MyPlugin = {};
MyPlugin.install = function (Vue, options) {
  Vue.mixin({
    mounted() {
      this.$nextTick(() => {
        this.$__vueLazyloadImg = LazyLoad(this.$el, options);
      });
    },
    updated() {
      this.$nextTick(() => {
        this.$__vueLazyloadImg = LazyLoad(this.$el, options);
      });
    },
    destroyed() {
      this.$__vueLazyloadImg.destroy();
    },
  });
};

export default MyPlugin;
