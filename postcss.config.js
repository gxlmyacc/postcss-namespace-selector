module.exports = {
  namespace: '.namespace',
  plugins: [
    require('./src')({ findConfig: true })
  ]
};
