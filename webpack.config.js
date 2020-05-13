const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, './src/index.js'),
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './build'),
    },
    module: {
        rules: [{
            loader: 'babel-loader',
            test: /\.js$/,
            exclude: /node_modules/,
            query: {
                presets: ['@babel/preset-env']
            }
        }]
    }
}
