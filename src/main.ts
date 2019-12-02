import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'

async function run() {

  const debug = core.getInput('debug')
  const token = core.getInput('github-token', { required: true })
  const head = core.getInput('head')
  const base = core.getInput('base')
  const body = core.getInput('body')
  const title = core.getInput('title')
  const reviewers = core.getInput('reviewers')
  const teamReviewers = core.getInput('team-reviewers')
  const assignees = core.getInput('assignees')

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
  //   reviewers: reviewers,
  //   team_reviewers: teamReviewers
  // })
}

run()
  .catch(function(err) {
    core.setFailed(err.message)
  })
