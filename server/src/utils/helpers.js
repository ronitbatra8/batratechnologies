function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeErrorMessage(err) {
  if (process.env.NODE_ENV === "production") {
    return "An internal error occurred";
  }
  return err.message || "An internal error occurred";
}

function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;
  const blocked = [
    "tempmail.com", "throwaway.com", "fakemail.com", "test.com", "example.com",
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "temp-mail.org",
    "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "dispostable.com", "yopmail.com", "yopmail.fr", "maildrop.cc",
    "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.org",
    "tempail.com", "tempalias.com", "tempr.email", "tempinbox.com",
    "discard.email", "discardmail.com", "discardmail.de",
    "mailcatch.com", "mailexpire.com", "mailnull.com",
    "mohmal.com", "getnada.com", "emailondeck.com",
    "tmpmail.net", "tmpmail.org", "tmpmail2.com",
    "harakirimail.com", "tmail.ws", "tmail.io",
    "minutemail.com", "temple.email", "tempmailer.com",
    "binkmail.com", "bobmail.info", "chammy.info",
    "devnullmail.com", "letthemeatspam.com", "lopl.co",
    "msa.minitime.com", "nwldx.com", "objectmail.com",
    "proxymail.eu", "rcpt.at", "reallymymail.com",
    "recode.me", "regbypass.com", "safe-mail.net",
    "safetymail.info", "sandelf.de", "saynotospams.com",
    "scatmail.com", "slaskpost.se", "slipry.net",
    "sogetthis.com", "soodonims.com", "spam4.me",
    "spamex.com", "mailzilla.com", "bm- email.com",
    "lroid.com", "kook.ml", "zaiko.ml",
    "dbzer0.com", "armyspy.com", "cuvox.de",
    "dayrep.com", "einrot.com", "fleckens.hu",
    "gustr.com", "jourrapide.com", "rhyta.com",
    "superrito.com", "teleworm.us",
  ];
  const domain = email.split("@")[1]?.toLowerCase();
  return domain && !blocked.includes(domain);
}

function isEmail(input) {
  return input && input.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function isPhone(input) {
  if (!input) return false;
  const cleaned = input.replace(/[\s\-\(\)+]/g, "");
  const num = cleaned.startsWith("91") && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
  return /^[6-9]\d{9}$/.test(num);
}

function normalizePhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)+]/g, "");
  return cleaned.startsWith("91") && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
}

const VALID_ORDER_STATUSES = ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"];
const VALID_MESSAGE_STATUSES = ["pending", "in-progress", "replied", "resolved"];

module.exports = { escapeHtml, safeErrorMessage, validateEmail, isEmail, isPhone, normalizePhone, VALID_ORDER_STATUSES, VALID_MESSAGE_STATUSES };
