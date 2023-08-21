require('dotenv').config()
import JestReporter from './JestReporter'

const reporter = new JestReporter({
	protocol: 'https',
	host: 'lumenalabs.atlassian.net/',
	apiVersion: '2',
	strictSSL: true,
	testMap: { test1: 'LTEST-1', test2: 'LTEST-2' },
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
reporter.onTestComplete(
	{},
	{
		testResults: [
			{ title: 'test1', status: 'failed' },
			{ title: 'test2', status: 'passed' },
		],
	}
)
