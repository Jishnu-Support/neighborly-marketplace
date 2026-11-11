import puppeteer from "puppeteer-core";

async function runLiveTests() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const results: any = {};

  try {
    // 1. Customer Login - Invalid Password
    console.log("Testing: Customer Login with invalid password");
    await page.goto("https://bizearch.in/login?portal=Account", { waitUntil: "networkidle2" });
    await page.type("input[name='identity']", "testnonexistent999@example.com");
    await page.type("input[name='password']", "wrongpassword123");
    await page.click("button[type='submit']");
    await new Promise(r => setTimeout(r, 2000));
    const errorMsg = await page.evaluate(() => {
      const el = document.querySelector("[role='alert'], .text-red-600, .text-rose-600, .bg-red-50, .border-red-200");
      return el ? (el as HTMLElement).innerText.trim() : document.body.innerText.slice(0, 300);
    });
    results.customerInvalidLogin = { errorMsg, url: page.url() };

    // 2. Customer Login - Empty Fields
    console.log("Testing: Customer Login empty fields validation");
    await page.goto("https://bizearch.in/login?portal=Account", { waitUntil: "networkidle2" });
    const emptyCheck = await page.evaluate(() => {
      const idInput = document.querySelector("input[name='identity']") as HTMLInputElement | null;
      const passInput = document.querySelector("input[name='password']") as HTMLInputElement | null;
      return {
        idRequired: idInput ? idInput.required : false,
        passRequired: passInput ? passInput.required : false
      };
    });
    results.customerEmptyCheck = emptyCheck;

    // 3. Customer Forgot Password
    console.log("Testing: Forgot Password link");
    const forgotPwdText = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(el => (el as HTMLElement).innerText.toLowerCase().includes("forgot"));
      return btn ? (btn as HTMLElement).innerText.trim() : "NOT_FOUND";
    });
    results.forgotPassword = forgotPwdText;

    // 4. Portal tabs on login page
    console.log("Testing: Portal tabs navigation");
    const portalTabs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a, button"))
        .filter(el => ["customer", "business", "agent", "company"].some(t => (el as HTMLElement).innerText.toLowerCase().includes(t)))
        .map(el => ({ text: (el as HTMLElement).innerText.trim(), href: (el as HTMLAnchorElement).href || "" }));
    });
    results.portalTabs = portalTabs;

    // 5. Company Login page
    console.log("Testing: /company-login");
    await page.goto("https://bizearch.in/company-login", { waitUntil: "networkidle2" });
    const companyPageDetails = await page.evaluate(() => {
      const title = document.title;
      const heading = (document.querySelector("h1, h2") as HTMLElement)?.innerText || "";
      const tabs = Array.from(document.querySelectorAll("button, [role='tab']")).map(b => (b as HTMLElement).innerText.trim());
      const inputs = Array.from(document.querySelectorAll("input")).map(i => ({ name: (i as HTMLInputElement).name, type: (i as HTMLInputElement).type, placeholder: (i as HTMLInputElement).placeholder }));
      return { title, heading, tabs, inputs };
    });
    results.companyPage = companyPageDetails;

    // 6. Test Company Login with invalid credentials
    await page.type("input[name='identity']", "admin@bizearch.in");
    await page.type("input[name='password']", "wrongsecret12345");
    await page.click("button[type='submit']");
    await new Promise(r => setTimeout(r, 2000));
    const companyError = await page.evaluate(() => {
      const el = document.querySelector("[role='alert'], .text-red-600, .text-rose-600");
      return el ? (el as HTMLElement).innerText.trim() : "";
    });
    results.companyInvalidLogin = { companyError, url: page.url() };

    console.log("\nALL RESULTS:\n", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

runLiveTests();
