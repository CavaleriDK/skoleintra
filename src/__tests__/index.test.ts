import { expect, describe, test, beforeAll } from '@jest/globals';
import SkoleIntra from '../index';
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

    test('Get calendar activities', async () => {
        const json = await skoleIntraInstance.getCalendarActivitiesByMonth(new Date());
        expect(json).not.toBe('');
    }, 30000);

    test('Get calendar lessons', async () => {
        const html = await skoleIntraInstance.getWeeklySchedule(new Date());
        expect(html).not.toBe('');
    }, 30000);

    test('Get week plan', async () => {
        const html = await skoleIntraInstance.getWeeklyPlan(new Date());
        expect(html).not.toBe('');
    }, 30000);

    test('Chaining all methods', async () => {
        return skoleIntraInstance
            .initialize()
            .then(() => skoleIntraInstance.getCalendarActivitiesByMonth(new Date(), false))
            .then((activities) => {
                expect(activities).not.toBe('');
            })
            .then(() => skoleIntraInstance.getWeeklySchedule(new Date(), false))
            .then((schedule) => {
                expect(schedule).not.toBe('');
            })
            .then(() => skoleIntraInstance.getWeeklyPlan(new Date(), false))
            .then((plan) => {
                expect(plan).not.toBe('');
            })
            .finally(() => skoleIntraInstance.closeAll());
    }, 30000);
});
