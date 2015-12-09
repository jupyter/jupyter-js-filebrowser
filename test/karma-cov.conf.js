module.exports = function (config) {
  config.set({
    basePath: '..',
    browsers: ['Firefox'],
    frameworks: ['mocha'],
    reporters: ['mocha', 'coverage'],
    files: [
      { pattern: 'lib/*.*', included: false },
      { pattern: 'package.json', included: false },
      { pattern: 'node_modules/**/*.*', included: false },
      { pattern: 'test/build/index.*', included: false },
      'node_modules/steal/steal.js',
      'test/karma.bootstrap.js'
    ],
    coverageReporter: {
      reporters : [
        { 'type': 'text' },
        { 'type': 'lcov', dir: 'test/coverage' },
        { 'type': 'html', dir: 'test/coverage' }
      ]
    },
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO
  });
};
