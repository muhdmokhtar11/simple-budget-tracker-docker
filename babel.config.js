module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { allowNamespaces: true }],
  ],
  plugins: [
    // Add Istanbul plugin for code coverage when in test environment
    process.env.NODE_ENV === 'test' && [
      'babel-plugin-istanbul',
      {
        extension: ['.js', '.jsx', '.ts', '.tsx'],
        exclude: ['node_modules/**', 'src/test/**', 'src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
      },
    ],
  ].filter(Boolean),
};
