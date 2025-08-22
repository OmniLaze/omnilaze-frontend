const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // 添加模块解析别名来修复 React Native Web 路径问题
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native/Libraries/Image/ImageProps': 'react-native-web/dist/exports/Image',
    'react-native/Libraries/Text/TextProps': 'react-native-web/dist/exports/Text',
    '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    '../../../exports/Platform': 'react-native-web/dist/exports/Platform',
    './PlatformUtils': 'react-native-web/dist/exports/Platform',
    '../PlatformUtils': 'react-native-web/dist/exports/Platform',
    '../../PlatformUtils': 'react-native-web/dist/exports/Platform',
    '../../../PlatformUtils': 'react-native-web/dist/exports/Platform',
    './cjs/react-dom.development.js': 'react-dom',
    './cjs/react-dom.production.min.js': 'react-dom',
  };
  
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

  // 确保可解析 TypeScript 扩展（包含 node_modules 下的 .ts/.tsx）
  config.resolve = config.resolve || {};
  config.resolve.extensions = Array.from(new Set([
    '.web.tsx', '.web.ts', '.ts', '.tsx',
    '.web.jsx', '.web.js', '.jsx', '.js',
    ...(config.resolve.extensions || [])
  ]));
  
  return config;
};
