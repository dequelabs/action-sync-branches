import test from 'ava'
import nock from 'nock'
import run from '../src/main'

// Prevent real api requests from going out
nock.disableNetConnect()
const endpoint = nock('https://api.github.com')

const defaultPrParams = {
  title: 'chore: merge master into develop',
  head: 'master',
  base: 'develop',
  body: 'hello world'
}

test.beforeEach(() => {
  process.env['INPUT_GITHUB-TOKEN'] = 'donuts'
  process.env['GITHUB_REPOSITORY'] = 'foo/bar'
  process.env['INPUT_HEAD'] = 'master'
  process.env['INPUT_BASE'] = 'develop'
  process.env['INPUT_PR-TITLE'] =
    'chore: merge master into develop'
})

test.afterEach.always(() => {
  for (var key of Object.keys(process.env)) {
    if (key.startsWith('INPUT_')) {
      delete process.env[key]
    }
  }

  delete process.env['GITHUB_REPOSITORY']
})

// Base64 encoded "Hello World"
const PR_TEMPLATE = 'aGVsbG8gd29ybGQ='
const ISSUE_NUMBER = 123

function createMockPrRequest() {
  endpoint
    .get(/\/repos\/foo\/bar\/contents.*/)
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

test('should throw an error if title is not present', async t => {
  process.env['INPUT_PR-TITLE'] = ''
  await t.throwsAsync(async () => run())
})

test('should make a request for the pr template', async t => {
  const template = '.github/pull_request_template.md'
  process.env['INPUT_PR-TEMPLATE'] = template

  const request = endpoint
    .get(
      '/repos/foo/bar/contents/.github%2Fpull_request_template.md'
    )
    .reply(200, { content: PR_TEMPLATE })
  endpoint.post('/repos/foo/bar/pulls').reply(200)

  await run()

  t.true(request.isDone())
})

test('should skip "not found" pr templates', async t => {
  const template = '.github/pull_request_template.md'
  process.env['INPUT_PR-TEMPLATE'] = template

  endpoint
    .get(
      '/repos/foo/bar/contents/.github%2Fpull_request_template.md'
    )
    .reply(404, {
      message: 'Not Found',
      documentation_url:
        'https://developer.github.com/v3/repos/contents/#get-contents'
    })
  const request = endpoint
    .post('/repos/foo/bar/pulls')
    .reply(200, {
      number: ISSUE_NUMBER
    })

  await t.notThrowsAsync(async () => run())
  t.true(request.isDone())
})

test('should throw error when fetching pr template contents returns an unknown error', async t => {
  const template = '.github/pull_request_template.md'
  process.env['INPUT_PR-TEMPLATE'] = template

  const request = endpoint
    .get(
      '/repos/foo/bar/contents/.github%2Fpull_request_template.md'
    )
    .reply(500, { message: 'Unknown Error' })

  await t.throwsAsync(async () => run())
})

test('should create the pr', async t => {
  const request = createMockPrRequest()
  await run()

  t.true(request.isDone())
})

test('should create pr with title', async t => {
  process.env['INPUT_PR-TITLE'] = 'this is the pr title'

  endpoint
    .get(/\/repos\/foo\/bar\/contents.*/)
    .reply(200, { content: PR_TEMPLATE })

  const request = endpoint
    .post('/repos/foo/bar/pulls', {
      ...defaultPrParams,
      title: 'this is the pr title'
    })
    .reply(200, {
      number: ISSUE_NUMBER
    })

  await run()

  t.true(request.isDone())
})

test('should create pr with body', async t => {
  process.env['INPUT_PR-BODY'] =
    'up up down down left right b a start'

  endpoint
    .get(/\/repos\/foo\/bar\/contents.*/)
    .reply(200, { content: PR_TEMPLATE })

  const request = endpoint
    .post('/repos/foo/bar/pulls', {
      ...defaultPrParams,
      body: 'up up down down left right b a start'
    })
    .reply(200, {
      number: ISSUE_NUMBER
    })

  await run()

  t.true(request.isDone())
})

test('should add a single label', async t => {
  process.env['INPUT_PR-LABELS'] = 'chore'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/issues/123/labels', {
      labels: ['chore']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add multiple labels', async t => {
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

test('should add a reviewer', async t => {
  process.env['INPUT_PR-REVIEWERS'] = 'scurker'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/pulls/123/requested_reviewers', {
      reviewers: ['scurker'],
      team_reviewers: []
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add multiple reviewers', async t => {
  process.env['INPUT_PR-REVIEWERS'] = 'scurker,straker'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/pulls/123/requested_reviewers', {
      reviewers: ['scurker', 'straker'],
      team_reviewers: []
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add a team reviewer', async t => {
  process.env['INPUT_PR-TEAM-REVIEWERS'] = 'htmlteam'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/pulls/123/requested_reviewers', {
      reviewers: [],
      team_reviewers: ['htmlteam']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add multiple team reviewers', async t => {
  process.env['INPUT_PR-TEAM-REVIEWERS'] =
    'htmlteam,adminteam'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/pulls/123/requested_reviewers', {
      reviewers: [],
      team_reviewers: ['htmlteam', 'adminteam']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add an assignee', async t => {
  process.env['INPUT_PR-ASSIGNEES'] = 'scurker'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/issues/123/assignees', {
      assignees: ['scurker']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})

test('should add multiple assignees', async t => {
  process.env['INPUT_PR-ASSIGNEES'] = 'scurker,straker'

  createMockPrRequest()

  const request = endpoint
    .post('/repos/foo/bar/issues/123/assignees', {
      assignees: ['scurker', 'straker']
    })
    .reply(200)

  await run()

  t.true(request.isDone())
})
