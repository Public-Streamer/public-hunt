module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    'src/components/ui/**/*',
    'supabase/**/*',
    'app/**/*',
    'dist/**/*',
    'node_modules/**/*',
    '*.config.ts',
    '*.config.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    // React 18 specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 18
    'react/function-component-definition': [
      2,
      { namedComponents: 'arrow-function' },
    ],
    // Add your custom rules here
    'import/prefer-default-export': 'off',
    'react/require-default-props': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/jsx-props-no-spreading': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.ts', '**/*.test.tsx', 'vite.config.ts'],
      },
    ],
    'import/extensions': 'off',
    'react/button-has-type': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-unresolved': [
      'error',
      {
        ignore: ['^@/'],
      },
    ],
  },
  settings: {
    react: {
      version: '18.3.1', // Specify React 18 version
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
        paths: ['src'],
      },
    },
  },
};
