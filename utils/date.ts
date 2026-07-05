export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(dateISO: string) {
  return dateISO;
}

export function getCurrentWeekRange(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);

  return {
    start: copy.toISOString().slice(0, 10),
    end: getTodayISO(),
  };
}

export function isSameDay(dateISO: string, targetISO = getTodayISO()) {
  return dateISO.slice(0, 10) === targetISO;
}

export function isDateInCurrentWeek(dateISO: string, date = new Date()) {
  const { start, end } = getCurrentWeekRange(date);
  const day = dateISO.slice(0, 10);

  return day >= start && day <= end;
}

export function isWithinRange(dateISO: string, startISO: string, endISO: string) {
  return dateISO >= startISO && dateISO <= endISO;
}

export function todayISO() {
  return getTodayISO();
}

export function startOfWeekISO(date = new Date()) {
  return getCurrentWeekRange(date).start;
}
