'use server'

import { eventSchema } from '@/app/lib/validators'
import { db } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import {
	addDays,
	addMinutes,
	format,
	isBefore,
	parseISO,
	startOfDay,
} from 'date-fns'

export async function createEvent(data) {
	const { userId } = await auth()

	if (!userId) {
		throw new Error('Unauthorized')
	}

	const validatedData = eventSchema.parse(data)

	const user = await db.user.findUnique({
		where: { clerkUserId: userId },
	})

	if (!user) {
		throw new Error('User not found')
	}

	const event = await db.event.create({
		data: {
			...validatedData,
			userId: user.id,
		},
	})

	return event
}

export async function getUserEvents() {
	const { userId } = await auth()

	if (!userId) {
		throw new Error('Unauthorized')
	}

	const user = await db.user.findUnique({
		where: { clerkUserId: userId },
	})

	if (!user) {
		throw new Error('User not found')
	}

	const events = await db.event.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
		include: {
			_count: {
				select: { booking: true },
			},
		},
	})

	return { events, username: user.username }
}

export async function deleteEvent(eventId) {
	const { userId } = await auth()

	if (!userId) {
		throw new Error('Unauthorized')
	}

	const user = await db.user.findUnique({
		where: { clerkUserId: userId },
	})

	if (!user) {
		throw new Error('User not found')
	}

	const event = await db.event.findUnique({
		where: { id: eventId },
	})
	if (!event || event.userId !== user.id) {
		throw new Error('Event not found or unauthorized')
	}

	await db.event.delete({
		where: { id: eventId },
	})

	return { success: true }
}

export async function getEventsDetails(username, eventId) {
	const event = await db.event.findFirst({
		where: {
			id: eventId,
			user: {
				username: username,
			},
		},
		include: {
			user: {
				select: {
					name: true,
					username: true,
					email: true,
					imageUrl: true,
				},
			},
		},
	})
	return event
}

export async function getEventAvailability(eventId) {
	const event = await db.event.findUnique({
		where: {
			id: eventId,
		},
		include: {
			user: {
				include: {
					availability: {
						select: {
							days: true,
							timesGap: true,
						},
					},
					booking: {
						select: {
							startTime: true,
							endTime: true,
						},
					},
				},
			},
		},
	})

	if (!event || !event.user.availability) {
		return []
	}
	const { availability, booking } = event.user
	const startDate = startOfDay(new Date())
	const endDate = addDays(startDate, 30)

	const availableDates = []

	for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
		const dayOfWeek = format(date, 'EEEE').toUpperCase()
		const dayAvailability = availability.days.find(d => d.day === dayOfWeek)

		if (dayAvailability) {
			const dateStr = format(date, 'yyyy-MM-dd')

			const slots = generateAvailableTimeSlots(
				dayAvailability.startTime,
				dayAvailability.endTime,
				event.duration,
				booking,
				dateStr,
				availability.timesGap
			)
			availableDates.push({
				date: dateStr,
				slots,
			})
		}
	}

	return availableDates
}

function generateAvailableTimeSlots(
	startTime,
	endTime,
	duration,
	bookings,
	dateStr,
	timesGap = 0
) {
	const slots = []
	let currentTime = parseISO(
		`${dateStr}T${startTime.toISOString().slice(11, 16)}:00Z`
	)
	const slotEndTime = parseISO(
		`${dateStr}T${endTime.toISOString().slice(11, 16)}:00Z`
	)

	const now = new Date()
	if (format(now, 'yyyy-MM-dd') === dateStr) {
		currentTime = isBefore(currentTime, now)
			? addMinutes(now, timesGap)
			: currentTime
	}

	while (currentTime < slotEndTime) {
		const slotEnd = new Date(currentTime.getTime() + duration * 60000)

		const isSlotAvailable = !bookings.some(booking => {
			const bookingStart = booking.startTime
			const bookingEnd = booking.endTime

			return (
				(currentTime >= bookingStart && currentTime < bookingEnd) ||
				(slotEnd > bookingStart && slotEnd <= bookingEnd) ||
				(currentTime <= bookingStart && slotEnd >= bookingEnd)
			)
		})

		if (isSlotAvailable) {
			const hours = currentTime.getUTCHours()
			const minutes = currentTime.getUTCMinutes()

			const formattedTime = `${String(hours).padStart(2, '0')}:${String(
				minutes
			).padStart(2, '0')}`
			slots.push(formattedTime)
		}
		currentTime = slotEnd
	}

	return slots
}
