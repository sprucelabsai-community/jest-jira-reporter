import AbstractSpruceTest, { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import JiraApi from 'jira-client'
import JestReporter, { JestReporterOptions } from '../../JestReporter'
import { JestTestResult } from '../../jira.types'

export default class JestReporterTest extends AbstractSpruceTest {
	private static reporter: SpyJestReporter

	protected static async beforeEach() {
		await super.beforeEach()

		process.env.JIRA_USERNAME = generateId()
		process.env.JIRA_PASSWORD = generateId()

		JestReporter.JiraApi = StubJiraApi

		this.reporter = this.Reporter()
	}


	@test()
	protected static async throwsWithMissingOptionsFromPackageJson() {
		//@ts-ignore
		const err = assert.doesThrow(() => new JestReporter())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['host', 'apiVersion', 'testMap']
		})
	}

	@test()
	protected static async throwsWhenMissingJiraCredsInEnv() {
		delete process.env.JIRA_USERNAME
		delete process.env.JIRA_PASSWORD

		const err = assert.doesThrow(() => this.Reporter())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.JIRA_USERNAME', 'env.JIRA_PASSWORD']
		})
	}


	@test('passes with proper options 1', 'http://localhost:8080', '1')
	@test('passes with proper options 2', 'http://localhost:8081', '2')
	protected static async properlyConfiguresJiraClient(host: string, apiVersion: string) {
		this.reporter = this.Reporter({ host, apiVersion })
		assert.isInstanceOf(this.jiraClient, JiraApi)
		assert.isEqualDeep(this.jiraClient.constructorOptions, {
			host,
			apiVersion,
			username: process.env.JIRA_USERNAME,
			password: process.env.JIRA_PASSWORD
		})
	}

	@test()
	protected static async nonMappedTestPassingDoesNothing() {
		await this.simulateTestComplete([])
	}


	@test()
	protected static async mappedTestPassedMarkedAsComplete() {

		await this.simulateTestComplete([{
			'title': 'test1',
			'status': 'passed'
		}])

		this.assertUpdateOptionsEqual({
			issueId: 'LSD-1',
			issueUpdate: {
				status: 'complete'
			}
		})
	}


	@test()
	protected static async mappedTestFailedMarkedAsInProgress() {

		await this.simulateTestComplete([{
			'title': 'test1',
			'status': 'failed'
		}])

		this.assertUpdateOptionsEqual({
			issueId: 'LSD-1',
			issueUpdate: {
				status: 'in progress'
			}
		})
	}

	@test()
	protected static async passingTestMatchesIssueId() {
		await this.simulateTestComplete([{
			title: 'test2',
			status: 'passed'
		}])

		this.assertUpdateOptionsEqual({
			issueId: 'TACO-3',
			issueUpdate: {
				status: 'complete'
			}
		})
	}

	@test()
	protected static async failingTestMatchesIssueId() {
	}

	@test()
	protected static async canUpdateManyTestsAtOnce() {}

	private static assertUpdateOptionsEqual(expected: { issueId: string; issueUpdate: { status: string } }) {
		assert.isEqualDeep(this.jiraClient.updateIssueOptions, expected)
	}


	private static async simulateTestComplete(results: JestTestResult[]) {
		await this.reporter.onTestComplete({}, {
			testResults: results
		})
	}


	private static get jiraClient() {
		return this.reporter.client as StubJiraApi
	}

	private static Reporter(options?: Partial<JestReporterOptions>): SpyJestReporter {
		return new SpyJestReporter({
			host: 'http://localhost:8080',
			apiVersion: '1',
			testMap: {
				test1: 'LSD-1',
				test2: 'TACO-3'
			},
			...options
		})
	}


}

class SpyJestReporter extends JestReporter {
	public client!: JiraApi
}

class StubJiraApi extends JiraApi {
	public constructorOptions: JiraApi.JiraApiOptions
	public updateIssueOptions?: { issueId: string, issueUpdate: JiraApi.IssueObject }
	public constructor(options: JiraApi.JiraApiOptions) {
		super(options)
		this.constructorOptions = options
	}

	public async updateIssue(issueId: string, issueUpdate: JiraApi.IssueObject, query?: JiraApi.Query | undefined): Promise<JiraApi.JsonResponse> {
		this.updateIssueOptions = { issueId, issueUpdate }
	}
}

