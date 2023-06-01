# postcss-namespace-selector

> Prefix every CSS selector with a custom namespace `.a => .namespace .a`

## Table of Contents

- [Install](#install)
- [Usage with PostCSS](#usage-with-postcss)
- [Usage with Webpack](#usage-with-webpack)
- [Options](#options)

## Install

```console
$ npm install postcss-namespace-selector
```

## Usage with PostCSS

```js
const prefixer = require('postcss-namespace-selector')

// css to be processed
const css = fs.readFileSync("input.css", "utf8")

const out = postcss().use(prefixer({
  prefix: '.some-selector',
  exclude: ['.c'],

  // Optional transform callback for case-by-case overrides
  transform: function (prefix, selector, prefixedSelector) {
    if (selector === 'body') {
      return 'body' + prefix;
    } else {
      return prefixedSelector;
    }
  }
})).process(css).css
```

Using the options above and the CSS below...

```css
body {
  background: red;
}

.a, .b {
  color: aqua;
}

.c {
  color: coral;
}
```

You will get the following output

```css
body.some-selector {
  background: red;
}

.some-selector .a, .some-selector .b {
  color: aqua;
}

.c {
  color: coral;
}
```

## Usage with webpack

Use it like you'd use any other PostCSS plugin. If you also have `autoprefixer` in your webpack config then make sure that `postcss-namespace-selector` is called first. This is needed to avoid running the prefixer twice on both standard selectors and vendor specific ones (ex: `@keyframes` and `@webkit-keyframes`).

```js
const prefixer = require('postcss-namespace-selector');

module: {
  rules: [{
    test: /\.css$/,
    use: [
      require.resolve('style-loader'),
      require.resolve('css-loader'),
      {
        loader: require.resolve('postcss-loader'),
        options: {
          plugins: () => [
            prefixer({
              namespace: '.my-namespace'
            }),
            autoprefixer({
              browsers: ['last 4 versions']
            })
          ]
        }
      }
    ]
  }]
}
```

## Options

- `prefix` - This string is added before every CSS selector.
- `exclude` - It's possible to avoid prefixing some selectors by passing an array of selectors (strings or regular expressions).
- `transform` - In cases where you may want to use the prefix differently for different selectors, it is possible to pass in a custom transform method.
- `findConfig` - will find the nearest postcss.config.js configuration file when set to `true`.
