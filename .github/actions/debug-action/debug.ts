//import * as core from '@actions/core';
import {Octokit} from '@octokit/rest';

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

const run = async (): Promise<void> => {
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
