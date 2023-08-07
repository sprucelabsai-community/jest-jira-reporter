import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions>{

    /** an easy to understand version of the errors */
    public friendlyMessage():string {

        const { options } = this
        let message
        switch (options?.code) {
            case 'TRANSITION_NOT_FOUND':
                message = 'A Transition not found just happened!'
                break
            default:
                message = super.friendlyMessage()
        }

		const fullMessage = options.friendlyMessage
			? options.friendlyMessage
			: message

		return fullMessage
    }
}
