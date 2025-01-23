'use client'

import { getLatestUpdates } from '@/actions/dashboard'
import { updateUsername } from '@/actions/users'
import { usernameSchema } from '@/app/lib/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import useFetch from '@/hooks/use-fetch'
import { useUser } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BarLoader } from 'react-spinners'

const Dashboard = () => {
	const { isLoaded, user } = useUser()
	const [origin, setOrigin] = useState('')

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setOrigin(window.location.origin)
		}
	}, [])

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(usernameSchema),
	})

	useEffect(() => {
		setValue('username', user?.username)
	}, [isLoaded])

	const { loading, error, fn: fnUpdateUsername } = useFetch(updateUsername)

	const onSubmit = async data => {
		fnUpdateUsername(data.username)
	}

	const {
		loading: loadingUpdates,
		data: upcomingMeetings,
		fn: fnUpdates,
	} = useFetch(getLatestUpdates)

	useEffect(() => {
		const fetchData = async () => {
			await fnUpdates()
		}

		fetchData()
	}, [])

	return (
		<div className='space-y-8'>
			<Card>
				<CardHeader>
					<CardTitle>Welcome, {user?.firstName}</CardTitle>
				</CardHeader>
				<CardContent>
					{!loadingUpdates ? (
						<div>
							{upcomingMeetings && upcomingMeetings.length > 0 ? (
								<ul>
									{upcomingMeetings.map(meeting => {
										return (
											<li key={meeting.id}>
												{meeting.event.title} on{' '}
												{format(
													new Date(meeting.startTime),
													'MMM d, yyyy hh:mm a'
												)}{' '}
												with {meeting.name}
											</li>
										)
									})}
								</ul>
							) : (
								<p>No upcoming meetings</p>
							)}
						</div>
					) : (
						<p>Loading updates...</p>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Your Unique Link</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
						<div>
							<div className='flex items-center gap-2'>
								<span>{origin}/</span>
								<Input {...register('username')} placeholder='username' />
							</div>

							{errors.username && (
								<p className='text-red-500 text-sm mt-1'>
									{errors.username.message}
								</p>
							)}
							{error && (
								<p className='text-red-500 text-sm mt-1'>{error?.message}</p>
							)}
						</div>
						{loading && (
							<BarLoader className='mb-4' width={'100%'} color='#36d7d7' />
						)}
						<Button type='submit'>Update Username</Button>
					</form>
				</CardContent>
				{/* Latest Updates */}
			</Card>
		</div>
	)
}

export default Dashboard
