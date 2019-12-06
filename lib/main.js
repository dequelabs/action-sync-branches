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
    const template = core.getInput('pr-template');
    const body = core.getInput('pr-body');
    const title = core.getInput('pr-title');
    const labels = core.getInput('pr-labels');
    const reviewers = core.getInput('pr-reviewers');
    const teamReviewers = core.getInput('pr-team-reviewers');
    const assignees = core.getInput('pr-assignees');
    // Mask github token
    core.setSecret(token);
    const opts = {};
    if (debug === 'true') {
        opts.log = console;
    }
    const octokit = new github_1.GitHub(token, opts);
    // Get PR template
    const response = await octokit.repos.getContents(Object.assign(Object.assign({}, github_1.context.repo), { path: template }));
    const pullRequestTemplate = response.data;
    // Create PR
    const prResponse = await octokit.pulls.create(Object.assign(Object.assign({}, github_1.context.repo), { title,
        head,
        base, body: body || Buffer.from(pullRequestTemplate.content, 'base64').toString() }));
    const { number: pullNumber } = prResponse.data;
    // Add labels
    if (labels) {
        octokit.issues.addLabels(Object.assign(Object.assign({}, github_1.context.repo), { issue_number: pullNumber, labels: labels.split(',') }));
    }
    // Assign reviewers
    if (reviewers || teamReviewers) {
        octokit.pulls.createReviewRequest(Object.assign(Object.assign({}, github_1.context.repo), { pull_number: pullNumber, reviewers: reviewers.split(',') || [], team_reviewers: teamReviewers.split(',') || [] }));
    }
    // Assign assignee
    if (assignees) {
        octokit.issues.addAssignees(Object.assign(Object.assign({}, github_1.context.repo), { issue_number: pullNumber, assignees: assignees.split(',') }));
    }
}
run()
    .catch(function (err) {
    core.setFailed(err.message);
});
