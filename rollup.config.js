import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import pkg from "./package.json";
import buble from "rollup-plugin-buble";
import { terser } from "rollup-plugin-terser";
import json from "rollup-plugin-json";

const plugins = [
    resolve(), // so Rollup can find `ms`
    commonjs(), // so Rollup can convert `ms` to an ES module
    babel({
        presets: [
            [
                "@babel/env",
                {
                    useBuiltIns: "usage", // import polyfills for the features that we only use.
                    targets: {
                        safari: "11.1",
                        ie: "11",
                        firefox: "60",
                        edge: "17",
                        chrome: "67"
                    },
                    // Setting this to "false" will not transform modules (this transformation is done by Rollup).
                    modules: false
                }
            ]
        ],
        exclude: "node_modules/**"
    }),
    buble({
        exclude: "node_modules/**"
    }),
    json()
];

// We can use the rollup-plugin-terser to minify our bundle.
const pluginsWithMinify = [
    resolve(), // so Rollup can find `ms`
    commonjs(), // so Rollup can convert `ms` to an ES module
    babel({
        presets: [
            [
                "@babel/env",
                {
                    useBuiltIns: "usage", // import polyfills for the features that we only use.
                    targets: {
                        safari: "11.1",
                        ie: "11",
                        firefox: "60",
                        edge: "17",
                        chrome: "67"
                    },
                    // Setting this to "false" will not transform modules (this transformation is done by Rollup).
                    modules: false
                }
            ]
        ],
        exclude: "node_modules/**"
    }),
    buble({
        exclude: "node_modules/**"
    }),
    json(),
    // minify()
    terser()
];

const browserFriendlyConfiguration = Object.freeze({
    plugins,
    output: {
        name: "WCMRestAPI",
        format: "iife",
        file: pkg.unpkg
    },
    input: "src/index.js"
});

const browserFriendlyConfigurationWithMinify = Object.freeze({
    plugins: pluginsWithMinify,
    output: {
        name: "WCMRestAPI",
        format: "iife",
        file: pkg.unpkg.replace(/\.js$/, ".min.js")
    },
    input: "src/index.js"
});

const commonJSAndESModulesConfiguration = Object.freeze({
    // external: [
    // 'moment'
    // 'lodash/random', // The module listed on the external option must match exactly the same as how we imported it in our code
    // ],
    // If we choose to generate the umd or iife format, we have to specify the global option too.
    // This option tells Rollup on how to access that peer dependency.
    // globals: {
    //   'lodash/random': '_.random'
    // },
    plugins,
    output: [
        { name: "wcm-rest-api.bundle.umd", format: "umd", file: pkg.main },
        { format: "es", file: pkg.module }
    ],
    input: "src/index.js"
});

const commonJSAndESModulesConfigurationWithJSMinify = Object.freeze({
    // external: [
    // 'moment'
    // 'lodash/random', // The module listed on the external option must match exactly the same as how we imported it in our code
    // ],
    // If we choose to generate the umd or iife format, we have to specify the global option too.
    // This option tells Rollup on how to access that peer dependency.
    // globals: {
    //   'lodash/random': '_.random'
    // },
    plugins: pluginsWithMinify,
    output: [
        {
            name: "wcm-rest-api.bundle.umd",
            format: "umd",
            file: pkg.main.replace(/\.js$/, ".min.js")
        }
        // {file: pkg.module.replace(/\.js$/, '.min.js'), format: 'es'},
    ],
    input: "src/index.js"
});

export default [
    // browser-friendly IIFE build
    browserFriendlyConfiguration,
    // browser-friendly IIFE build + JS minification
    browserFriendlyConfigurationWithMinify,

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    commonJSAndESModulesConfiguration,
    commonJSAndESModulesConfigurationWithJSMinify
];
