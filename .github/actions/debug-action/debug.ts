import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async (): Promise<void> => {
    const creature = core.getInput('amazing-creature');
    const message = `👏 Hello! You are an amazing ${creature}! 🙌`;
    core.debug(message);
    core.setOutput('amazing-message', message);
    // console.log({payload: github.context.payload});

    const gh = new github.GitHub({
        auth: '',
        userAgent: 'Package Language Pack',
    });
    const repo = gh.repos.get({
        owner: 'dnnsoftware',
        repo: 'dnnplatform',
    });
    console.log(repo);
};

run();

export default run;
