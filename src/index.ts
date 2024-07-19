import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { parse } from 'node-html-parser';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { WeeklyPlan } from './data/WeeklyPlan';
import { DatetimeHelper } from './helpers/datetimehelper';
import { CalendarActivity } from './data/CalendarActivity';
import { DateSchedule, WeeklySchedule } from './data/WeeklySchedule';
import { WeeklyPlanResponse } from './data/WeeklyPlanResponse';

class SkoleIntra {
    private axiosInstance: AxiosInstance;
    private cookieJar: CookieJar;

    private username: string;
    private password: string;
    private baseUrl: string;
    private childUrl: string = 'parent/0/navn';

    private readonly loginFormUsernameKey: string = 'UserName';
    private readonly loginFormPasswordKey: string = 'Password';
    private readonly samlFormId: string = 'samlform';

    /**
     * Instantiate a new SkoleIntra class.
     *
     * @param username Username for the skoleintra platform
     * @param password Password for the Skoleintra platform
     * @param baseUrl The full URL to the schools Skoleintra platform. Ex. https://minskole.m.skoleintra.dk
     */
    constructor(username: string, password: string, baseUrl: string) {
        this.username = username;
        this.password = password;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; // remove trailing slash if set

        this.cookieJar = new CookieJar();
        this.axiosInstance = wrapper(axios.create({ jar: this.cookieJar }));

        // const requestHeaders = {
        //    referer: 'https://www.google.com/',
        //    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
        //    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        //    'Accept-Language': 'da,en-US;q=0.7,en;q=0.3',
        //    'Accept-Encoding': 'gzip, deflate, br',
        //    Connection: 'keep-alive',
        //
        //    'Upgrade-Insecure-Requests': '1',
        //    'Sec-Fetch-Dest': 'document',
        //    'Sec-Fetch-Mode': 'navigate',
        //    'Sec-Fetch-Site': 'cross-site',
        //    Pragma: 'no-cache',
        // };
    }

    /**
     * Retrieve the http cookies set from accessing Skoleintra.
     *
     * @returns All cookies from Cookies header as key-value pair separated by semicolon.
     */
    public getCookies(): Promise<string> {
        return this.cookieJar.getCookieString(this.baseUrl);
    }

    /**
     * Can be used to reapply cookies from the getCookies method.
     * The method overrides existing cookie values if applying with the same name/key.
     *
     * @param customCookies Cookie string to append as cookie header on all subsequent requests.
     *
     * @returns Promise that resolves once the cookies are set.
     */
    public async setCookies(customCookies: string): Promise<void> {
        const cookieStrings = customCookies.split(';');
        for (const cookieString of cookieStrings) {
            if (cookieString) {
                await this.cookieJar.setCookie(cookieString, this.baseUrl);
            }
        }
    }

    /**
     * Fetches all main school events on the childs calendar.
     *
     * @param dateInMonth - Any date representation in the month to search for.
     *
     * @returns A promise which resolves with array of calendar activities.
     */
    public async getCalendarActivitiesByMonth(dateInMonth: number | Date | string): Promise<CalendarActivity[]> {
        let results: CalendarActivity[] = [];
        const firstDayOfTheMonth = DatetimeHelper.getFirstDayOfTheMonth(new Date(dateInMonth));
        const firstDayOfThatWeek = DatetimeHelper.getFirstDayOfTheWeek(firstDayOfTheMonth);
        const sevenWeeksLater = new Date(firstDayOfThatWeek.getTime());
        sevenWeeksLater.setDate(sevenWeeksLater.getDate() + 42);

        DatetimeHelper.adjustDateForTimezone(firstDayOfThatWeek);
        DatetimeHelper.adjustDateForTimezone(sevenWeeksLater);

        const targetUrl = `/calendareventsource/SchoolEvents?departmentIds=%5B%220%22%5D&start=${firstDayOfThatWeek.getTime() / 1000}&end=${sevenWeeksLater.getTime() / 1000}&_=${Date.now()}`;
        const response = await this.tryNavigate(targetUrl);
        if (response) {
            results = response.data;
        }

        return results;
    }

    /**
     * Fetches the weekly schedule for the child.
     *
     * @param date - Any date representation in the week to search for.
     *
     * @returns A promise which resolves with the weekly schedule implementing the WeeklySchedule interface.
     */
    public async getWeeklySchedule(date: number | string | Date): Promise<WeeklySchedule> {
        let results: WeeklySchedule = {};

        const weekStartDate: string = DatetimeHelper.getFirstDayOfTheWeek(new Date(date)).toISOString().slice(0, 10);
        const targetUrl = `/schedules/schedule/scheme?weekStartDate=${weekStartDate}&_=${Date.now()}`;

        const response = await this.tryNavigate(targetUrl);
        if (response) {
            const timeSlots: string[] = [];
            const dateSchedules: DateSchedule[] = [];
            const DOM = parse(response.data);

            DOM.querySelectorAll('.sk-ws-secondary').forEach((element) => {
                if (!element.classList.contains('h-is-mobile') && !element.classList.contains('sk-ws-header')) {
                    const timeStrings: string[] = [];
                    element.querySelectorAll('span').forEach((spanElement) => {
                        if (spanElement.innerText !== '&nbsp;') {
                            timeStrings.push(spanElement.innerText);
                        }
                    });
                    timeSlots.push(timeStrings.join(' '));
                }
            });

            DOM.querySelectorAll('.sk-ws-primary').forEach((element) => {
                if (element.classList.contains('sk-ws-header')) {
                    const headerContent: DateSchedule = {
                        day: '',
                        formattedDate: '',
                        timeSlotContents: [],
                    };

                    element.querySelectorAll('span').forEach((spanElement) => {
                        if (spanElement.classList.length === 0) {
                            headerContent.day = spanElement.innerText.trim();
                        } else {
                            headerContent.formattedDate = spanElement.innerText.trim();
                        }
                    });

                    dateSchedules.push(headerContent);
                } else {
                    const dateSchedule = dateSchedules[dateSchedules.length - 1];
                    const timeSlotContent: string[] = [];

                    element.querySelectorAll('span').forEach((spanElement) => {
                        timeSlotContent.push(spanElement.innerText.trim());
                    });

                    dateSchedule.timeSlotContents.push(timeSlotContent);
                }
            });

            results = { timeSlots, dateSchedules };
        }

        return results;
    }

    /**
     * Fetches the weekly schedule for the child.
     *
     * @param date - Any date representation in the week to search for.
     *
     * @returns A promise which resolves with the weekly plan implementing the WeeklyPlan interface.
     */
    public async getWeeklyPlan(date: number | string | Date): Promise<WeeklyPlan> {
        let results: WeeklyPlan = {};
        const weekParam: string = DatetimeHelper.getWeekNumber(new Date(date));
        const targetUrl = `item/weeklyplansandhomework/item/class/${weekParam}`;

        const response = await this.tryNavigate(targetUrl);
        if (response) {
            const weeklyPlan = parse(response.data)
                .querySelector('#root')
                ?.getAttribute('data-clientlogic-settings-WeeklyPlansApp');

            if (weeklyPlan) {
                const weeklyPlanJSON: WeeklyPlanResponse = JSON.parse(weeklyPlan);

                results = {
                    generalPlan: {
                        lessonPlans: weeklyPlanJSON.SelectedPlan.GeneralPlan.LessonPlans.map((plan) => {
                            return {
                                subject: plan.Subject.FormattedTitle,
                                content: decodeURIComponent(plan.Content),
                            };
                        }),
                    },
                    dailyPlans: weeklyPlanJSON.SelectedPlan.DailyPlans.map((dailyPlan) => {
                        return {
                            date: dailyPlan.Date,
                            day: dailyPlan.Day,
                            formattedDate: dailyPlan.FormattedDate,
                            longFormattedDate: dailyPlan.LongFormattedDate,
                            lessonPlans: dailyPlan.LessonPlans.map((plan) => {
                                return {
                                    subject: plan.Subject.FormattedTitle,
                                    content: decodeURIComponent(plan.Content),
                                };
                            }),
                        };
                    }),
                };
            }
        }

        return results;
    }

    /**
     * Will attempt to authenticate with the credentials provided during initialization.
     *
     * @returns A promise which resolves true if the authentication was succesful.
     */
    private async authenticate(): Promise<boolean> {
        const attemptCount = 3;

        for (let i = 0; i < attemptCount; i += 1) {
            const mainSiteResponse = await this.axiosInstance.get(this.baseUrl);
            const mainSiteDOM = parse(mainSiteResponse.data);
            const mainSiteForm = mainSiteDOM.querySelector('form');

            if (mainSiteForm) {
                const postData: { [key: string]: string } = {};
                const actionPath = mainSiteForm.getAttribute('action');
                mainSiteForm.getElementsByTagName('input').forEach((mainSiteFormInput) => {
                    const key = mainSiteFormInput.getAttribute('name');
                    const value = mainSiteFormInput.getAttribute('value') || '';

                    switch (key) {
                        case this.loginFormUsernameKey:
                            postData[key] = this.username;
                            break;

                        case this.loginFormPasswordKey:
                            postData[key] = this.password;
                            break;

                        default:
                            if (key !== undefined) {
                                postData[key] = value;
                            }
                    }
                });

                const loginResponse = await this.axiosInstance.postForm(this.baseUrl + actionPath, postData);
                const passedResponse = await this.checkAndPassNoScriptBlock(loginResponse);
                const loggedIn = !this.doesPageContainLoginForm(passedResponse.data);

                if (loggedIn) {
                    this.childUrl =
                        passedResponse.request.res.responseUrl.replace(`${this.baseUrl}/`, '').replace('/Index', '') ||
                        this.childUrl;
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Attempt to navigate to a path on the base url.
     * This method authenticates with user credentials if not already logged in.
     *
     * @param targetUrl - Path to navigate to.
     *
     * @returns A promise which resolves to the Axios response if the navigation was succesful.
     */
    private async tryNavigate(targetUrl: string): Promise<AxiosResponse | null> {
        let response = await this.axiosInstance.get(`${this.baseUrl}/${this.childUrl}${targetUrl}`);
        response = await this.checkAndPassNoScriptBlock(response);
        let navigated = !this.doesPageContainLoginForm(response.data);

        if (!navigated) {
            const authenticated = await this.authenticate();

            if (authenticated) {
                response = await this.axiosInstance.get(`${this.baseUrl}/${this.childUrl}${targetUrl}`);
                response = await this.checkAndPassNoScriptBlock(response);
                navigated = !this.doesPageContainLoginForm(response.data);
            }
        }

        if (await this.checkBlockedByAutomationProtection(response)) {
            throw new Error(
                'Request was blocked by automation protection. Try initializing SkoleIntra with an existing cookie.',
            );
        }

        return navigated ? response : null;
    }

    private async checkBlockedByAutomationProtection(response: AxiosResponse): Promise<boolean> {
        const DOM = parse(response.data);
        return (
            response?.status === 500 &&
            DOM.querySelectorAll('h1').length === 1 &&
            DOM.querySelectorAll('h2').length === 1
        );
    }

    private async checkAndPassNoScriptBlock(response: AxiosResponse): Promise<AxiosResponse> {
        const DOM = parse(response.data);
        const samlForm = DOM.getElementById(this.samlFormId);

        if (samlForm) {
            const postData: { [key: string]: string } = {};
            const actionPath = samlForm.getAttribute('action') || '';
            samlForm.getElementsByTagName('input').forEach((mainSiteFormInput) => {
                const key = mainSiteFormInput.getAttribute('name');
                const value = mainSiteFormInput.getAttribute('value') || '';

                if (key !== undefined) {
                    postData[key] = value;
                }
            });

            const samlResponse = await this.axiosInstance.postForm(actionPath, postData);

            return samlResponse;
        }

        return response;
    }

    private doesPageContainLoginForm(htmlData: string): boolean {
        return !!parse(htmlData)?.getElementById(this.loginFormUsernameKey);
    }
}

export default SkoleIntra;
export { WeeklyPlan, WeeklySchedule, CalendarActivity };
