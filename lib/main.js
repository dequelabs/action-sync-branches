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
const github_1 = require("@actions/github");
async function run() {
    const debug = core.getInput('debug');
    const token = core.getInput('github-token', { required: true });
    const head = core.getInput('head');
    const base = core.getInput('base');
    const body = core.getInput('body');
    const title = core.getInput('title');
    const reviewers = core.getInput('reviewers');
    const teamReviewers = core.getInput('team-reviewers');
    const assignees = core.getInput('assignees');
    // Mask github token
    core.setSecret(token);
    const opts = {};
    if (debug === 'true') {
        opts.log = console;
    }
    const octokit = new github_1.GitHub(token, opts);
    // Get PR template
    const communityMetrics = await octokit.repos.retrieveCommunityProfileMetrics(Object.assign({}, github_1.context.repo));
    // Create PR
    const pullRequest = await octokit.pulls.create(Object.assign(Object.assign({}, github_1.context.repo), { title,
        head,
        base, body: 'abc123' }));
    // Assign reviewers
    // octokit.pulls.createReviewRequest({
    //   ...context.repo,
    //   pull_number,
    //   reviewers: prUserReviewers,
    //   team_reviewers: prTeamReviewers
    // })
}
run()
    .catch(function (err) {
    core.setFailed(err.message);
});
