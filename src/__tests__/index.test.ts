import { expect, describe, test, beforeAll } from '@jest/globals';
import SkoleIntra, { CalendarActivity, WeeklyPlan, WeeklySchedule } from '../index';
import 'dotenv/config';

describe('Full feature test suite', () => {
    let skoleIntraInstance: SkoleIntra;

    beforeAll(() => {
        skoleIntraInstance = new SkoleIntra(
            process.env.SKOLEINTRA_USER || '',
            process.env.SKOLEINTRA_PASS || '',
            process.env.SKOLEINTRA_URL || '',
        );
    });

    test('No cookies set by default', async () => {
        const cookies = await skoleIntraInstance.getCookies();
        expect(cookies).toBe('');
    });

    test('Custom cookies set', async () => {
        await skoleIntraInstance.setCookies('UniUserRole=Parent; UserRole=Parent; Language=Danish;');
        const cookies = await skoleIntraInstance.getCookies();
        expect(cookies).toBe('UniUserRole=Parent; UserRole=Parent; Language=Danish');
    });

    test('Get calendar activities', async () => {
        const data: CalendarActivity[] = await skoleIntraInstance.getCalendarActivitiesByMonth(new Date());
        expect(Array.isArray(data)).toBe(true);
    });

    test('Get calendar lessons', async () => {
        const weeklySchedule: WeeklySchedule = await skoleIntraInstance.getWeeklySchedule(new Date());
        expect(weeklySchedule).toHaveProperty('timeSlots');
        expect(weeklySchedule).toHaveProperty('dateSchedules');
    });

    test('Get week plan', async () => {
        const weeklyPlan: WeeklyPlan = await skoleIntraInstance.getWeeklyPlan(new Date());
        expect(weeklyPlan).toHaveProperty('generalPlan');
        expect(weeklyPlan).toHaveProperty('dailyPlans');
    });
});
