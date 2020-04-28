"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const fs_1 = require("fs");
const xml2js = __importStar(require("xml2js"));
const version = {
    tag: '',
    major: 0,
    minor: 0,
    patch: 0,
    manifestSafeVersionString: '',
};
const formatVersion = (tagName) => {
    version.tag = tagName;
    const regex = /[^0-9.]/;
    const numbers = tagName.replace(regex, '').split('.');
    version.major = parseInt(numbers[0]);
    version.minor = parseInt(numbers[1]);
    version.patch = parseInt(numbers[2]);
    version.manifestSafeVersionString =
        version.major.toString().padStart(2, '0') +
            '.' +
            version.minor.toString().padStart(2, '0') +
            '.' +
            version.patch.toString().padStart(2, '0');
};
const setManifestVersion = () => {
    const manifest = fs_1.readdirSync('./Resources').filter(f => f.match(/.*\.dnn/))[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('Found manifest file: ', manifest);
    // Read the manifest
    const manifestFile = fs_1.readFileSync('./Resources/' + manifest);
    const parser = new xml2js.Parser();
    parser
        .parseStringPromise(manifestFile.toString())
        .then(result => {
        // Update manifest versions
        const packages = result.dotnetnuke.packages;
        for (let i = 0; i < packages[0].package.length; i++) {
            const dnnPackage = result.dotnetnuke.packages[0].package[i];
            dnnPackage.$.version = version.manifestSafeVersionString;
            console.log(`Set ${dnnPackage.$.name} to version ${dnnPackage.$.version}`);
        }
        // Write back the manifest
        const builder = new xml2js.Builder({
            headless: true,
            cdata: true,
        });
        const newManifestXml = builder.buildObject(result);
        fs_1.writeFile('./Resources/' + manifest, newManifestXml, err => {
            if (err) {
                console.log(err.message);
                core.setFailed(err.message);
            }
            else {
                console.log('Saved changes to ', manifest);
            }
        });
    })
        .catch(err => {
        console.error(err);
    });
};
const run = async () => {
    const octokit = new rest_1.Octokit({
        auth: '',
        userAgent: 'Language pack packaging',
    });
    const repo = octokit.repos
        .getLatestRelease({
        owner: 'dnnsoftware',
        repo: 'Dnn.Platform',
    })
        .then(fullfilled => {
        formatVersion(fullfilled.data.tag_name);
        console.log('Latest Dnn Release: ', version);
        setManifestVersion();
    }, rejected => {
        console.log(rejected);
    })
        .catch(error => console.log(error));
    console.log(repo);
};
run();
exports.default = run;
