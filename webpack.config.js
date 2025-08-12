const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // 确保环境变量被注入
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'DefinePlugin') {
      plugin.definitions['process.env.REACT_APP_AMAP_KEY'] = JSON.stringify(
        process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32'
      );
      plugin.definitions['process.env.REACT_APP_API_URL'] = JSON.stringify(
        process.env.REACT_APP_API_URL || 'http://localhost:5002'
      );
    }
  });
  
  return config;
};