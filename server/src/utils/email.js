const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { escapeHtml } = require("./helpers");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

const HEADER = `
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#d4a853;font-size:24px;margin:0;">BATRA TECHNOLOGIES</h1>
  </div>`;

const FOOTER = `
  <p style="color:#666;font-size:12px;margin:24px 0 0;text-align:center;">Batra Technologies — Premium Electronics</p>`;

async function sendOTPEmail(to, code, name) {
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your Email — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 8px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 24px;">Use the following OTP to verify your email address:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;background:#d4a853;color:#0a0a0a;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:12px;">${escapeHtml(code)}</span>
        </div>
        <p style="color:#666;font-size:12px;margin:24px 0 0;">This OTP expires in 5 minutes. If you did not create an account, please ignore this email.</p>
      </div>
    `,
  });
}

async function sendOrderConfirmation(to, name, order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemList = items.map((i) => {
    const product = i.product || i;
    const qty = i.quantity || 1;
    const price = product.price || 0;
    const title = product.name || "Product";
    return `
      <tr>
        <td style="padding:10px 0;color:#ccc;font-size:13px;border-bottom:1px solid #222;">${escapeHtml(title)}</td>
        <td style="padding:10px 0;color:#999;font-size:13px;border-bottom:1px solid #222;text-align:center;">${escapeHtml(String(qty))}</td>
        <td style="padding:10px 0;color:#d4a853;font-size:13px;border-bottom:1px solid #222;text-align:right;">₹${(price * qty).toLocaleString("en-IN")}</td>
      </tr>`;
  }).join("");

  const total = Number(order.totalAmount) || 0;

  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Placed — #${order.id.slice(-8).toUpperCase()} — Batra Technologies`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <div style="background:#1a1a0a;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:2px;">Order Placed</p>
          <p style="color:#d4a853;font-size:28px;font-weight:bold;margin:8px 0 4px;">#${order.id.slice(-8).toUpperCase()}</p>
          <p style="color:#666;font-size:12px;margin:0;">${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">Your order has been placed. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr style="border-bottom:1px solid #333;">
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Item</td>
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</td>
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Price</td>
          </tr>
          ${itemList}
        </table>
        <div style="border-top:1px solid #333;padding-top:16px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#999;font-size:13px;">Subtotal</span>
            <span style="color:#fff;font-size:13px;">₹${total.toLocaleString("en-IN")}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#999;font-size:13px;">Shipping</span>
            <span style="color:#fff;font-size:13px;">${total >= 4999 ? "Free" : "₹99"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#999;font-size:13px;">GST (18%)</span>
            <span style="color:#fff;font-size:13px;">₹${Math.round(total * 0.18).toLocaleString("en-IN")}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #333;">
            <span style="color:#d4a853;font-size:15px;font-weight:bold;">Total</span>
            <span style="color:#d4a853;font-size:15px;font-weight:bold;">₹${total.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Shipping To</p>
          <p style="color:#fff;font-size:13px;margin:0;">${escapeHtml(order.shippingName)}</p>
          <p style="color:#999;font-size:13px;margin:4px 0 0;">${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} — ${escapeHtml(order.shippingPincode)}</p>
        </div>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Payment Method</p>
          <p style="color:#d4a853;font-size:14px;font-weight:bold;margin:0;">Online Payment (UPI)</p>
        </div>
        <div style="background:#1a1a0a;border:1px solid #d4a85344;border-radius:12px;padding:16px;margin-top:16px;text-align:center;">
          <p style="color:#d4a853;font-size:13px;font-weight:bold;margin:0 0 4px;">Action Required</p>
          <p style="color:#999;font-size:12px;margin:0;line-height:1.6;">Complete your online payment within 24 hours of placing this order. Your order will be confirmed once payment is approved. If payment is not confirmed within 24 hours, the order will be cancelled automatically.</p>
        </div>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendPaymentApprovedEmail(to, name, order) {
  if (!to) return;
  const total = Number(order.totalAmount) || 0;
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Payment Approved — #${order.id.slice(-8).toUpperCase()} — Batra Technologies`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <div style="background:#0a1a0f;border:1px solid #22c55e44;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="color:#666;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:2px;">Order #${order.id.slice(-8).toUpperCase()}</p>
          <div style="display:inline-block;background:#22c55e22;color:#22c55e;font-size:16px;font-weight:bold;padding:8px 24px;border-radius:8px;margin-top:12px;border:1px solid #22c55e44;">
            Payment Approved
          </div>
        </div>
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">Your payment of <strong style="color:#d4a853;">₹${total.toLocaleString("en-IN")}</strong> has been approved. Your order is now confirmed and will be shipped soon.</p>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Total Paid</p>
          <p style="color:#d4a853;font-size:18px;font-weight:bold;margin:0;">₹${total.toLocaleString("en-IN")}</p>
        </div>
        <p style="color:#666;font-size:12px;margin:0;text-align:center;">Track your order on the Batra Technologies website.</p>
        ${FOOTER}
      </div>
    `,
  });
}

const STATUS_LABELS = {
  confirmed: { text: "Confirmed", color: "#3b82f6" },
  pending: { text: "Pending", color: "#eab308" },
  shipped: { text: "Shipped", color: "#a855f7" },
  out_for_delivery: { text: "Out for Delivery", color: "#f59e0b" },
  delivered: { text: "Delivered", color: "#22c55e" },
  cancelled: { text: "Cancelled", color: "#ef4444" },
  return_requested: { text: "Return Requested", color: "#eab308" },
  return_pickup_out: { text: "Return Pickup Out", color: "#f59e0b" },
  returned: { text: "Returned", color: "#a855f7" },
};

async function sendOrderStatusUpdate(to, name, order, oldStatus) {
  const statusInfo = STATUS_LABELS[order.status] || { text: order.status, color: "#999" };
  const total = Number(order.totalAmount) || 0;

  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order ${statusInfo.text} — #${order.id.slice(-8).toUpperCase()} — Batra Technologies`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <div style="background:#1a1a0a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
          <p style="color:#666;font-size:12px;margin:0;text-transform:uppercase;letter-spacing:2px;">Order #${order.id.slice(-8).toUpperCase()}</p>
          <div style="display:inline-block;background:${statusInfo.color}22;color:${statusInfo.color};font-size:16px;font-weight:bold;padding:8px 24px;border-radius:8px;margin-top:12px;border:1px solid ${statusInfo.color}44;">
            ${escapeHtml(statusInfo.text)}
          </div>
        </div>
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">Your order status has been updated from <strong style="color:#fff;">${escapeHtml(oldStatus)}</strong> to <strong style="color:${statusInfo.color};">${escapeHtml(statusInfo.text)}</strong>.</p>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Shipping To</p>
          <p style="color:#fff;font-size:13px;margin:0;">${escapeHtml(order.shippingName)}</p>
          <p style="color:#999;font-size:13px;margin:4px 0 0;">${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} — ${escapeHtml(order.shippingPincode)}</p>
        </div>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Total Amount</p>
          <p style="color:#d4a853;font-size:18px;font-weight:bold;margin:0;">₹${total.toLocaleString("en-IN")}</p>
        </div>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendQueryReply(to, name, subject, replyMessage, originalMessage) {
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Re: ${escapeHtml(subject)} — Batra Technologies`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 24px;">Thank you for reaching out to us. Here is our response to your query:</p>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your Original Message</p>
          <p style="color:#999;font-size:13px;margin:0;white-space:pre-wrap;">${escapeHtml(originalMessage)}</p>
        </div>
        <div style="background:#1a1a0a;border:1px solid #d4a85344;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Our Response</p>
          <p style="color:#d4a853;font-size:14px;margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(replyMessage)}</p>
        </div>
        <p style="color:#666;font-size:12px;margin:0;">If you have further questions, feel free to contact us again.</p>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendResetPasswordEmail(to, code, name) {
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your Password — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 8px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 24px;">We received a request to reset your password. Use the following OTP to proceed:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;background:#d4a853;color:#0a0a0a;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:12px;">${escapeHtml(code)}</span>
        </div>
        <p style="color:#666;font-size:12px;margin:24px 0 0;">This OTP expires in 5 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
  });
}

async function sendPasswordChangedEmail(to, name, method, ipAddress) {
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Password Was Changed — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);">
            <span style="font-size:28px;">🔒</span>
          </div>
        </div>
        <p style="color:#999;font-size:14px;margin:0 0 8px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#fff;font-size:14px;margin:0 0 20px;">Your password has been successfully changed.</p>
        <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Change Details</p>
          <div style="margin-bottom:8px;">
            <span style="color:#666;font-size:12px;">Method: </span>
            <span style="color:#d4a853;font-size:12px;font-weight:bold;">${escapeHtml(method)}</span>
          </div>
          ${ipAddress ? `<div style="margin-bottom:8px;">
            <span style="color:#666;font-size:12px;">IP Address: </span>
            <span style="color:#fff;font-size:12px;">${escapeHtml(ipAddress)}</span>
          </div>` : ""}
          <div>
            <span style="color:#666;font-size:12px;">Time: </span>
            <span style="color:#fff;font-size:12px;">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:#ef4444;font-size:13px;font-weight:bold;margin:0 0 6px;">⚠ Was this you?</p>
          <p style="color:#999;font-size:12px;margin:0;line-height:1.6;">If you did NOT change your password, your account may be compromised. Contact us immediately:</p>
          <p style="color:#d4a853;font-size:13px;font-weight:bold;margin:8px 0 0;">📧 batra.ronit.08.11@gmail.com &nbsp;|&nbsp; 📞 9351396757</p>
        </div>
        <p style="color:#666;font-size:12px;margin:0;">If this was you, no further action is needed.</p>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendAdminEmail(to, name, subject, message) {
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${escapeHtml(subject)} — Batra Technologies`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">You have received a message from the Batra Technologies team:</p>
        <div style="background:#1a1a0a;border:1px solid #d4a85344;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#d4a853;font-size:13px;font-weight:bold;margin:0 0 8px;">${escapeHtml(subject)}</p>
          <p style="color:#ccc;font-size:13px;margin:0;white-space:pre-wrap;line-height:1.7;">${escapeHtml(message)}</p>
        </div>
        <p style="color:#666;font-size:12px;margin:0;">If you have any questions, feel free to reply to this email or contact us through the app.</p>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendDeliveryCodeEmail(to, name, code, deliveryPersonName) {
  if (!to) return;
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Delivery Verification Code — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">Your order is out for delivery! Please share this code with the delivery executive:</p>
        <div style="text-align:center;background:#1a1a0a;border:1px solid #d4a85344;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:#d4a853;font-size:32px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p>
        </div>
        <p style="color:#666;font-size:13px;margin:0 0 4px;">Delivery by: ${escapeHtml(deliveryPersonName)}</p>
        <p style="color:#666;font-size:12px;margin:0;">Do not share this code with anyone except the delivery executive.</p>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendReturnCodeEmail(to, name, code, deliveryPersonName) {
  if (!to) return;
  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Return Pickup Verification Code — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">A delivery executive is coming to pick up your return. Please share this code with them:</p>
        <div style="text-align:center;background:#1a1a0a;border:1px solid #a855f744;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:#a855f7;font-size:32px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p>
        </div>
        <p style="color:#666;font-size:13px;margin:0 0 4px;">Pickup by: ${escapeHtml(deliveryPersonName)}</p>
        <p style="color:#666;font-size:12px;margin:0;">Do not share this code with anyone except the delivery executive.</p>
        ${FOOTER}
      </div>
    `,
  });
}

async function sendAbandonedCartEmail(to, name, items) {
  if (!to) return;
  const itemList = (items || []).slice(0, 5).map((i) =>
    `<tr><td style="padding:8px 0;color:#ccc;font-size:13px;border-bottom:1px solid #222;">${escapeHtml(i.name || "Product")}</td><td style="padding:8px 0;color:#999;font-size:13px;border-bottom:1px solid #222;text-align:center;">${escapeHtml(String(i.quantity || 1))}</td><td style="padding:8px 0;color:#d4a853;font-size:13px;border-bottom:1px solid #222;text-align:right;">₹${((i.price || 0) * (i.quantity || 1)).toLocaleString("en-IN")}</td></tr>`
  ).join("");

  await transporter.sendMail({
    from: `"Batra Technologies" <${process.env.EMAIL_USER}>`,
    to,
    subject: "You left something in your cart! — Batra Technologies",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;border-radius:16px;">
        ${HEADER}
        <p style="color:#999;font-size:14px;margin:0 0 4px;">Hello ${escapeHtml(name)},</p>
        <p style="color:#999;font-size:14px;margin:0 0 20px;">You left these items in your cart. Complete your order before they go out of stock!</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr style="border-bottom:1px solid #333;">
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Item</td>
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</td>
            <td style="padding:8px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Price</td>
          </tr>
          ${itemList}
        </table>
        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.PRODUCTION_URL || "https://batratechnologies.vercel.app"}/cart" style="display:inline-block;background:#d4a853;color:#0a0a0a;font-size:14px;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;">Return to Cart</a>
        </div>
        <p style="color:#666;font-size:12px;margin:24px 0 0;text-align:center;">Your cart will be saved for 7 days. Don't miss out!</p>
        ${FOOTER}
      </div>
    `,
  });
}

module.exports = { generateOTP, sendOTPEmail, sendOrderConfirmation, sendPaymentApprovedEmail, sendOrderStatusUpdate, sendQueryReply, sendResetPasswordEmail, sendPasswordChangedEmail, sendAdminEmail, sendDeliveryCodeEmail, sendReturnCodeEmail, sendAbandonedCartEmail };
