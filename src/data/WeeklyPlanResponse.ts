export interface WeeklyPlanResponse {
    SelectedPlan: {
        GeneralPlan: {
            LessonPlans: Plan[];
        };
        DailyPlans: DailyPlan[];
    };
}

interface Plan {
    Subject: { FormattedTitle: string };
    Content: string;
}

interface DailyPlan {
    Date: string;
    Day: string;
    FormattedDate: string;
    LongFormattedDate: string;
    LessonPlans: Plan[];
}
