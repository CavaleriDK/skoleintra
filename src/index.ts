import { Browser, HTTPResponse, Page } from 'puppeteer';
import DatetimeHelper from './helpers/datetimehelper';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

class SkoleIntra {
    private browser?: Browser;
    private page?: Page;
    private username: string;
    private password: string;
    private baseUrl: string;
    private childUrl: string = 'parent/0/navn';

    /**
     * Instantiate a new SkoleIntra class.
     *
     * @param username Username for the skoleintra platform
     * @param password Password for the Skoleintra platform
     * @param baseUrl The full URL to the schools Skoleintra platform. Ex. https://minskole.m.skoleintra.dk
     */
    constructor(username: string, password: string, baseUrl: string) {
        // Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
        puppeteer.use(StealthPlugin());

        this.username = username;
        this.password = password;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; // remove trailing slash if applicable
    }

    /**
     * Initialize a new browser instance and set HTTP request headers.
     *
     * @param customCookie Optional string to append as cookie header on the first GET request
     *
     * @returns Promise that resolves once the browser is launched and the first page context is created.
     */
    public async initialize(customCookie?: string): Promise<void> {
        const requestHeaders = {
            referer: 'https://www.google.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'da,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',

            Cookie: customCookie ? customCookie : '',

            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            Pragma: 'no-cache',
        };

        this.browser = await puppeteer.launch({
            args: ['--window-size=1920,1080'],
            headless: !process.env.SKOLEINTRA_TEST_WITH_DEBUG,
        });
        this.page = await this.browser.newPage();
        await this.page.setExtraHTTPHeaders({ ...requestHeaders });
    }

    /**
     * Gracefully closes the browser and page context.
     */
    public async closeAll(): Promise<void> {
        await this.page?.close();
        await this.browser?.close();
    }

    /**
     * Fetches all main school events on the childs calendar.
     *
     * @param dateInMonth - Any date representation in the month to search for.
     * @param initiateBrowser
     * Set to false if you want to chain multiple methods.
     *
     * When false, the method will not create its own instance of browser and page.
     * However, you will need to manually close them both.
     *
     * @returns A promise which resolves with json formatted array of events.
     */
    public async getCalendarActivitiesByMonth(
        dateInMonth: number | Date | string,
        initiateBrowser: boolean = true,
    ): Promise<string> {
        let results = '[]';
        const firstDayOfTheMonth = DatetimeHelper.getFirstDayOfTheMonth(new Date(dateInMonth));
        const firstDayOfThatWeek = DatetimeHelper.getFirstDayOfTheWeek(firstDayOfTheMonth);
        const sevenWeeksLater = new Date(firstDayOfThatWeek.getTime());
        sevenWeeksLater.setDate(sevenWeeksLater.getDate() + 42);

        DatetimeHelper.adjustDateForTimezone(firstDayOfThatWeek);
        DatetimeHelper.adjustDateForTimezone(sevenWeeksLater);

        try {
            if (initiateBrowser) {
                await this.initialize();
            }
            if (!this.page) throw new Error('Page is undefined');

            const targetUrl = `/calendareventsource/SchoolEvents?departmentIds=%5B%220%22%5D&start=${firstDayOfThatWeek.getTime() / 1000}&end=${sevenWeeksLater.getTime() / 1000}&_=${Date.now()}`;

            if (await this.tryNavigate(targetUrl)) {
                await this.page.waitForNetworkIdle();

                const innerText = await (
                    await this.page.$('body').then((body) => {
                        return body?.getProperty('textContent');
                    })
                )?.jsonValue();

                if (innerText) results = innerText;
            }
        } finally {
            if (initiateBrowser) {
                await this.closeAll();
            }
        }

        return results;
    }

    /**
     * Fetches the weekly schedule for the child.
     *
     * @param date - Any date representation in the week to search for.
     * @param initiateBrowser
     * Set to false if you want to chain multiple methods.
     *
     * When false, the method will not create its own instance of browser and page.
     * However, you will need to manually close them both.
     *
     * @returns A promise which resolves with html formatted weekly schedule
     */
    public async getWeeklySchedule(date: number | string | Date, initiateBrowser: boolean = true): Promise<string> {
        let results = '';

        try {
            if (initiateBrowser) {
                await this.initialize();
            }
            if (!this.page) throw new Error('Page is undefined');

            const weekStartDate: string = DatetimeHelper.getFirstDayOfTheWeek(new Date(date))
                .toISOString()
                .slice(0, 10);
            const targetUrl = `/schedules/schedule/scheme?weekStartDate=${weekStartDate}&_=${Date.now()}`;

            if (await this.tryNavigate(targetUrl)) {
                await this.page.waitForNetworkIdle();
                const innerHTML = await this.page.$eval('body', (el) => el.innerHTML);

                if (innerHTML) results = innerHTML;
            }
        } finally {
            if (initiateBrowser) {
                await this.closeAll();
            }
        }

        return results;
    }

    /**
     * Fetches the weekly schedule for the child.
     *
     * @param date - Any date representation in the week to search for.
     * @param initiateBrowser
     * Set to false if you want to chain multiple methods.
     *
     * When false, the method will not create its own instance of browser and page.
     * However, you will need to manually close them both.
     *
     * @returns A promise which resolves with html formatted weekly schedule
     */
    public async getWeeklyPlan(date: number | string | Date, initiateBrowser: boolean = true): Promise<string> {
        let results = '';

        try {
            if (initiateBrowser) {
                await this.initialize();
            }
            if (!this.page) throw new Error('Page is undefined');

            const weekParam: string = DatetimeHelper.getWeekNumber(new Date(date));
            const targetUrl = `item/weeklyplansandhomework/item/class/${weekParam}`;

            if (await this.tryNavigate(targetUrl)) {
                await this.page.waitForNetworkIdle();
                const innerHTML = await this.page.$eval('.sk-weekly-plan-container', (el) => el.innerHTML);

                if (innerHTML) results = innerHTML;
            }
        } finally {
            if (initiateBrowser) {
                await this.closeAll();
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
        if (!this.page) throw new Error('Page is undefined');

        let success = false;
        const attemptCount = 3;

        for (let i = 0; i < attemptCount; i += 1) {
            await this.page.goto(this.baseUrl);
            await this.page.waitForNetworkIdle();

            await this.page.type('#UserName', this.username);
            await this.page.waitForNetworkIdle();

            await this.page.type('#Password', this.password);
            await this.page.waitForNetworkIdle();

            await this.page.click('input[value="Login"]');
            await this.page.waitForNetworkIdle();

            success = !(await this.page.$('#UserName'));

            if (success) {
                this.childUrl = this.page.url().replace(`${this.baseUrl}/`, '').replace('/Index', '');

                break;
            }
        }

        return success;
    }

    /**
     * Attempt to navigate to a path on the base url.
     * This method authenticates with user credentials if not already logged in.
     *
     * @param targetUrl - Path to navigate to.
     * @returns A promise which resolves true if the navigation was succesful.
     */
    private async tryNavigate(targetUrl: string): Promise<boolean> {
        if (!this.page) throw new Error('Page is undefined');

        let response = await this.page.goto(`${this.baseUrl}/${this.childUrl}${targetUrl}`);
        await this.page.waitForNetworkIdle();

        let navigated = !(await this.page.$('#UserName'));

        if (!navigated) {
            const authenticated = await this.authenticate();

            if (authenticated) {
                response = await this.page.goto(`${this.baseUrl}/${this.childUrl}${targetUrl}`);
                await this.page.waitForNetworkIdle();
                navigated = !(await this.page.$('#UserName'));
            }
        }

        if (await this.blockedByAutomationProtection(response)) {
            throw new Error(
                'Request was blocked by automation protection. Try initializing SkoleIntra with an existing cookie.',
            );
        }

        return navigated;
    }

    private async blockedByAutomationProtection(response: HTTPResponse | null): Promise<boolean> {
        if (!this.page) throw new Error('Page is undefined');
        if (!response) throw new Error('Response is null');

        return (
            response?.status() === 500 &&
            (await this.page.$$('h1')).length === 1 &&
            (await this.page.$$('h2')).length === 1
        );
    }
}

export default SkoleIntra;
