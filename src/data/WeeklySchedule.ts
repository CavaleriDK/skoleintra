export interface DateSchedule {
    day: string;
    formattedDate: string;
    timeSlotContents: string[][];
}

export interface WeeklySchedule {
    timeSlots?: string[];
    dateSchedules?: DateSchedule[];
}
