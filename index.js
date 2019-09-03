const { dirname } = require('path');
const fs = require('fs');
const findUp = require('find-up');

function fileExists(path) {
  try {
    return !fs.accessSync(path, fs.F_OK);
  } catch (e) {
    return false;
  }
}

function getConfigPath(filename) {
  let findPath = findUp.sync('postcss.config.js', {
    cwd: dirname(filename),
    type: 'file'
  });
  if (findPath && fileExists(findPath)) return findPath;
}
const cached = {};

module.exports = function postcssnamespaceSelector(options) {
  options = options || {};
  let _options = options;
  return function(root) {
    _options = options;

    if (options.findConfig) {
      const filename = root.source.input.file;
      const confPath = getConfigPath(filename);
      if (!confPath) return;

      let cache = cached[confPath];
      if (!cache) {
        let conf = require(confPath);
        cache = { opts: { } };
        if (!conf) return;
        if (conf.namespace) cache.opts.namespace = conf.namespace;
        else cache.opts = (conf.plugins && conf.plugins['postcss-namespace-selector']) || {};
      }
      _options = cache.opts;
    }
    if (_options.disabled) return;
    let namespace = _options.namespace || '';
    if (!namespace) return;

    root.walkRules(rule => {
      const keyframeRules = [
        'keyframes',
        '-webkit-keyframes',
        '-moz-keyframes',
        '-o-keyframes'
      ];

      const namespaceWithSpace = /\s+$/.test(namespace) ? namespace : `${namespace} `;

      if (rule.parent && keyframeRules.includes(rule.parent.name)) return;

      rule.selectors = rule.selectors.map(selector => {
        if (options.exclude && excludeSelector(selector, options.exclude)) return selector;

        if (options.transform) {
          return options.transform(
            namespace,
            selector,
            namespaceWithSpace + selector
          );
        }

        return namespaceWithSpace + selector;
      });
    });
  };
};

function excludeSelector(selector, excludeArr) {
  return excludeArr.some(excludeRule => {
    if (excludeRule instanceof RegExp) {
      return excludeRule.test(selector);
    }
    return selector === excludeRule;
  });
}
