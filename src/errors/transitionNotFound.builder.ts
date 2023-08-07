import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'transitionNotFound',
	name: 'Transition not found',
	fields: {
		transition: {
			type: 'select',
			label: 'Transition',
			isRequired: true,
			options: {
				choices: [
					{
						value: 'In Progress',
						label: 'In Progress',
					},
					{
						value: 'Done',
						label: 'Done',
					},
				],
			},
		},
	},
})
