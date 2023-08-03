import { assertOptions } from '@sprucelabs/schema';
import JiraApi from 'jira-client';
import { JestTest, JestTestResults } from './jira.types';

export default class JestReporter {
	protected client: JiraApi;
	public static JiraApi = JiraApi;
	private testMap: Record<string, string>;

	public constructor(options: JestReporterOptions) {
		const username = process.env.JIRA_USERNAME;
		const password = process.env.JIRA_PASSWORD;
		const { host, apiVersion, testMap } = assertOptions({ ...options, env: process.env }, ['host', 'apiVersion', 'testMap', "env.JIRA_USERNAME", "env.JIRA_PASSWORD"]);
		this.client = new JestReporter.JiraApi({
			host,
			apiVersion,
			username,
			password
		});
		this.testMap = testMap
	}

	public async onTestComplete(_:JestTest, testResult: JestTestResults) {
		const {testResults} = testResult
		const test = testResults[0]
		if (!test) {
			return 
		}
		if (test.status==="passed") {
			await this.client.updateIssue(this.testMap[test.title], {status:"complete"})
		} else if (test.status === "failed") {
			await this.client.updateIssue("LSD-1", {status:"in progress"})
		}
	}
}
export interface JestReporterOptions {
	host: string;
	apiVersion: string;
	testMap: Record<string, any>;
}


