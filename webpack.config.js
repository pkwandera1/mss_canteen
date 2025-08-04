const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',

    entry: './src/index.js',

    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'public', to: '' }, // Copies everything from public
        ],
      }),
    ],

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      open: true,
      hot: true,
      port: 8080,
      historyApiFallback: true, // ✅ prevents 404 errors on refresh
    },

    devtool: isProduction ? 'source-map' : 'eval-source-map', // ✅ better debugging
  };
};
