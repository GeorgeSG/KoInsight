import { Duration } from 'date-fns';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { formatDuration } from 'date-fns/formatDuration';
import { intervalToDuration } from 'date-fns/intervalToDuration';
const { daysInYear, millisecondsInDay } = require("date-fns/constants");

export function getDuration(seconds: number): Duration {
  return intervalToDuration({ start: 0, end: seconds * 1000 });
}

export function shortDuration(duration: Duration): string {
  const hours = String(duration.hours ?? 0).padStart(2, '0');
  const minutes = String(duration.minutes ?? 0).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatSecondsToHumanReadable(seconds: number, hideSeconds = true): string {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });

  if (!hideSeconds) {
    return formatDuration(duration);
  }

  duration.hours = ((duration.years * daysInYear) + duration.days) * 24 + duration.hours

  if (!duration.minutes && !duration.hours && !duration.seconds) {
    return 'N/A';
  }

  if (!duration.minutes && !duration.hours && duration.seconds && duration.seconds > 0) {
    return 'Less than a minute';
  }
  
  return formatDuration(duration, { format: ['hours', 'minutes'] });
}

export function formatRelativeDate(date: number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
