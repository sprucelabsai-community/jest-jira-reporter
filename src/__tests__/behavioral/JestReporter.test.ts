import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
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
			parameters: ['host', 'apiVersion', 'testMap'],
		})
	}

	@test()
	protected static async throwsWhenMissingJiraCredsInEnv() {
		delete process.env.JIRA_USERNAME
		delete process.env.JIRA_PASSWORD

		const err = assert.doesThrow(() => this.Reporter())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.JIRA_USERNAME', 'env.JIRA_PASSWORD'],
		})
	}

	@test('passes with proper options 1', 'https', 'localhost:8080', '1', true)
	@test('passes with proper options 2', 'https', 'localhost:8081', '2', true)
	protected static async properlyConfiguresJiraClient(
		protocol: string,
		host: string,
		apiVersion: string,
		strictSSL: boolean
	) {
		this.reporter = this.Reporter({ protocol, host, apiVersion, strictSSL })
		assert.isInstanceOf(this.jiraClient, JiraApi)
		assert.isEqualDeep(this.jiraClient.constructorOptions, {
			protocol,
			host,
			apiVersion,
			strictSSL,
			username: process.env.JIRA_USERNAME,
			password: process.env.JIRA_PASSWORD,
		})
	}

	@test()
	protected static async nonMappedTestPassingDoesNothing() {
		await this.simulateTestComplete([])
	}

	@test()
	protected static async mappedTestPassedMarkedAsComplete() {
		await this.simulateTestComplete([
			{
				title: 'test1',
				status: 'passed',
			},
		])

		this.assertFirstUpdateOptionsEqual({
			issueId: 'LSD-1',
			issueTransition: {
				transition: {
					id: '31',
					name: 'Done',
				},
			},
		})
	}

	@test()
	protected static async mappedTestFailedMarkedAsInProgress() {
		await this.simulateTestComplete([
			{
				title: 'test1',
				status: 'failed',
			},
		])

		this.assertFirstUpdateOptionsEqual({
			issueId: 'LSD-1',
			issueTransition: {
				transition: {
					id: '21',
					name: 'In Progress',
				},
			},
		})
	}

	@test()
	protected static async passingTestMatchesIssueId() {
		await this.simulateTestComplete([
			{
				title: 'test2',
				status: 'passed',
			},
		])

		this.assertFirstUpdateOptionsEqual({
			issueId: 'TACO-3',
			issueTransition: {
				transition: {
					id: '31',
					name: 'Done',
				},
			},
		})
	}

	@test()
	protected static async failingTestMatchesIssueId() {
		await this.simulateTestComplete([
			{
				title: 'test2',
				status: 'failed',
			},
		])

		this.assertFirstUpdateOptionsEqual({
			issueId: 'TACO-3',
			issueTransition: {
				transition: {
					id: '21',
					name: 'In Progress',
				},
			},
		})
	}

	@test()
	protected static async canUpdateManyTestsAtOnce() {
		await this.simulateTestComplete([
			{
				title: 'test1',
				status: 'passed',
			},
			{
				title: 'test2',
				status: 'failed',
			},
		])

		this.assertUpdateOptionsEqual([
			{
				issueId: 'LSD-1',
				issueTransition: {
					transition: {
						id: '31',
						name: 'Done',
					},
				},
			},
			{
				issueId: 'TACO-3',
				issueTransition: {
					transition: {
						id: '21',
						name: 'In Progress',
					},
				},
			},
		])
	}

	@test()
	protected static async passesExpectedIssueIdToLookupTransitions() {
		await this.simulateTest1Passed()

		this.assertListTransitionsIssueId('LSD-1')

		this.reporter = this.Reporter({
			testMap: {
				test1: 'TACO-3',
			},
		})

		await this.simulateTest1Passed()

		this.assertListTransitionsIssueId('TACO-3')
	}

	@test()
	protected static async onlyCallsListTransitionsOnceEvenWhenManyTestsCompleteAsync() {
		await Promise.all([
			this.simulateTest1Passed(),
			this.simulateTest1Passed(),
			this.simulateTest1Passed(),
		])

		assert.isEqual(this.jiraClient.listTransitionsHitCount, 1)
	}

	@test()
	protected static async throwsWhenCantFindInProgressTransition() {
		this.jiraClient.listTransitionsResults = {
			transitions: [
				{
					id: '55',
					name: 'Done',
				},
			],
		}

		const err = await assert.doesThrowAsync(() => this.simulateTest1Failed())

		errorAssert.assertError(err, 'TRANSITION_NOT_FOUND', {
			transition: 'In Progress',
		})
	}

	@test()
	protected static async throwsWhenCantFindDoneTransition() {
		this.jiraClient.listTransitionsResults = {
			transitions: [
				{
					id: '23',
					name: 'In Progress',
				},
			],
		}

		const err = await assert.doesThrowAsync(() => this.simulateTest1Passed())

		errorAssert.assertError(err, 'TRANSITION_NOT_FOUND', {
			transition: 'Done',
		})
	}

	private static async simulateTest1Passed() {
		await this.simulateTestComplete([
			{
				title: 'test1',
				status: 'passed',
			},
		])
	}

	private static async simulateTest1Failed() {
		await this.simulateTestComplete([
			{
				title: 'test1',
				status: 'failed',
			},
		])
	}

	private static assertListTransitionsIssueId(expected: string) {
		assert.isEqual(this.jiraClient.lastListTransitionsIssueId, expected)
	}

	private static assertFirstUpdateOptionsEqual(expected: {
		issueId: string
		issueTransition: JiraApi.TransitionObject
	}) {
		this.assertUpdateOptionsEqual([expected])
	}

	private static assertUpdateOptionsEqual(
		expected: { issueId: string; issueTransition: JiraApi.TransitionObject }[]
	) {
		assert.isEqualDeep(this.jiraClient.updateIssueOptions, expected)
	}

	private static async simulateTestComplete(results: JestTestResult[]) {
		await this.reporter.onTestComplete(
			{},
			{
				testResults: results,
			}
		)
	}

	private static get jiraClient() {
		return this.reporter.client as StubJiraApi
	}

	private static Reporter(
		options?: Partial<JestReporterOptions>
	): SpyJestReporter {
		return new SpyJestReporter({
			protocol: 'https',
			host: 'localhost:8080',
			apiVersion: '2',
			strictSSL: true,
			testMap: {
				test1: 'LSD-1',
				test2: 'TACO-3',
			},
			...options,
		})
	}
}

class SpyJestReporter extends JestReporter {
	public client!: JiraApi
	public transitionMap!: Promise<Record<string, any>>
}

class StubJiraApi extends JiraApi {
	public lastListTransitionsIssueId?: string
	public constructorOptions: JiraApi.JiraApiOptions
	public updateIssueOptions: {
		issueId: string
		issueTransition: JiraApi.TransitionObject
	}[] = []
	public listTransitionsHitCount = 0
	public listTransitionsResults = {
		transitions: [
			{
				id: '21',
				name: 'In Progress',
			},
			{
				id: '31',
				name: 'Done',
			},
		],
	}

	public constructor(options: JiraApi.JiraApiOptions) {
		super(options)
		this.constructorOptions = options
	}

	public async listTransitions(issueId: string): Promise<JiraApi.JsonResponse> {
		this.lastListTransitionsIssueId = issueId
		this.listTransitionsHitCount++
		return this.listTransitionsResults
	}

	public async transitionIssue(
		issueId: string,
		issueTransition: JiraApi.TransitionObject
	): Promise<JiraApi.JsonResponse> {
		this.updateIssueOptions.push({ issueId, issueTransition })
		return {}
	}
}
