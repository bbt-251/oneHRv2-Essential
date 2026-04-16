import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

// Try with Gmail SMTP for testing (requires app password)
// Note: For production, use your existing OVH configuration
const auth = {
    user: "noreply@onehr.solutions",
    pass: "noreply_123",
};

export async function POST(req: NextRequest) {
    try {
        const { email, subject, html, attachments } = await req.json();

        console.log("Email API received request:", {
            email,
            subject,
            hasHtml: !!html,
            attachmentCount: attachments?.length || 0,
        });

        if (!email || !subject || !html) {
            const errorMsg = "Missing required fields: email, subject, or html";
            console.error(errorMsg, { email, subject, html });
            return NextResponse.json(
                {
                    message: errorMsg,
                },
                { status: 400 },
            );
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.mail.ovh.net",
            port: 465,
            secure: true,
            auth: auth,
            debug: true,
            logger: true,
            tls: {
                rejectUnauthorized: false,
            },
        } as nodemailer.TransportOptions);

        // Verify connection configuration
        try {
            const verifyResult = await transporter.verify();
            console.log("SMTP connection verified:", verifyResult);
        } catch (verifyError) {
            console.error("SMTP connection verification failed:", verifyError);
            return NextResponse.json(
                {
                    message: "SMTP connection failed",
                    error: verifyError instanceof Error ? verifyError.message : "Unknown error",
                },
                { status: 500 },
            );
        }

        const mailOptions: any = {
            from: '"oneHR" <noreply@onehr.solutions>',
            to: email,
            subject: subject,
            html: JSON.parse(JSON.stringify(html)),
            // Improve email deliverability
            replyTo: '"HR Department" <noreply@onehr.solutions>',
            messageId: `<${Date.now()}-${Math.random().toString(36).substring(2, 10)}@onehr.solutions>`,
            date: new Date(),
            encoding: "utf-8",
            // Additional headers to improve deliverability
            headers: {
                "X-Priority": "3",
                "X-Mailer": "OneHR Notification System",
                "Content-Language": "en",
                "List-Unsubscribe": "<mailto:unsubscribe@onehr.solutions>",
                Precedence: "bulk",
            },
        };

        // Log the complete mail options for debugging
        console.log("=== Complete Mail Options ===");
        console.log("From:", mailOptions.from);
        console.log("To:", mailOptions.to);
        console.log("Subject:", mailOptions.subject);
        console.log("HTML Length:", mailOptions.html.length);
        console.log("Reply To:", mailOptions.replyTo);
        console.log("Message ID:", mailOptions.messageId);
        console.log("Date:", mailOptions.date);
        console.log(
            "Attachments:",
            mailOptions.attachments?.map((a: any) => ({
                filename: a.filename,
                size: a.content?.length || 0,
                contentType: a.contentType,
            })) || [],
        );

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
            console.log(
                "Email attachments:",
                attachments.map((att: any) => ({
                    filename: att.filename,
                    size: att.content?.length || 0,
                    encoding: att.encoding,
                    contentType: att.contentType,
                })),
            );
        }

        console.log("Attempting to send email with options:", mailOptions);

        const result = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully:", result);

        return NextResponse.json({
            message: "Email sent successfully",
            result,
        });
    } catch (error) {
        console.error("Email sending error:", error);
        return NextResponse.json(
            {
                message: "Error sending email",
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : "No stack trace",
            },
            { status: 500 },
        );
    }
}
