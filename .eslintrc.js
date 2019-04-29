'use strict';

module.exports = {
    // eslint: recommended automatically enables most/all rules from the
    // possible errors section and more:
    // http://eslint.org/docs/rules/#possible-errors
    extends: ['plugin:prettier/recommended'],
    env: {
        browser: false,
        node: true,
        es6: true,
        mocha: true
    },
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'error',

        // possible errors
        'no-cond-assign': ['error'],
        'no-constant-condition': ['error'],
        'no-control-regex': ['error'],
        'no-debugger': ['error'],
        'no-dupe-args': ['error'],
        'no-dupe-keys': ['error'],
        'no-duplicate-case': ['error'],
        'no-empty': ['error'],
        'no-empty-character-class': ['error'],
        'no-ex-assign': ['error'],
        'no-extra-boolean-cast': ['error'],
        'no-extra-semi': ['error'],
        'no-func-assign': ['error'],
        // this is for variable hoisting, not necessary if we use block scoped declarations
        // "no-inner-declarations": ["error", "both" ],
        'no-invalid-regexp': ['error'],
        'no-irregular-whitespace': ['error'],
        'no-reserved-keys': ['off'],
        'no-regex-spaces': ['error'],
        'no-sparse-arrays': ['error'],
        'no-unreachable': ['error'],
        'no-unsafe-negation': ['error'],
        'use-isnan': ['error'],
        'valid-jsdoc': [
            'error',
            {
                requireReturnDescription: false
            }
        ],
        'valid-typeof': ['error'],

        // best practices
        'array-callback-return': ['error'],
        'block-scoped-var': ['error'],
        'class-methods-use-this': ['error'],
        complexity: ['warn'],
        'consistent-return': ['error'],
        curly: ['error'],
        'default-case': ['error'],
        'dot-notation': ['error', { allowKeywords: true }],
        eqeqeq: ['error'],
        'guard-for-in': ['error'],
        'no-alert': ['error'],
        'no-caller': ['error'],
        'no-case-declarations': ['error'],
        'no-div-regex': ['error'],
        'no-empty-function': ['error'],
        'no-empty-pattern': ['error'],
        'no-eq-null': ['error'],
        'no-eval': ['error'],
        'no-extend-native': ['error'],
        'no-extra-bind': ['error'],
        'no-extra-label': ['error'],
        'no-fallthrough': ['error'],
        'no-floating-decimal': ['error'],
        'no-global-assign': ['error'],
        'no-implicit-coercion': ['error'],
        'no-implied-eval': ['error'],
        'no-iterator': ['error'],
        'no-labels': ['error'],
        'no-lone-blocks': ['error'],
        'no-loop-func': ['error'],
        'no-magic-numbers': ['off'],
        'no-multi-spaces': ['off'],
        'no-new': ['error'],
        'no-new-func': ['error'],
        'no-new-wrappers': ['error'],
        'no-octal': ['error'],
        'no-octal-escape': ['error'],
        'no-param-reassign': ['error'],
        'no-proto': ['error'],
        'no-redeclare': ['error'],
        'no-return-assign': ['error'],
        'no-script-url': ['error'],
        'no-self-assign': ['error'],
        'no-self-compare': ['error'],
        'no-sequences': ['error'],
        'no-throw-literal': ['error'],
        'no-unmodified-loop-condition': ['error'],
        'no-unused-expressions': ['error'],
        'no-unused-labels': ['error'],
        'no-useless-call': ['error'],
        'no-useless-concat': ['error'],
        'no-var': ['error'],
        'no-void': ['error'],
        'no-warning-comments': ['warn'],
        'no-with': ['error'],
        'prefer-const': ['error'],
        'wrap-iife': ['error'],
        yoda: ['error', 'never'],

        // strict mode
        strict: ['error', 'global'],

        // variables
        'no-catch-shadow': ['error'],
        'no-delete-var': ['error'],
        'no-shadow': ['error'],
        'no-shadow-restricted-names': ['error'],
        'no-undef': ['error'],
        'no-undef-init': ['error'],
        'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
        'no-use-before-define': ['error', 'nofunc'],

        // node.js
        'callback-return': [
            'error',
            ['callback', 'cb', 'cb1', 'cb2', 'cb3', 'next', 'innerCb', 'done']
        ],
        'global-require': ['error'],
        'handle-callback-err': ['error', '^.*(e|E)rr'],
        'no-mixed-requires': ['error'],
        'no-new-require': ['error'],
        'no-path-concat': ['error'],
        'no-process-exit': ['error']
    }
};
