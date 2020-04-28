import * as core from '@actions/core';
//import * as github from '@actions/github';
import {Octokit} from '@octokit/rest';
import {readdirSync, writeFile, readFileSync} from 'fs';
import * as xml2js from 'xml2js';

const version = {
    tag: '',
    major: 0,
    minor: 0,
    patch: 0,
    manifestSafeVersionString: '',
};

const formatVersion = (tagName: string): void => {
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

const setManifestVersion = (): void => {
    const manifest = readdirSync('./Resources').filter(f => f.match(/.*\.dnn/))[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('Found manifest file: ', manifest);

    // Read the manifest
    const manifestFile = readFileSync('./Resources/' + manifest);
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
            writeFile('./Resources/' + manifest, newManifestXml, err => {
                if (err) {
                    console.log(err.message);
                    core.setFailed(err.message);
                } else {
                    console.log('Saved changes to ', manifest);
                }
            });
        })
        .catch(err => {
            console.error(err);
        });
};

const commitManifest = (): void => {
    // const octokit = new github.GitHub({
    //     auth: github.context.actor.
    // })
    // const currentCommit = await
    console.log(process.env);
};

const run = async (): Promise<void> => {
    console.log('process.env: ', process.env);
    const octokit = new Octokit({
        auth: '',
        userAgent: 'Language pack packaging',
    });

    const repo = octokit.repos
        .getLatestRelease({
            owner: 'dnnsoftware',
            repo: 'Dnn.Platform',
        })
        .then(
            fullfilled => {
                formatVersion(fullfilled.data.tag_name);
                console.log('Latest Dnn Release: ', version);

                setManifestVersion();
                console.log(process.env);
                commitManifest();
            },
            rejected => {
                console.log(rejected);
            },
        )
        .catch(error => console.log(error));

    console.log(repo);
};

run();

export default run;
