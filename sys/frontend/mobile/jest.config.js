module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@reduxjs/toolkit|immer|react-redux|@react-native-async-storage/async-storage|axios)/)',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
};
