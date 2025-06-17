// kodlar/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            "@": "./",
            "@components": "./components",
            "@context": "./context",
            "@hooks": "./hooks",
            "@locales": "./locales",
            "@services": "./services",
            "@store": "./store",
            "@utils": "./utils",
            "@assets": "./assets"
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ]
    ],
  };
};