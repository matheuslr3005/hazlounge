import type { EventKind } from './events'

/** Kept apart from events.ts so the server can import the event catalog without touching Vite-only APIs */
export const eventImage: Record<EventKind, string> = {
  pizza: `${import.meta.env.BASE_URL}images/pizza-night.png`,
  sushi: `${import.meta.env.BASE_URL}images/sushi-night.png`,
  burger: `${import.meta.env.BASE_URL}images/burger-night.png`,
}
