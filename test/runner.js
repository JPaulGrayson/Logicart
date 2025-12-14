const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('🤖 LogiGo Headless Test Runner Starting...');

    const browser = await puppeteer.launch({
        headless: "new", // Use new headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Enable console log forwarding
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Load the Pathfinding Demo via localhost
    const url = 'http://localhost:8000/example/library/pathfinding.html';
    console.log(`📂 Loading: ${url}`);

    await page.goto(url);

    // Wait for LogiGo to be ready
    await page.waitForFunction(() => window.LogiGo !== undefined);
    console.log('✅ LogiGo loaded in page');

    // ⚡️ SPEED UP! Set speed to max (20.0x) to make the test run fast
    await page.evaluate(() => {
        window.LogiGo.setSpeed(20.0);
        console.log('⚡️ Speed set to 20.0x');
    });

    // Click the "Run A* Search" button
    const runButton = await page.waitForSelector('button'); // First button is Run
    console.log('🖱️ Clicking Run button...');
    await runButton.click();

    // Wait for the status to change to "Found!" or "No Path"
    // We'll timeout after 30 seconds now
    try {
        await page.waitForFunction(
            () => {
                const status = document.getElementById('stat-status').textContent;
                return status === 'Found!' || status === 'No Path' || status === 'Error';
            },
            { timeout: 30000 }
        );
    } catch (e) {
        console.error('❌ Timeout waiting for algorithm to finish');
        await browser.close();
        process.exit(1);
    }

    // Get the final status
    const status = await page.$eval('#stat-status', el => el.textContent);
    console.log(`🏁 Final Status: ${status}`);

    if (status !== 'Found!') {
        console.error('❌ Test Failed: Path not found');
        await browser.close();
        process.exit(1);
    }

    // Extract Reporter Data
    // We need to access the private logs from the reporter instance
    // In our implementation, LogiGo.reporter is the instance
    const report = await page.evaluate(() => {
        return {
            logs: window.LogiGo.reporter.logs,
            stats: window.LogiGo.reporter.stats
        };
    });

    console.log(`📊 Checkpoints Captured: ${report.logs.length}`);
    console.log(`⏱️ Total Duration: ${report.stats.endTime - report.stats.startTime}ms`);

    // Verify specific checkpoints exist
    const hasStart = report.logs.some(l => l.id === 'astar:start');
    const hasPath = report.logs.some(l => l.id === 'astar:path_found');

    if (hasStart && hasPath) {
        console.log('✅ Verification Passed: Critical checkpoints found');
        await browser.close();
        process.exit(0);
    } else {
        console.error('❌ Verification Failed: Missing checkpoints');
        await browser.close();
        process.exit(1);
    }

})();
