// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function(config) {
    config.set({
        // logLevel: config.LOG_DEBUG,

        frameworks: ["jasmine", "karma-typescript"],
        files: [
            { pattern: "src/**/*.ts" },
            'node_modules/es6-shim/es6-shim.js',
            { pattern: 'node_modules/babel-polyfill/browser.js', instrument: false}
            // { pattern: "test/**/*.ts" }
        ],
        preprocessors: {
            "src/**/*.ts": ["karma-typescript"],
            // "test/**/*.ts": ["karma-typescript"]
        },
        reporters: ["mocha"],
        browsers: ['PhantomJS'],
        karmaTypescriptConfig: {
            tsconfig: "./tsconfig.json",
        },
        phantomjsLauncher: {
            // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom) 
            exitOnResourceError: true
        },
        client: {
            captureConsole: true
        }
    });
};
