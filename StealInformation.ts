const pageJson = require('./page.json');
const puppeteer = require('puppeteer');
const fs = require("fs");





export async function getStocks(cName: string) {

    try {

        // Launch sequence
        const browser = await puppeteer.launch({
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
            ],
            headless: false,
            ignoreHTTPSErrors: true,
        })

        const page = await browser.newPage()
        await page.setViewport({width: 1920, height: 1280, deviceScaleFactor: 1});
        await page.goto(`${pageJson.name}${cName}`, {waitUntil: "domcontentloaded" , timeout: 60000});
        await page.click('#ctl00_ContentPlaceHolder1_CompanyDetail1_lnkHistoryTab');

        await page
            .waitForSelector('#ctl00_ContentPlaceHolder1_CompanyDetail1_divDataPrice > div.table-responsive > ' +
                'table > tbody', {visible: true})
            .then(() => console.log('Table Loaded.'));

        await page
            .waitForSelector('#ctl00_ContentPlaceHolder1_CompanyDetail1_PagerControlTransactionHistory1_litRec' +
                'ords', {visible: true})
            .then(() => console.log('Got max pages.'));

        let element = await page.$('#ctl00_ContentPlaceHolder1_CompanyDetail1_PagerControlTransactionHistory1_litRec' +
                'ords')
        let maxPage:any = await page.evaluate((el: { textContent: any; }) => el?.textContent, element)

        let Maxpage = maxPage?.match(/Total pages: \d+/gm)?.toString()
        Maxpage = parseInt(Maxpage.toString().match(/\d+/gm))

        for (let index = 1; index <= Maxpage; index++) {
            console.log(index, Maxpage);
            if (index < Maxpage) {

                await page
                    .waitForSelector(`a[title="Page ${index + 1}"]`, {visible: true})
                    .then(() => console.log('Next page loaded', index));

                }
            let PageNumberSelector = `a[title="Page ${index}"]`

            await page.click(PageNumberSelector);
            await page
                .waitForSelector('#ctl00_ContentPlaceHolder1_CompanyDetail1_divDataPrice > div.table-responsive > ' +
                    'table > tbody', {visible: true})
                .then(() => console.log('Current Table Loaded.'));

            const result = await page.evaluate(() => {

                const rows:any = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_CompanyDetail1_divDataPrice > div.table-responsive > ' +
                        'table > tbody'));
                return rows.map((td: { innerText: any; }) => td?.innerText);
            });

            let csvresult = await result[0].replace(/;/g, ",");

            !fs.existsSync(`./stockDetails/${cName}`) && fs.mkdirSync(`./stockDetails/${cName}`, {recursive: true})

            fs.writeFile(`./stockDetails/${cName}/data${index}.csv`, csvresult, (err: any) => {
                console.log(err || "done");
            });
    
            if (index < Maxpage) {
                await page.click(`a[title="Page ${index + 1}"]`);
            }

        }

        await browser.close();
        return true
    } catch (error) {
        return true

    }

}



