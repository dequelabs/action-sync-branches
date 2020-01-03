import test from 'ava'
import { spy, stub } from 'sinon'
import nock from 'nock'
import run from '../src/main'

// Cache the original process.env
const env = process.env

// Prevent real api requests from going out
nock.disableNetConnect()
const endpoint = nock('https://api.github.com')

test.beforeEach(() => {
  process.env['INPUT_GITHUB-TOKEN'] = 'donuts'
  process.env['GITHUB_REPOSITORY'] = 'foo/bar'
  process.env['INPUT_HEAD'] = 'master'
  process.env['INPUT_BASE'] = 'develop'
})

test.afterEach.always(() => {
  process.env = env
})

// Base64 encoded "Hello World"
const PR_TEMPLATE = 'aGVsbG8='
const ISSUE_NUMBER = 123

function createMockPrRequest() {
  endpoint
    .get(/\/repos\/foo\/bar\/contents\/.*/)
    .optionally()
    .reply(200, { content: PR_TEMPLATE })

  return endpoint.post('/repos/foo/bar/pulls').reply(200, {
    number: ISSUE_NUMBER
  })
}

test('should throw an error if github-token is not present', async t => {
  process.env['INPUT_GITHUB-TOKEN'] = ''
  await t.throwsAsync(async () => run())
})

test('should throw an error if head branch is not present', async t => {
  process.env['INPUT_HEAD'] = ''
  await t.throwsAsync(async () => run())
})

test('should throw an error if base branch is not present', async t => {
  process.env['INPUT_BASE'] = ''
  await t.throwsAsync(async () => run())
})

test('should make a request for the pr template', async t => {
  const template = '.github/pull_request_template.md'
  process.env['INPUT_PR-TEMPLATE'] = template

  const request = endpoint
    .get(
      '/repos/foo/bar/contents/.github/pull_request_template.md'
    )
    .reply(200, { content: PR_TEMPLATE })
  endpoint.post('/repos/foo/bar/pulls').reply(200)

  await run()

  t.true(request.isDone())
})

test('should create the pr', async t => {
  const request = createMockPrRequest()
  await run()

  t.true(request.isDone())
})

test.skip('should create pr with title', async t => {})

test.skip('should create pr with body', async t => {})

test.skip('should add a single label', async t => {
  process.env['INPUT_PR-LABELS'] = 'chore'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/issues/123/labels', {
      labels: ['chore']
    })
    .reply(200)

  await run()
  // console.log(request)
  t.true(request.isDone())
})

test.skip('should add multiple labels', async t => {
  process.env['INPUT_PR-LABELS'] = 'chore1,chore2'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/issues/123/labels', {
      labels: ['chore1', 'chore2']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test.skip('should add a reviewer', t => {})

test.skip('should add multiple reviewers', t => {})

test.skip('should add a team reviewer', t => {})

test.skip('should add multiple team reviewers', t => {})

test.skip('should add an assignee', t => {})

test.skip('should add multiple assignees', t => {})
