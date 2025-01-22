import { getEventAvailability, getEventsDetails } from '@/actions/events'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import BookingForm from './_components/booking-form'
import EventDetails from './_components/event-details'

export async function generateMetadata({ params }) {
	const event = await getEventsDetails(params.username, params.eventId)
	if (!event) {
		return {
			title: 'Event Not Found',
		}
	}

	return {
		title: `Book ${event.title} with ${event.user.name} | Scheduler`,
		description: `Schedule a ${event.duration}-minute ${event.title} even with ${event.user.name}`,
	}
}

const EventPage = async ({ params }) => {
	const event = await getEventsDetails(params.username, params.eventId)
	const availability = await getEventAvailability(params.eventId)

	if (!event) {
		notFound()
	}

	return (
		<div className='flex flex-col justify-center lg:flex-row px-4 py-8'>
			<EventDetails event={event} />
			<Suspense fallback={<div>Loading booking...</div>}>
				<BookingForm event={event} availability={availability} />
			</Suspense>
		</div>
	)
}

export default EventPage
