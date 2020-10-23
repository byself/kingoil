module.exports = {
  extends: ['eslint-config-alloy/vue'],
  globals: {
    chrome: true
  },
  env: {
    jquery: true,
    browser: true,
    commonjs: true,
    es6: true
  },
  rules: {
    'function-call-argument-newline': 'off',
    'function-paren-newline': 'off',
    'no-extend-native': 'off',
    'no-undef': 'off'
  }
}
