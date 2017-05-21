const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: [ path.resolve(__dirname, './src/app.js'), 'babel-polyfill' ],
    watch: false,
    output: {
        path: __dirname + '/build',
        filename: 'bundle.js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: [
            path.resolve('node_modules')
          ],
          loader: 'babel-loader',
          options: {
              presets: ['es2015']
          },
          options: {
              cacheDirectory: true
          }
        },
        {
          test: /\.html$/,
          loader: 'html-loader'
        },
        {
          test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
          loader: 'url-loader'
        },
        {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin( {
        $: 'jquery',
        jQuery: 'jquery'
      } )
    ]
};