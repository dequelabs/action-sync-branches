import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'

async function run() {

  const debug = core.getInput('debug')
  const token = core.getInput('github-token', { required: true })
  const head = core.getInput('head')
  const base = core.getInput('base')
  const template = core.getInput('pr-template')
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
  const response = await octokit.repos.getContents({
    ...context.repo,
    path: template
  })
  const pullRequestTemplate = response.data

  // Create PR
  const prResponse = await octokit.pulls.create({
    ...context.repo,
    title,
    head,
    base,
    body: body || Buffer.from((pullRequestTemplate as any).content, 'base64').toString()
  })
  const { number: pullNumber } = prResponse.data

  // Assign reviewers
  if (reviewers || teamReviewers) {
    octokit.pulls.createReviewRequest({
      ...context.repo,
      pull_number: pullNumber,
      reviewers: reviewers.split(',') || [],
      team_reviewers: teamReviewers.split(',') || []
    })
  }

  // Assign assignee
  if (assignees) {
    octokit.issues.addAssignees({
      ...context.repo,
      issue_number: pullNumber,
      assignees: assignees.split(',') || []
    })
  }
}

run()
  .catch(function(err) {
    core.setFailed(err.message)
  })
