const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/scripts/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'celebration.min.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
