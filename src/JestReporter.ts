import { assertOptions } from '@sprucelabs/schema';
import JiraApi from 'jira-client';
import { JestTest, JestTestResult, JestTestResults } from './jira.types';
import SpruceError from './errors/SpruceError';
import { SpruceErrors } from './.spruce/errors/errors.types';

export default class JestReporter {
	protected client: JiraApi;
	public static JiraApi = JiraApi;
	private testMap: Record<string, string>;
	private statusMap: Record<Status, JiraTransition> = { "passed": "Done", "failed": "In Progress" }
	private transitions!: JiraApi.TransitionObject[];
	private transitionLoadPromise?: Promise<void>;

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

	private getTransitionForStatus(status: Status) {
		const code = this.getJiraCodeForStatus(status);
		const transition = this.transitions.find((t: JiraApi.TransitionObject) => t.name === code);
		if (!transition) {
			this.throwTransitionNotFound(code);
		}
		return transition
	}

	private async loadTransitions() {
		const { transitions } = await this.client.listTransitions(this.getIssueId(this.getFirstTestTitle()));
		this.transitions = transitions;
	}

	private throwTransitionNotFound(transitionCode: JiraTransition) {
		throw new SpruceError({ code: "TRANSITION_NOT_FOUND", transition: transitionCode });
	}

	private getFirstTestTitle() {
		return Object.keys(this.testMap)[0];
	}

	private getJiraCodeForStatus(status: Status) {
		return this.statusMap[status];
	}

	public async onTestComplete(_: JestTest, testResult: JestTestResults) {
		await this.optionallyLoadTransitions();

		const { testResults } = testResult

		for (const test of testResults) {
			const issueId = this.getIssueId(test.title)
			await this.client.transitionIssue(issueId, {
				transition: this.getTransitionForStatus(test.status)
			})
		}
	}

	private async optionallyLoadTransitions() {
		if (!this.transitionLoadPromise) {
			this.transitionLoadPromise = this.loadTransitions();
		}

		await this.transitionLoadPromise;
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

