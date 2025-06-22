module.exports = {
  // The parser that will convert TypeScript into an Abstract Syntax Tree
  parser: '@typescript-eslint/parser',
  
  // Specifies the ESLint parser options
  parserOptions: {
    ecmaVersion: 2021, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },

  // Specifies the environments and their global variables
  env: {
    node: true, // Enables Node.js global variables and Node.js scoping.
    es2021: true,
  },

  // The base configurations that ESLint extends from. Order is important.
  extends: [
    // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',
    
    // Enables eslint-plugin-prettier and eslint-config-prettier.
    // This will display prettier errors as ESLint errors.
    // This should always be the last configuration in the extends array.
    'plugin:prettier/recommended', 
  ],

  // Custom rules can be added here.
  rules: {
    // For example, you can disable a rule you don't agree with.
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Or change a rule's severity. 'warn' is less severe than 'error'.
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    
    // A rule from the prettier plugin
    'prettier/prettier': [
      'error',
      {
        'endOfLine': 'auto',
      }
    ]
  },
};