export async function sendOtpSms(mobile, code) {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    const form = new URLSearchParams({ To: mobile, From: process.env.TWILIO_FROM, Body: `Your Bizearch verification code is ${code}. It expires in 5 minutes.` });
    const basic = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
    if (!response.ok) throw new Error('SMS delivery failed');
    return 'twilio';
  }
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID && process.env.MSG91_SENDER_ID) {
    const response = await fetch('https://control.msg91.com/api/v5/flow/', { method: 'POST', headers: { authkey: process.env.MSG91_AUTH_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, sender: process.env.MSG91_SENDER_ID, recipients: [{ mobiles: mobile.replace('+', ''), otp: code }] }) });
    if (!response.ok) throw new Error('SMS delivery failed');
    return 'msg91';
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Configure Twilio or MSG91 to send verification codes');
  console.info(`[Bizearch demo OTP] ${mobile}: ${code}`);
  return 'development';
}
