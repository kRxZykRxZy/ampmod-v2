const defaultsDeep = require("lodash.defaultsdeep");
const path = require("path");
const webpack = require("webpack");
const zlib = require("zlib");
const monorepoPackageJson = require("../../package.json");

// Plugins
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

// PostCss
const autoprefixer = require("autoprefixer");
const postcssVars = require("postcss-simple-vars");
const postcssImport = require("postcss-import");

const STATIC_PATH = process.env.STATIC_PATH || "/static";
const { APP_NAME, APP_SLOGAN, APP_DESCRIPTION } = require("@ampmod/branding");

const root = process.env.ROOT || "";
if (root.length > 0 && !root.endsWith("/")) {
    throw new Error("If ROOT is defined, it must have a trailing slash.");
}

if (process.env.ENABLE_SERVICE_WORKER) {
    console.warn(
        "amp: ENABLE_SERVICE_WORKER is deprecated as the service worker is now enabled by default. To disable the service worker, use DISABLE_SERVICE_WORKER instead."
    );
}

const IS_CBP_BUILD = Boolean(process.env.IS_CBP_BUILD);
const htmlWebpackPluginCommon = {
    root: root,
    meta: JSON.parse(process.env.EXTRA_META || "{}"),
    isCbp: process.env.IS_CBP_BUILD || false,
    APP_NAME,
};

// When this changes, the path for all JS files will change, bypassing any HTTP caches
const CACHE_EPOCH = `amp-${monorepoPackageJson.version}`;

const base = {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    devtool:
        process.env.SOURCEMAP ||
        (process.env.NODE_ENV === "production"
            ? false
            : "cheap-module-source-map"),
    devServer: {
        contentBase: path.resolve(__dirname, "build"),
        host: "0.0.0.0",
        disableHostCheck: true,
        compress: true,
        port: process.env.PORT || 8601,
        // allows ROUTING_STYLE=wildcard to work properly
        historyApiFallback: {
            rewrites: [
                { from: /^\/\d+\/?$/, to: "/index.html" },
                {
                    from: /^\/\d+\/fullscreen\/?$/,
                    to: "/fullscreen/index.html",
                },
                { from: /^\/\d+\/editor\/?$/, to: "/editor/index.html" },
                { from: /^\/\d+\/embed\/?$/, to: "/embed/index.html" },
                { from: /^\/addons\/?$/, to: "/addons/index.html" },
                { from: /^\/new-compiler\/?$/, to: "/new-compiler/index.html" },
                { from: /./, to: "/404.html" },
            ],
        },
    },
    output: {
        library: "GUI",
        filename:
            process.env.NODE_ENV === "production"
                ? `js/${CACHE_EPOCH}/[name].[contenthash].js`
                : "js/[name].js",
        chunkFilename:
            process.env.NODE_ENV === "production"
                ? `js/${CACHE_EPOCH}/[name].[contenthash].js`
                : "js/[name].js",
        publicPath: root,
    },
    resolve: {
        symlinks: false,
        alias: {
            "text-encoding$": path.resolve(
                __dirname,
                "src/lib/tw-text-encoder"
            ),
            "scratch-render-fonts$": path.resolve(
                __dirname,
                "src/lib/tw-scratch-render-fonts"
            ),
            "database": path.resolve(
                __dirname, 
                "src/database/"
            ),
        },
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                include: [
                    path.resolve(__dirname, "src"),
                    /node_modules[\\/]scratch-[^\\/]+[\\/]src/,
                    /node_modules[\\/]pify/,
                    /node_modules[\\/]@vernier[\\/]godirect/,
                ],
                options: {
                    cacheDirectory: true,
                    // Explicitly disable babelrc so we don't catch various config
                    // in much lower dependencies.
                    babelrc: false,
                    plugins: [
                        [
                            "react-intl",
                            {
                                messagesDir: "./translations/messages/",
                            },
                        ],
                    ],
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                },
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: "[name]_[local]_[hash:base64:5]",
                            camelCase: true,
                        },
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            ident: "postcss",
                            plugins: function () {
                                return [
                                    postcssImport,
                                    postcssVars,
                                    autoprefixer,
                                ];
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(svg|png|wav|mp3|gif|jpg|woff2?|hex)$/,
                loader: "url-loader",
                options: {
                    limit: 8192, // Convert images < 8kb to base64 strings
                    outputPath: "static/assets/",
                    esModule: false,
                },
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "../../node_modules/scratch-blocks/media",
                    to: "static/blocks-media/default",
                },
                {
                    from: "../../node_modules/scratch-blocks/media",
                    to: "static/blocks-media/high-contrast",
                },
                {
                    from: "src/lib/themes/blocks/high-contrast-media/blocks-media",
                    to: "static/blocks-media/high-contrast",
                    force: true,
                },
            ],
        }),
        new CompressionPlugin({
            filename:
                process.env.NODE_ENV === "production"
                    ? `js/${CACHE_EPOCH}/[name].js.br`
                    : "js/[name].js.br",
            algorithm: "brotliCompress",
            test: /js\/amp\-.*\.js$/,
            compressionOptions: {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                },
            },
            threshold: 1000,
            minRatio: 0.85,
            deleteOriginalAssets: "keep-source-map",
        }),
        new CompressionPlugin({
            filename: "microbit/[mame].hex.br",
            algorithm: "brotliCompress",
            test: /microbit\/.*\.hex$/,
            compressionOptions: {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                },
            },
            threshold: 1,
            minRatio: 0,
            deleteOriginalAssets: true,
        }),
    ],
};

if (!process.env.CI) {
    base.plugins.push(new webpack.ProgressPlugin());
}

module.exports = [
    // to run editor examples
    defaultsDeep({}, base, {
        entry: {
            editor: "./src/playground/editor.jsx",
            player: "./src/playground/player.jsx",
            fullscreen: "./src/playground/fullscreen.jsx",
            embed: "./src/playground/embed.jsx",
            "addon-settings": "./src/playground/addon-settings.jsx",
            credits: "./src/playground/credits/credits.jsx",
            home: "./src/playground/home/home.jsx",
            notfound: "./src/playground/not-found/not-found.jsx",
            newcompiler: "./src/playground/new-compiler/new-compiler.jsx",
            headeronly: "./src/playground/header-only.jsx",
        },
        output: {
            path: path.resolve(__dirname, "build"),
        },
        optimization: {
            splitChunks: {
                chunks: "all",
                minChunks: 2,
                minSize: 50000,
                maxInitialRequests: 5,
            },
        },
        plugins: base.plugins.concat([
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
                "process.env.DEBUG": Boolean(process.env.DEBUG),
                "process.env.DISABLE_SERVICE_WORKER": JSON.stringify(
                    process.env.DISABLE_SERVICE_WORKER || ""
                ),
                "process.env.ROOT": JSON.stringify(root),
                "process.env.ROUTING_STYLE": JSON.stringify(
                    process.env.ROUTING_STYLE || "filehash"
                ),
                "process.env.ampmod_version": JSON.stringify(
                    monorepoPackageJson.version
                ),
                "process.env.ampmod_is_canary":
                    process.env.BUILD_MODE === "canary",
                "process.env.ampmod_is_cbp": IS_CBP_BUILD,
            }),
            new HtmlWebpackPlugin({
                chunks: ["headeronly"],
                template: "src/playground/privacy.ejs",
                filename: "privacy.html",
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["editor"],
                template: "src/playground/index.ejs",
                filename: IS_CBP_BUILD ? "editor/index.html" : "editor.html",
                title: `${APP_NAME} - ${APP_SLOGAN}`,
                isEditor: true,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["player"],
                template: "src/playground/index.ejs",
                filename: IS_CBP_BUILD ? "player/index.html" : "player.html",
                title: `${APP_NAME} - ${APP_SLOGAN}`,
                isEditor: true,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["fullscreen"],
                template: "src/playground/index.ejs",
                filename: IS_CBP_BUILD
                    ? "fullscreen/index.html"
                    : "fullscreen.html",
                title: `${APP_NAME} - ${APP_SLOGAN}`,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["embed"],
                template: "src/playground/embed.ejs",
                filename: IS_CBP_BUILD ? "embed/index.html" : "embed.html",
                title: `Embedded Project - ${APP_NAME}`,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["home"],
                template: "src/playground/simple.ejs",
                filename: "index.html",
                title: `${APP_NAME} - ${APP_SLOGAN}`,
                description: APP_DESCRIPTION,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["newcompiler"],
                template: "src/playground/simple.ejs",
                filename: IS_CBP_BUILD
                    ? "new-compiler/index.html"
                    : "new-compiler.html",
                title: `New compiler - ${APP_NAME}`,
                // prettier-ignore
                // eslint-disable-next-line max-len
                description: `${APP_NAME} 0.3 includes a rewritten compiler to make projects run up to 2 times faster than in ${APP_NAME} 0.2.2.`,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["addon-settings"],
                template: "src/playground/simple.ejs",
                filename: IS_CBP_BUILD ? "addons/index.html" : "addons.html",
                title: `Addon Settings - ${APP_NAME}`,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["credits"],
                template: "src/playground/simple.ejs",
                filename: IS_CBP_BUILD ? "credits/index.html" : "credits.html",
                title: `Credits - ${APP_NAME}`,
                description: `Meet the development team of ${APP_NAME}.`,
                ...htmlWebpackPluginCommon,
            }),
            new HtmlWebpackPlugin({
                chunks: ["notfound"],
                template: "src/playground/simple.ejs",
                filename: "404.html",
                title: `Not Found - ${APP_NAME}`,
                ...htmlWebpackPluginCommon,
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "static",
                        to: "",
                    },
                ],
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "extensions/**",
                        to: "static",
                        context: "src/examples",
                    },
                ],
            }),
        ]),
    }),
].concat(
    process.env.NODE_ENV === "production" || process.env.BUILD_MODE === "dist"
        ? // export as library
          defaultsDeep({}, base, {
              target: "web",
              entry: {
                  "scratch-gui": "./src/index.js",
              },
              output: {
                  libraryTarget: "umd",
                  filename: "js/[name].js",
                  chunkFilename: "js/[name].js",
                  path: path.resolve("dist"),
                  publicPath: `${STATIC_PATH}/`,
              },
              module: {
                  rules: base.module.rules.concat([
                      {
                          test: /\.(svg|png|wav|mp3|gif|jpg|woff2|hex)$/,
                          loader: "url-loader",
                          options: {
                              limit: 2048,
                              outputPath: "static/assets/",
                              publicPath: `${STATIC_PATH}/assets/`,
                              esModule: false,
                          },
                      },
                  ]),
              },
              plugins: base.plugins.concat([
                  new CopyWebpackPlugin({
                      patterns: [
                          {
                              from: "extension-worker.{js,js.map}",
                              context: "node_modules/scratch-vm/dist/web",
                              noErrorOnMissing: true,
                          },
                      ],
                  }),
                  // Include library JSON files for scratch-desktop to use for downloading
                  new CopyWebpackPlugin({
                      patterns: [
                          {
                              from: "src/lib/libraries/*.json",
                              to: "libraries",
                              flatten: true,
                          },
                      ],
                  }),
              ]),
          })
        : []
);
