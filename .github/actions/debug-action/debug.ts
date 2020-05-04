import * as core from '@actions/core';
import * as github from '@actions/github';
import {readdirSync, writeFile, readFileSync} from 'fs';
import * as xml2js from 'xml2js';
import {exec} from '@actions/exec';
import * as artifact from '@actions/artifact';
import * as glob from '@actions/glob';

const setManifestVersion = (version: string): Promise<void> =>
    new Promise((resolve, reject) => {
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
                    dnnPackage.$.version = version;
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
                        resolve();
                    }
                });
            })
            .catch(err => {
                console.error(err);
                reject(err);
            });
    });

const commitManifest = async (): Promise<void> => {
    console.log('Commiting manifest...');

    try {
        await exec('git add *.dnn');
        await exec(`git config user.email ${github.context.payload.pusher.email}`);
        await exec(`git config user.name ${github.context.payload.pusher.name}`);
        await exec('git commit -m "Commits latest Dnn release version to manifest."');
        if (core.getInput('repo-token')) {
            await exec(
                `git push https://${github.context.actor}:${core.getInput('repo-token')}@github.com/${
                    github.context.repo.owner
                }/${github.context.repo.repo}.git`,
            );
        } else {
            await exec('git push');
        }
        Promise.resolve();
    } catch (error) {
        Promise.reject(error);
    }
};

const publishArtifact = async (version: string) => {
    // Get the files
    const patterns = ['**/Resources/*', '!**/node_modules/**'];
    const globber = await glob.create(patterns.join('\n'));
    const files = await globber.glob();

    // Publish the artifact
    const artifactClient = artifact.create();
    const uploadResult = await artifactClient.uploadArtifact(
        `${github.context.repo.repo}_${version}`,
        files,
        './Resources',
        {
            continueOnError: true,
        },
    );
    console.log(uploadResult.artifactName + ' published.');
};

const run = async (): Promise<void> => {
    const version = core.getInput('version');
    setManifestVersion(version).then(() => {
        commitManifest()
            .then(() => {
                console.log('Manifest commited');
                console.log('Publishing artifact');
                publishArtifact(version);
            })
            .catch(err => console.error(err));
    });
};

run();

export default run;
