"use strict";

const nodemailer = require("nodemailer");
const { query } = require("../config/database");


/*
|--------------------------------------------------------------------------
| EMAIL SERVICE
|--------------------------------------------------------------------------
|
| Provider-neutral email service.
|
| Uses SMTP so the school can later use:
| - Gmail / Google Workspace
| - Microsoft 365 / Outlook
| - Business-domain SMTP
| - Other SMTP providers
|
| SMTP credentials are read from .env.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getRequiredEnvironmentVariable(name) {

    const value = String(
        process.env[name] || ""
    ).trim();

    if (!value) {
        throw new Error(
            `${name} is not configured.`
        );
    }

    return value;
}


function getSmtpPort() {

    const port = Number(
        process.env.SMTP_PORT || 587
    );

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(
            "SMTP_PORT must be a valid port number."
        );
    }

    return port;
}


function getSmtpSecure() {

    return String(
        process.env.SMTP_SECURE || ""
    )
        .trim()
        .toLowerCase() === "true";
}


/*
|--------------------------------------------------------------------------
| Create Transporter
|--------------------------------------------------------------------------
*/

function createTransporter() {

    const host =
        getRequiredEnvironmentVariable(
            "SMTP_HOST"
        );

    const user =
        getRequiredEnvironmentVariable(
            "SMTP_USER"
        );

    const password =
        getRequiredEnvironmentVariable(
            "SMTP_PASSWORD"
        );

    return nodemailer.createTransport({

        host,

        port: getSmtpPort(),

        secure: getSmtpSecure(),

        auth: {
            user,
            pass: password
        }

    });
}


/*
|--------------------------------------------------------------------------
| Verify SMTP Configuration
|--------------------------------------------------------------------------
*/

async function verifyEmailConfiguration() {

    const transporter =
        createTransporter();

    await transporter.verify();

    return true;
}


/*
|--------------------------------------------------------------------------
| Get School Guardian Emails
|--------------------------------------------------------------------------
|
| For school-wide announcements:
|
| - Only guardians belonging to the school are selected.
| - Blank emails are ignored.
| - Duplicate email addresses are removed.
|
|--------------------------------------------------------------------------
*/

async function getSchoolGuardianEmails(
    schoolId
) {

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const result = await query(
        `
        SELECT DISTINCT
            LOWER(TRIM(g.email)) AS email
        FROM guardians g
        WHERE g.school_id = $1
          AND g.email IS NOT NULL
          AND TRIM(g.email) <> ''
        ORDER BY LOWER(TRIM(g.email))
        `,
        [schoolId]
    );

    return result.rows
        .map(row => row.email)
        .filter(Boolean);
}


/*
|--------------------------------------------------------------------------
| Send Email
|--------------------------------------------------------------------------
*/

async function sendEmail({
    to,
    subject,
    text,
    html
}) {

    if (!to) {
        throw new Error(
            "Recipient email is required."
        );
    }

    if (!subject || !String(subject).trim()) {
        throw new Error(
            "Email subject is required."
        );
    }

    if (
        (!text || !String(text).trim()) &&
        (!html || !String(html).trim())
    ) {
        throw new Error(
            "Email content is required."
        );
    }

    const transporter =
        createTransporter();

    const fromAddress =
        getRequiredEnvironmentVariable(
            "MAIL_FROM"
        );

    const fromName =
        String(
            process.env.MAIL_FROM_NAME ||
            "School Management System"
        ).trim();

    const mailOptions = {

        from: `"${fromName}" <${fromAddress}>`,

        to,

        subject: String(subject).trim(),

        text:
            text
                ? String(text)
                : undefined,

        html:
            html
                ? String(html)
                : undefined

    };

    return transporter.sendMail(
        mailOptions
    );
}


/*
|--------------------------------------------------------------------------
| Send Announcement To Guardians
|--------------------------------------------------------------------------
|
| Sends one school-wide announcement to all
| registered guardian email addresses.
|
| Each guardian email is included once.
|
|--------------------------------------------------------------------------
*/

async function sendAnnouncementToGuardians({
    schoolId,
    title,
    content
}) {

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (!title || !String(title).trim()) {
        throw new Error(
            "Announcement title is required."
        );
    }

    if (!content || !String(content).trim()) {
        throw new Error(
            "Announcement content is required."
        );
    }

    const guardianEmails =
        await getSchoolGuardianEmails(
            schoolId
        );

    if (guardianEmails.length === 0) {

        return {
            sent: 0,
            recipients: 0,
            message:
                "No registered guardian email addresses were found."
        };

    }

    const subject =
        `School Announcement: ${String(title).trim()}`;

    const plainText =
        [
            String(title).trim(),
            "",
            String(content).trim(),
            "",
            "This message was sent by the school management system."
        ].join("\n");

    const htmlContent =
        String(content)
            .trim()
            .replace(/\r?\n/g, "<br>");

    const html =
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(String(title).trim())}</title>
        </head>

        <body style="
            margin:0;
            padding:0;
            background:#f5f7fa;
            font-family:Arial,Helvetica,sans-serif;
        ">

            <div style="
                max-width:680px;
                margin:30px auto;
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:8px;
                overflow:hidden;
            ">

                <div style="
                    padding:24px;
                    background:#f8fafc;
                    border-bottom:1px solid #e5e7eb;
                ">

                    <h1 style="
                        margin:0;
                        font-size:22px;
                        color:#1f2937;
                    ">
                        ${escapeHtml(String(title).trim())}
                    </h1>

                </div>

                <div style="
                    padding:24px;
                    color:#374151;
                    font-size:15px;
                    line-height:1.7;
                ">

                    ${htmlContent}

                </div>

                <div style="
                    padding:16px 24px;
                    background:#f8fafc;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                    font-size:12px;
                ">

                    This message was sent by the school management system.

                </div>

            </div>

        </body>
        </html>
        `;

    const result =
        await sendEmail({
            to: guardianEmails,
            subject,
            text: plainText,
            html
        });

    return {
        sent: 1,
        recipients: guardianEmails.length,
        messageId: result.messageId,
        message:
            `Announcement email sent to ${guardianEmails.length} guardian email address(es).`
    };
}


/*
|--------------------------------------------------------------------------
| HTML Escape
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {

    verifyEmailConfiguration,

    getSchoolGuardianEmails,

    sendEmail,

    sendAnnouncementToGuardians

};