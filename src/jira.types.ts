export interface JestTestResult {
	title: string
	status: 'passed' | 'failed'
}

export interface JestTestResults {
	testResults: JestTestResult[]
}

export interface JestTest {}