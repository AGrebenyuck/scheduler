'use client'

import { createEvent } from '@/actions/events'
import { eventSchema } from '@/app/lib/validators'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select'
import useFetch from '@/hooks/use-fetch'

const EventForm = ({ onSubmitForm }) => {
	const router = useRouter()
	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			duration: 30,
			isPrivate: true,
		},
	})

	const { loading, error, fn: fnCreateEvent } = useFetch(createEvent)

	const onSubmit = async data => {
		await fnCreateEvent(data)
		if (!loading && !error) onSubmitForm()
	}

	return (
		<form
			className='px-5 flex flex-col gap-4'
			onSubmit={handleSubmit(onSubmit)}
		>
			<div>
				<label
					htmlFor='title'
					className='block text-sm font-medium text-gray-700'
				>
					Event Title
				</label>
				<Input id='title' {...register('title')} className='mt-1' />
				{errors.title && (
					<p className='text-red-500 text-sm mt-1'>{errors.title.message}</p>
				)}
			</div>
			<div>
				<label
					htmlFor='description'
					className='block text-sm font-medium text-gray-700'
				>
					Event Description
				</label>
				<Input id='description' {...register('description')} className='mt-1' />
				{errors.description && (
					<p className='text-red-500 text-sm mt-1'>
						{errors.description.message}
					</p>
				)}
			</div>
			<div>
				<label
					htmlFor='duration'
					className='block text-sm font-medium text-gray-700'
				>
					Duration (minutes)
				</label>
				<Input
					id='duration'
					{...register('duration', { valueAsNumber: true })}
					type='number'
					className='mt-1'
				/>
				{errors.duration && (
					<p className='text-red-500 text-sm mt-1'>{errors.duration.message}</p>
				)}
			</div>
			<div>
				<label
					htmlFor='isPrivate'
					className='block text-sm font-medium text-gray-700'
				>
					Event Privacy
				</label>

				<Controller
					name='isPrivate'
					control={control}
					render={({ field }) => (
						<Select
							value={field.value ? 'true' : 'false'}
							onValueChange={value => field.onChange(value === 'true')}
						>
							<SelectTrigger className='mt-1'>
								<SelectValue placeholder='Select Privacy' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='true'>Private</SelectItem>
								<SelectItem value='false'>Public</SelectItem>
							</SelectContent>
						</Select>
					)}
				/>

				{errors.isPrivate && (
					<p className='text-red-500 text-sm mt-1'>
						{errors.isPrivate.message}
					</p>
				)}
			</div>
			<Button type='submit' disabled={loading}>
				{loading ? 'Submitting...' : 'Create Event'}
			</Button>
		</form>
	)
}

export default EventForm
