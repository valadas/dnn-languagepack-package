import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async (): Promise<void> => {
    const creature = core.getInput('amazing-creature');
    const message = `👏 Hello! You are an amazing ${creature}! 🙌`;
    core.debug(message);
    core.setOutput('amazing-message', message);
    console.log({payload: github.context.payload});
};

run();

export default run;
