import * as core from '@actions/core'
import { getOctokit, context } from '@actions/github'

type OctokitOptions = NonNullable<
  Parameters<typeof getOctokit>[1]
>
type OctokitHttpError = {
  // Yes, we've seen it give back either type, see #45
  status: number | string
  message: string
}

const required = { required: true }

async function run(): Promise<void> {
  const debug = core.getInput('debug')
  const token = core.getInput('github-token', required)
  const head = core.getInput('head', required)
  const base = core.getInput('base', required)
  const template = core.getInput('pr-template')
  const body = core.getInput('pr-body')
  const title = core.getInput('pr-title', required)
  const labels = core.getInput('pr-labels')
  const reviewers = core.getInput('pr-reviewers')
  const teamReviewers = core.getInput('pr-team-reviewers')
  const assignees = core.getInput('pr-assignees')

  // Mask github token
  core.setSecret(token)

  const opts: OctokitOptions = {}
  if (debug === 'true') {
    opts.log = console
  }
  if (process.env.NODE_ENV === 'test') {
    // See https://github.com/nock/nock/issues/2183
    opts.request = { fetch: require('node-fetch') }
  }
  const octokit = getOctokit(token, opts)

  // Get PR template
  let pullRequestTemplate = null
  try {
    const response = await octokit.rest.repos.getContent({
      ...context.repo,
      path: template
    })
    pullRequestTemplate = response.data
  } catch (err) {
    const { status, message } = err as OctokitHttpError
    if (
      String(status) === '404' &&
      /Not Found/.test(String(message))
    ) {
      console.log(
        `Unable to find pr-template "${template}"`
      )
    } else {
      throw err
    }
  }

  // Create PR
  const prResponse = await octokit.rest.pulls.create({
    ...context.repo,
    title,
    head,
    base,
    body:
      body ||
      Buffer.from(
        pullRequestTemplate
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (pullRequestTemplate as any).content
          : '',
        'base64'
      ).toString()
  })
  const { number: pullNumber } = prResponse.data

  // Add labels
  if (labels) {
    await octokit.rest.issues.addLabels({
      ...context.repo,
      issue_number: pullNumber,
      labels: labels.split(',')
    })
  }

  // Assign reviewers
  if (reviewers || teamReviewers) {
    await octokit.rest.pulls.requestReviewers({
      ...context.repo,
      pull_number: pullNumber,
      reviewers: (reviewers && reviewers.split(',')) || [],
      team_reviewers:
        (teamReviewers && teamReviewers.split(',')) || []
    })
  }

  // Assign assignee
  if (assignees) {
    await octokit.rest.issues.addAssignees({
      ...context.repo,
      issue_number: pullNumber,
      assignees: assignees.split(',')
    })
  }
}

// Prevent action from auto-running in test environment
if (process.env.NODE_ENV !== 'test') {
  run().catch(err => {
    core.setFailed(err.message)
  })
}

export default run
