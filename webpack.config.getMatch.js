const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const externalsWhitelist = require('./externalsWhitelist');

require('dotenv').config();

const GLOBALS = {
    'process.env': {
        NODE_ENV: JSON.stringify('production'),
        MONGO_CONNECTION: JSON.stringify(process.env.MONGO_CONNECTION),
    },
};

module.exports = {
    mode: 'production',
    entry: './src/lambdas/match/getMatch.js',
    target: 'node',
    output: {
        path: path.join(__dirname, '/lambdas-dist/get-match'),
        filename: 'getMatch.js',
        libraryTarget: 'commonjs',
        library: 'getMatch',
    },
    plugins: [new webpack.DefinePlugin(GLOBALS)],
    externals: [nodeExternals({ whitelist: externalsWhitelist })],
};
