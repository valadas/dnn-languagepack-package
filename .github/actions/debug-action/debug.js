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
const run = async () => {
    const creature = core.getInput('amazing-creature');
    const message = `👏 Hello! You are an amazing ${creature}! 🙌`;
    core.debug(message);
    core.setOutput('amazing-message', message);
    // console.log({payload: github.context.payload});
    const octokit = new rest_1.Octokit({
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
exports.default = run;
