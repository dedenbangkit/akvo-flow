import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import path from 'path';
import { execSync } from 'child_process';

import devConfig from './webpack.config.dev';

export const HTML_CONFIG = {
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  },
  inject: 'body',
  trackJSToken: '',
};

export default {
  ...devConfig,
  devtool: 'source-map', // more info:https://webpack.js.org/guides/production/#source-mapping and https://webpack.js.org/configuration/devtool/
  plugins: [
    // Tells React to build in prod mode. https://facebook.github.io/react/downloads.html
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.ANALYTICS_SITE_ID': JSON.stringify('ceda081e-8077-4ea3-98bc-f608d6f87cc9'),
      __DEV__: false,
      __VERSION__: JSON.stringify(process.env.FLOW_GIT_VERSION || execSync('git describe').toString()),
    }),

    // Generate an external css file with a hash in the filename
    new ExtractTextPlugin({
      filename: '[name].[md5:contenthash:hex:20].css',
      allChunks: true,
    }),

    new HtmlWebpackPlugin({
      ...HTML_CONFIG,
      template: 'app/dashboard.ejs',
      chunks: ['admin'],
    }),

    new webpack.optimize.ModuleConcatenationPlugin(),

    new CopyPlugin([
      { from: 'app/js/plugins', to: 'js' },
      { from: 'app/static/images', to: 'images' },
      { from: 'app/js/vendor', to: '../vendorjs/js/vendor' },
    ]),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.eot(\?v=\d+.\d+.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff',
            },
          },
        ],
      },
      {
        test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/octet-stream',
            },
          },
        ],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/svg+xml',
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /\.(html)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|ico)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /(\.css|\.scss|\.sass)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [require('autoprefixer')],
                sourceMap: true,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: [path.resolve(__dirname, 'app', 'css')],
                sourceMap: true,
              },
            },
          ],
        }),
      },
      {
        test: /\.handlebars$/,
        use: ['text-loader'],
      },
    ],
  },
};
