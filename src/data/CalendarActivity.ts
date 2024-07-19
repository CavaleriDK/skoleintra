export interface CalendarActivity {
    MassCreationId: string | number;
    originalId: number;
    id: string;

    title: string;
    description: string;
    invitees: string[];
    authorName: string;
    location: string[];

    allDay: boolean;
    startDate: Date;
    endDate: Date;
    start: string;
    end: string;
    startTimestamp: number;
    endTimestamp: number;

    formattedEventDuration: string;
    eventDuration: string;
}
