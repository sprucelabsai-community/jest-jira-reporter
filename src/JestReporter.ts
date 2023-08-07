import { assertOptions } from '@sprucelabs/schema';
import JiraApi from 'jira-client';
import { JestTest, JestTestResult, JestTestResults } from './jira.types';
import SpruceError from './errors/SpruceError';
import { SpruceErrors } from './.spruce/errors/errors.types';

export default class JestReporter {
	protected client: JiraApi;
	public static JiraApi = JiraApi;
	private testMap: Record<string, string>;
	protected transitionMap?: Promise<Record<string, any>>;
	private statusMap: Record<Status, JiraTransition> = { "passed": "Done", "failed": "In Progress" }

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
	}

	private async fetchTransitionMap() {
		const { transitions } = await this.client.listTransitions(this.getIssueId(this.getFirstTestTitle()))

		const jiraDoneCode = this.getJiraCodeForStatus("passed")
		const jiraInProgressCode = this.getJiraCodeForStatus("failed")

		const doneTransition = transitions.find((t: JiraApi.TransitionObject) => t.name === jiraDoneCode);
		const inProgressTransition = transitions.find((t: JiraApi.TransitionObject) => t.name === jiraInProgressCode);

		if (!inProgressTransition) {
			this.throwTransitionNotFound(jiraInProgressCode);
		} else if (!doneTransition) {
			this.throwTransitionNotFound(jiraDoneCode);
		}

		return {
			[jiraDoneCode]: { "transition": doneTransition },
			[jiraInProgressCode]: { "transition": inProgressTransition }
		};
	}

	private throwTransitionNotFound(transitionCode: JiraTransition) {
		throw new SpruceError({ code: "TRANSITION_NOT_FOUND", transition: transitionCode });
	}

	private getFirstTestTitle() {
		return Object.keys(this.testMap)[0];
	}

	private async getTransitionForStatus(status: Status) {
		const transitionMap = await this.transitionMap
		const jiraCodeForStatus = this.getJiraCodeForStatus(status)
		const transition = transitionMap![jiraCodeForStatus]
		return transition
	}

	private getJiraCodeForStatus(status: Status) {
		return this.statusMap[status];
	}

	public async onTestComplete(_: JestTest, testResult: JestTestResults) {
		if (!this.transitionMap) {
			this.transitionMap = this.fetchTransitionMap()
		}

		const { testResults } = testResult

		for (const test of testResults) {
			const issueId = this.getIssueId(test.title)
			await this.client.transitionIssue(issueId, await this.getTransitionForStatus(test.status))
		}
	}

	private getIssueId(title: string) {
		return this.testMap[title];
	}
}
export interface JestReporterOptions {
	protocol: string;
	host: string;
	apiVersion: string;
	strictSSL: boolean;
	testMap: Record<string, any>;
}

type Status = JestTestResult['status']
type JiraTransition = SpruceErrors.JestJiraReporter.TransitionNotFound['transition'];

