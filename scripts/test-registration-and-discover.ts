import puppeteer from "puppeteer-core";

async function testRegistrationAndDiscover() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const results: any = {};

  try {
    console.log("Navigating to https://bizearch.in/login?portal=Account");
    await page.goto("https://bizearch.in/login?portal=Account", { waitUntil: "networkidle2" });

    // Click "Create an account"
    const createBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(el => el.textContent?.toLowerCase().includes("create an account"));
      if (btn) {
        (btn as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log("Clicked Create an account:", createBtn);
    await new Promise(r => setTimeout(r, 1000));

    // Inspect fields in registration mode
    const regFormDetails = await page.evaluate(() => {
      const heading = document.querySelector("h2, h3")?.textContent || "";
      const inputs = Array.from(document.querySelectorAll("input, select, textarea")).map(i => ({
        name: (i as HTMLInputElement).name,
        type: (i as HTMLInputElement).type,
        placeholder: (i as HTMLInputElement).placeholder,
        required: (i as HTMLInputElement).required
      }));
      const buttons = Array.from(document.querySelectorAll("button")).map(b => b.textContent?.trim()).filter(Boolean);
      return { heading, inputs, buttons };
    });
    results.registrationForm = regFormDetails;

    // Test invalid mobile number validation
    console.log("Testing mobile number validation...");
    const phoneInput = await page.$("input[name='phone'], input[type='tel']");
    if (phoneInput) {
      await phoneInput.type("12345"); // invalid short number
      const otpBtn = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.toLowerCase().includes("otp"));
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });
      await new Promise(r => setTimeout(r, 1000));
      const phoneValidationMsg = await page.evaluate(() => {
        const alert = document.querySelector("[role='alert'], .text-red-600, .text-rose-600");
        return alert ? (alert as HTMLElement).innerText : "";
      });
      results.phoneValidation = { phoneValidationMsg, otpBtnClicked: otpBtn };
    }

    console.log("\nREGISTRATION TEST RESULTS:\n", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

testRegistrationAndDiscover();
