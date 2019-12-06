import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'

async function run() {

  const debug = core.getInput('debug')
  const token = core.getInput('github-token', { required: true })
  const head = core.getInput('head')
  const base = core.getInput('base')
  const body = core.getInput('pr-body')
  const title = core.getInput('pr-title')
  const reviewers = core.getInput('pr-reviewers')
  const teamReviewers = core.getInput('pr-team-reviewers')
  const assignees = core.getInput('pr-assignees')

  // Mask github token
  core.setSecret(token)

  const opts = {}
  if (debug === 'true') {
    (opts as any).log = console
  }
  const octokit = new GitHub(token, opts)

  // Get PR template
  const communityMetrics = await octokit.repos.retrieveCommunityProfileMetrics({
    ...context.repo
  })

  console.log({ communityMetrics })

  // Create PR
  const pullRequest = await octokit.pulls.create({
    ...context.repo,
    title,
    head,
    base,
    body: 'abc123'
  })

  // Assign reviewers
  // octokit.pulls.createReviewRequest({
  //   ...context.repo,
  //   pull_number,
  //   reviewers: reviewers.split(','),
  //   team_reviewers: teamReviewers.split(',')
  // })

  // Assign assignee
  // octokit.issues.addAssignee({
  //   ...context.repo,
  //   issue_number,
  //   assignees: assignees.split(',')
  // })
}

run()
  .catch(function(err) {
    core.setFailed(err.message)
  })
