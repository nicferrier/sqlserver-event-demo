// fsasync stuff

const fs = require("fs");

fs.promises = {};

fs.promises.readdir = function (folder) {
    return new Promise(function (resolve, reject) {
        try {
            fs.readdir(folder, function (err, files) {
                if (err) reject(err);
                else resolve(files);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

fs.promises.readFile = function (filename, encoding) {
    return new Promise(function (resolve, reject) {
        try {
            let enc = (encoding === undefined) ? "utf8" : encoding;
            fs.readFile(filename, enc, function (err, buffer) {
                if (err) reject(err);
                else resolve(buffer);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

fs.promises.writeFile = function (filename, data, encoding) {
    return new Promise(function (resolve, reject) {
        try {
            let enc = encoding === undefined ? "utf8" : encoding;
            fs.writeFile(filename, data, enc, function (err) {
                if (err) reject(err);
                else resolve();
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

fs.promises.stat = function (path) {
    return new Promise(function (resolve, reject) {
        try {
            fs.stat(path, function (statObj, err) {
                if (err) reject(err);
                else resolve(statObj);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

fs.promises.exists = function (path) {
    return new Promise((resolve, reject) => {
        try {
            fs.access(path, fs.constants.R_OK | fs.constants.W_OK, err => {
                if (err) resolve(false);
                else resolve(true);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

fs.promises.mkdir = function (path) {
    return new Promise((resolve, reject) => {
        try {
            fs.mkdir(path, err => {
                if (err) reject(err);
                else resolve(true);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

module.exports = fs;

// fsasync.js ends here
