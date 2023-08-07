/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.JestJiraReporter {

	
	export interface TransitionNotFound {
		
			/** Transition. */
			'transition': ("In Progress" | "Done")
	}

	export interface TransitionNotFoundSchema extends SpruceSchema.Schema {
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

	export type TransitionNotFoundEntity = SchemaEntity<SpruceErrors.JestJiraReporter.TransitionNotFoundSchema>

}




