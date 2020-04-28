import * as core from '@actions/core';
import {Octokit} from '@octokit/rest';

const run = async (): Promise<void> => {
    const creature = core.getInput('amazing-creature');
    const message = `👏 Hello! You are an amazing ${creature}! 🙌`;
    core.debug(message);
    core.setOutput('amazing-message', message);
    // console.log({payload: github.context.payload});

    const octokit = new Octokit({
        userAgent: 'Language pack packaging',
    });

    octokit.repos
        .get({
            owner: 'dnnsoftware',
            repo: 'dnnplatform',
        })
        .then(repo => {
            console.log(repo);
        })
        .catch(reason => {
            core.setFailed(reason);
        });
};

run();

export default run;
