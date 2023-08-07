import { assertOptions } from '@sprucelabs/schema';
import JiraApi from 'jira-client';
import { JestTest, JestTestResults } from './jira.types';


export default class JestReporter {
	protected client: JiraApi;
	public static JiraApi = JiraApi;
	private testMap: Record<string, string>;
	protected statusMap: Record<string, any>;

	public constructor(options: JestReporterOptions) {
		const username = process.env.JIRA_USERNAME;
		const password = process.env.JIRA_PASSWORD;
		const { protocol, host, apiVersion, strictSSL, testMap } = assertOptions({ ...options, env: process.env }, ['host', 'apiVersion', 'testMap', "env.JIRA_USERNAME", "env.JIRA_PASSWORD"]);
		this.client = new JestReporter.JiraApi({
			protocol,
			host,
			apiVersion,
			strictSSL,
			username,
			password,
		});
		this.testMap = testMap
		this.statusMap = {}
	}

	private async fetchStatusMap() {
		const response = await this.client.listTransitions(this.testMap[Object.keys(this.testMap)[0]]);
		const transitions:JiraApi.TransitionObject[] = response.transitions;
		  
		const doneTransition = transitions.find((t: JiraApi.TransitionObject) => t.name === "Done");
		const inProgressTransition = transitions.find((t: JiraApi.TransitionObject) => t.name === "In Progress");
	  
		if (!doneTransition || !inProgressTransition) {
		  throw new Error('Failed to populate statusMap: required transitions not found');
		}
	  
		this.statusMap = {
		  "Done": {"transition": doneTransition},
		  "In Progress": {"transition": inProgressTransition}
		};
	}

	public async onTestComplete(_:JestTest, testResult: JestTestResults) {
		if (!this.statusMap|| Object.keys(this.statusMap).length === 0) {
			await this.fetchStatusMap()
		}
		const {testResults} = testResult
		for (const test of testResults) {	
			if (test.status==="passed") {
				await this.client.transitionIssue(this.testMap[test.title], this.statusMap["Done"])
			} else if (test.status === "failed") {
				await this.client.transitionIssue(this.testMap[test.title], this.statusMap["In Progress"]) 
			}
		}
	}
}
export interface JestReporterOptions {
	protocol: string;
	host: string;
	apiVersion: string;
	strictSSL: boolean;
	testMap: Record<string, any>;
}


