import type { Place } from '../../db/types';
import { daysBetween, formatDate } from '../../lib/dates';
import { plural } from '../../lib/format';

/** '03.11.2026 bis 20.11.2026, 18 Tage' oder 'seit 03.11.2026' */
export function formatStay(place: Pick<Place, 'arrivalDate' | 'departureDate'>): string {
  if (!place.departureDate) return `Seit ${formatDate(place.arrivalDate)}`;
  if (place.departureDate === place.arrivalDate) return formatDate(place.arrivalDate);
  const days = daysBetween(place.arrivalDate, place.departureDate) + 1;
  return `${formatDate(place.arrivalDate)} bis ${formatDate(place.departureDate)}, ${plural(days, 'Tag', 'Tage')}`;
}
