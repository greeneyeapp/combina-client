module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './', // 🔥 kök klasöre yönlendir
            '@components': './components',
            '@context': './context',
            '@hooks': './hooks',
            '@locales': './locales',
            '@services': './services',
            '@store': './store',
            '@utils': './utils',
            "@assets": "./assets"
          }
        }
      ]
    ]
  };
};
