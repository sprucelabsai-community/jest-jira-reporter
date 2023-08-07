import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const transitionNotFoundSchema: SpruceErrors.JestJiraReporter.TransitionNotFoundSchema  = {
	id: 'transitionNotFound',
	namespace: 'JestJiraReporter',
	name: 'Transition not found',
	    fields: {
	            /** Transition. */
	            'transition': {
	                label: 'Transition',
	                type: 'select',
	                isRequired: true,
	                options: {choices: [{"value":"In Progress","label":"In Progress"},{"value":"Done","label":"Done"}],}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(transitionNotFoundSchema)

export default transitionNotFoundSchema
