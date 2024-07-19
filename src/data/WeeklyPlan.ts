interface GeneralPlan {
    lessonPlans: LessonPlan[];
}

interface DailyPlan {
    date: string;
    day: string;
    formattedDate: string;
    longFormattedDate: string;
    lessonPlans: LessonPlan[];
}

interface LessonPlan {
    subject: string;
    content: string;
}

export interface WeeklyPlan {
    generalPlan?: GeneralPlan;
    dailyPlans?: DailyPlan[];
}
