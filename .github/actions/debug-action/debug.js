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
const github = __importStar(require("@actions/github"));
const rest_1 = require("@octokit/rest");
const fs_1 = require("fs");
const xml2js = __importStar(require("xml2js"));
const exec_1 = require("@actions/exec");
const artifact = __importStar(require("@actions/artifact"));
const glob = __importStar(require("@actions/glob"));
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
const setManifestVersion = () => new Promise((resolve, reject) => {
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
                resolve();
            }
        });
    })
        .catch(err => {
        console.error(err);
        reject(err);
    });
});
const commitManifest = async () => {
    console.log('Commiting manifest...');
    try {
        await exec_1.exec('git add *.dnn');
        await exec_1.exec(`git config user.email ${github.context.payload.pusher.email}`);
        await exec_1.exec(`git config user.name ${github.context.payload.pusher.name}`);
        await exec_1.exec('git commit -m "Commits latest Dnn release version to manifest."');
        if (core.getInput('repo-token')) {
            await exec_1.exec(`git push https://${github.context.actor}:${core.getInput('repo-token')}@github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`);
        }
        else {
            await exec_1.exec('git push');
        }
        Promise.resolve();
    }
    catch (error) {
        Promise.reject(error);
    }
};
const publishArtifact = async () => {
    // Get the files
    const patterns = ['**/Resources/*'];
    const globber = await glob.create(patterns.join('\n'));
    const files = await globber.glob();
    // Publish the artifact
    const artifactClient = artifact.create();
    const uploadResult = await artifactClient.uploadArtifact(github.context.repo.repo, files, './Resources', {
        continueOnError: true,
    });
    console.log(uploadResult.artifactName + ' published.');
};
const run = async () => {
    console.log(github.context);
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
        setManifestVersion().then(() => {
            commitManifest()
                .then(() => {
                console.log('Manifest commited');
                console.log('Publishing artifact');
                publishArtifact();
            })
                .catch(err => console.error(err));
        });
    }, rejected => {
        console.log(rejected);
    })
        .catch(error => console.log(error));
    console.log(repo);
};
run();
exports.default = run;
