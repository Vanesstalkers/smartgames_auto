const { defineConfig } = require('@vue/cli-service');
const path = require('path');

const resolve = (dir) => path.join(__dirname, dir);

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'development' ? '/' : '/auto/', // на prod-сервере будет еще и редирект от nginx
  transpileDependencies: true,
  configureWebpack: (config) => {
    config.resolve.alias['~'] = resolve('./../application');
  },
});
