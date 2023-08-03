import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'

export default class JestReporterTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateJestReporter() {
		const jestReporter = new JestReporter()
		assert.isTruthy(jestReporter)
	}

	@test()
	protected static async yourNextTest() {
		assert.isTrue(false)
	}
}

class JestReporter {}
