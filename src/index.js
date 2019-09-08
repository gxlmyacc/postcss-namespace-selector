const { dirname, relative } = require('path');
const fs = require('fs');
const findUp = require('find-up');

function fileExists(path) {
  try {
    return !fs.accessSync(path, fs.F_OK);
  } catch (e) {
    return false;
  }
}

function getConfigPath(configName, filename) {
  let findPath = findUp.sync(configName, {
    cwd: dirname(filename),
    type: 'file'
  });
  if (findPath && fileExists(findPath)) {
    if (relative(process.cwd(), findPath).startsWith('../')) return '';
    return findPath;
  }
}

// eslint-disable-next-line
const postcss_cached = {};
function getConfigNamespace(options, filename) {
  const confPath = getConfigPath('postcss.config.js', filename);
  if (!confPath) return;

  let cache = postcss_cached[confPath];
  if (!cache) {
    let conf = require(confPath);
    postcss_cached[confPath] = cache = { opts: { } };
    if (!conf) return;
    if (conf.namespace) cache.opts.namespace = conf.namespace;
    else cache.opts = (conf.plugins && conf.plugins['postcss-namespace-selector']) || {};
  }
  options = cache.opts;
  if (options.disabled) return '';
  return options.namespace || '';
}

// eslint-disable-next-line
const pkg_cached = {};
function getPkgNamespace(options, filename) {
  const confPath = getConfigPath('package.json', filename);
  if (!confPath) return;

  let cache = pkg_cached[confPath];
  if (!cache) {
    let conf = require(confPath);
    pkg_cached[confPath] = cache = { opts: { } };
    if (!conf) return;
    if (conf.namespace) cache.opts.namespace = conf.namespace;
    if (conf.postcss) {
      cache.opts.namespace = conf.postcss.namespace || '';
      cache.opts.disabled = conf.postcss.disabled;
    }
  }
  options = cache.opts;
  if (options.disabled) return '';
  return options.namespace || '';
}

module.exports = function postcssnamespaceSelector(options) {
  options = options || {};
  let _options = options;
  return function (root) {
    _options = options;

    let namespace;

    if (_options.disabled) return;

    const filename = root.source.input.file;

    if (_options.filenames) {
      Object.keys(_options.filenames).some(key => {
        let __options = _options.filenames[key];
        if (__options.regx.test(filename)) {
          namespace = __options.namespace || '';
          return true;
        }
      });
    }

    if (!namespace) {
      namespace = options.usePackage
        ? getPkgNamespace(options, filename)
        : getConfigNamespace(options, filename);
      if (!namespace) return;
    }

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

        if (['html', 'body'].includes(selector)) return selector;
        if (selector.startsWith('body ') || selector.startsWith('html ')) return selector;

        if (options.transform) {
          let ret = options.transform(
            namespace,
            selector,
            namespaceWithSpace + selector,
            root
          );
          if (ret === false) return selector;
          if (typeof ret === 'string') return ret;
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
