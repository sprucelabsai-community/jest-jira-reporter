import { ErrorOptions as ISpruceErrorOptions } from '@sprucelabs/error'
import { SpruceErrors } from '#spruce/errors/errors.types'

export interface TransitionNotFoundErrorOptions
    extends SpruceErrors.JestJiraReporter.TransitionNotFound,
        ISpruceErrorOptions {
    code: 'TRANSITION_NOT_FOUND'
}

type ErrorOptions = TransitionNotFoundErrorOptions

export default ErrorOptions
