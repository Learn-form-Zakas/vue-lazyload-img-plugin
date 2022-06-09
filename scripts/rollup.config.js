import babel from "rollup-plugin-babel";

const banner = `/**
 * @author <https://github.com/1uokun>
 * @copyright 1uokun. All rights reserved.
 */`;

export default [
  {
    input: "src/main.js",
    output: {
      file: "lib/vue-lazyload-img.js",
      sourcemap: false,
      format: "cjs",
      banner,
    },
    plugins: [
      babel({
        babelrc: false,
        runtimeHelpers: true,
        presets: ["@babel/preset-env"],
      }),
    ],
  },
];
