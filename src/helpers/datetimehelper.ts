class DatetimeHelper {
    /**
     * Gets the first date of a week in ISO format
     *
     * @param date - Date object for which we want to find the first weekday.
     * @returns yyyy-mm-dd string representation of first day of the week.
     */
    public getFirstDayOfTheWeek(date: Date): Date {
        if (date.getDay() !== 1) {
            const diff: number = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

            return new Date(date.setDate(diff));
        } else {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
    }

    /**
     * Gets the week number and year from date
     *
     * @param date - Date object for which we want to find the first weekday.
     * @returns ww-yyyy string representation of week number.
     */
    public getWeekNumber(date: Date): string {
        const firstDateOfYear: Date = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - firstDateOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil(days / 7);

        return `${weekNumber.toString().padStart(weekNumber < 10 ? 2 : 0, '0')}-${date.getFullYear()}`;
    }

    /**
     * Gets the first date of a month
     *
     * @param date - Date object for which we want to find the first date.
     * @returns new date for the first day of the month.
     */
    public getFirstDayOfTheMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    public adjustDateForTimezone(date: Date): void {
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    }
}

export default new DatetimeHelper();
