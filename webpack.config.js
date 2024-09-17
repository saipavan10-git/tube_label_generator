const path = require('path');

module.exports = {
    entry: {
        generateTubeLabels: './js/generateTubeLabels.js',
    },
    output: {
        filename: 'generateTubeLabels.bundle.js',
        path: path.resolve(__dirname, 'js'),
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
};
