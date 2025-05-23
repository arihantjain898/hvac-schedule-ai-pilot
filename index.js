const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const { format, parse, isValid } = require('date-fns');

// Explicitly provide the project ID when creating the client
const secretClient = new SecretManagerServiceClient({
  projectId: 'blaz-request-booth', // Replace with your actual project ID if different
});

const app = express();
app.use(bodyParser.json());

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@spacesquare.dev'; // Use your alias here if desired

async function getServiceAccountKey() {
  const [version] = await secretClient.accessSecretVersion({
    name: 'projects/blaz-request-booth/secrets/SA_KEY/versions/latest'
  });
  return JSON.parse(version.payload.data.toString());
}

// Helper function to format date if it's a valid date string
function formatDateIfValid(dateString) {
  try {
    // Check if it's a valid date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // Check if the year is mentioned in the original string
      if (dateString.includes(date.getFullYear().toString())) {
        return format(date, 'MMM dd, yyyy');
      } else {
        return format(date, 'MMM dd');
      }
    }
    return dateString; // Return original if not valid
  } catch (error) {
    return dateString; // Return original on error
  }
}

app.post('/', async (req, res) => {
  const pubsubMessage = req.body.message;
  if (!pubsubMessage || !pubsubMessage.data) {
    console.log('No Pub/Sub message data received.'); // Added logging for clarity
    return res.status(204).send('No message data, but acknowledged.'); // Use 204 for no content, successful processing of no data
  }

  let bookingData;
  try {
    const raw = Buffer.from(pubsubMessage.data, 'base64').toString();
    bookingData = JSON.parse(raw);
    console.log('Received booking data for internal notification:', bookingData); // Added logging
  } catch (error) {
    console.error('⚠️ Invalid JSON in Pub/Sub message:', error);
    return res.status(200).send('Bad JSON, message acknowledged.'); // Acknowledge bad data to prevent retries
  }

  // --- Crucial: Ensure basic data for internal email ---
  if (!bookingData || !bookingData.name || !bookingData.event_name) {
    console.error('⚠️ Booking data is missing essential fields for internal notification.');
    return res.status(200).send('Missing essential data, message acknowledged.');
  }

  let serviceAccountKey;
  try {
    serviceAccountKey = await getServiceAccountKey();
  } catch (error) {
    console.error('❌ Secret Manager error:', error);
    // Don't send 500 repeatedly if it's a persistent auth issue.
    // Pub/Sub will retry, but if the secret is misconfigured,
    // it might be better to acknowledge after a few tries or use dead-lettering.
    // For now, a 500 will cause Pub/Sub to retry.
    return res.status(500).send('Secret Manager error');
  }

  const authClient = new google.auth.JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: SENDER_EMAIL // The email address of the user the application is acting on behalf of
  });

  const gmailClient = google.gmail({ version: 'v1', auth: authClient });

  const {
    name,
    email,
    phone,
    event_name: event,
    event_date: dateRaw,
    number_of_people: attendees,
    special_instructions: notes = 'None',
  } = bookingData;

  // Format the date if it's valid
  const date = formatDateIfValid(dateRaw);

  // Get current date (without time) for the notification timestamp
  const currentDate = format(new Date(), 'MMM dd, yyyy');

  // Construct the email subject without emojis and with name and event
  const subject = `Bläz Booking: New Request from ${name} for ${event}`;
  const from = `=?UTF-8?B?${Buffer.from('Bläz Notifications').toString('base64')}?= <${SENDER_EMAIL}>`;
  const to = 'arihantjain898@gmail.com'; // Your internal recipient

  // --- ENHANCED PROFESSIONAL EMAIL DESIGN ---
  const message = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booth Request Notification</title>
    <style type="text/css">
        /* Reset styles */
        body, html { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { padding: 0; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        /* Base styles */
        body, table, td, p, a, li, blockquote { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            color: #333333; 
            font-size: 14px; /* Reduced from 16px */
        }
        
        /* Container styles */
        .email-container {
            max-width: 600px; /* Reduced from 650px */
            margin: auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* Header styles */
        .header {
            background: linear-gradient(135deg, #0062E6, #33A8FF);
            padding: 20px; /* Reduced from 30px */
            text-align: left;
            color: #ffffff;
        }
        
        .logo-area {
            display: flex;
            align-items: center;
            margin-bottom: 10px; /* Reduced from 15px */
        }
        
        .logo-circle {
            width: 35px; /* Reduced from 40px */
            height: 35px; /* Reduced from 40px */
            background-color: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px; /* Reduced from 15px */
            font-weight: 700;
            color: #0062E6;
            font-size: 16px; /* Reduced from 18px */
        }
        
        .header h1 {
            margin: 0;
            font-size: 20px; /* Reduced from 24px */
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .timestamp {
            font-size: 12px; /* Reduced from 14px */
            margin-top: 6px; /* Reduced from 8px */
            color: rgba(255, 255, 255, 0.9);
            font-weight: 400;
        }
        
        /* Content styles */
        .content {
            padding: 25px; /* Reduced from 35px */
        }
        
        .intro {
            font-size: 14px; /* Reduced from 16px */
            line-height: 1.5; /* Reduced from 1.6 */
            margin-bottom: 20px; /* Reduced from 25px */
            color: #333333;
        }
        
        /* Card styles */
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e5e9f2;
            border-left: 4px solid #0062E6;
            border-radius: 6px;
            padding: 15px; /* Reduced from 25px */
            margin-bottom: 20px; /* Reduced from 30px */
        }
        
        .card-title {
            font-size: 16px; /* Reduced from 18px */
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 15px; /* Reduced from 20px */
            color: #0062E6;
        }
        
        /* Data grid styles */
        .data-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }
        
        .data-grid tr:not(:last-child) {
            border-bottom: 1px solid #e5e9f2;
        }
        
        .data-grid th, .data-grid td {
            padding: 8px 12px; /* Reduced from 12px 15px */
            text-align: left;
            vertical-align: top;
        }
        
        .data-grid th {
            width: 120px; /* Reduced from 180px */
            color: #6c757d;
            font-weight: 500;
            background-color: rgba(0, 98, 230, 0.03);
        }
        
        .data-grid td {
            color: #333333;
            font-weight: 400;
        }
        
        .highlight {
            color: #0062E6;
            font-weight: 500;
        }
        
        .note-section {
            background-color: #fff9e6;
            border: 1px solid #ffecb3;
            border-radius: 6px;
            padding: 12px; /* Reduced from 15px */
            margin-top: 20px; /* Reduced from 25px */
        }
        
        .note-title {
            color: #856404;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 8px; /* Reduced from 10px */
            font-size: 14px; /* Reduced from 16px */
        }
        
        .note-content {
            color: #6c584c;
            font-style: italic;
            margin: 0;
        }
        
        /* Call to action button */
        .cta-container {
            text-align: center;
            margin: 20px 0; /* Reduced from 30px */
        }
        
        .cta-button {
            background-color: #0062E6;
            color: #ffffff !important;
            padding: 10px 20px; /* Reduced from 12px 24px */
            border-radius: 4px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            text-align: center;
            transition: background-color 0.3s;
            font-size: 14px; /* Added size */
        }
        
        .cta-button:hover {
            background-color: #0056CC;
        }
        
        /* Footer styles */
        .footer {
            background-color: #f8fafc;
            padding: 15px; /* Reduced from 20px */
            text-align: center;
            border-top: 1px solid #e5e9f2;
        }
        
        .footer-text {
            color: #6c757d;
            font-size: 12px; /* Reduced from 14px */
            margin: 0;
        }
        
        .blaz-tag {
            font-weight: 600;
            color: #0062E6;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 600px) {
            .header, .content, .footer {
                padding: 15px !important; /* Further reduced */
            }
            
            .info-card {
                padding: 12px !important; /* Further reduced */
            }
            
            /* Modified mobile styles to keep headers and values on same line */
            .data-grid th, .data-grid td {
                display: table-cell;
                padding: 6px 8px; /* Further reduced */
                font-size: 12px;
            }
            
            .data-grid th {
                width: 35% !important;
            }
            
            .data-grid tr {
                margin-bottom: 4px;
                display: table-row;
            }
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f7fa;">
    <!-- Preview Text -->
    <div style="display: none; max-height: 0px; overflow: hidden;">
        New booking request from ${name} for ${event} - Review needed
    </div>
    
    <center style="width: 100%; background-color: #f4f7fa; padding: 20px 0;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;">
            <!-- Header -->
            <tr>
                <td class="header" style="background: linear-gradient(135deg, #0062E6, #33A8FF); padding: 20px; text-align: left; color: #ffffff;">
                    <div class="logo-area" style="display: block; margin-bottom: 10px;">
                        <div class="logo-circle" style="width: 35px; height: 35px; background-color: white; border-radius: 50%; display: inline-block; text-align: center; line-height: 35px; margin-right: 10px; font-weight: 700; color: #0062E6; font-size: 16px;">B</div>
                        <span style="font-weight: 700; font-size: 18px; vertical-align: middle;">Bläz Entertainment</span>
                    </div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">New Booking Request</h1>
                    <p class="timestamp" style="font-size: 12px; margin-top: 6px; color: rgba(255, 255, 255, 0.9); font-weight: 400;">Received on ${currentDate}</p>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content" style="padding: 25px; background-color: #ffffff;">
                    <p class="intro" style="font-size: 14px; line-height: 1.5; margin-bottom: 20px; color: #333333;">
                        Hello Bläz Team,<br><br>
                        A new booth booking request has been submitted that requires your attention. Here are the details:
                    </p>
                    
                    <!-- Customer Information Card -->
                    <div class="info-card" style="background-color: #f8fafc; border: 1px solid #e5e9f2; border-left: 4px solid #0062E6; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                        <h3 class="card-title" style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 15px; color: #0062E6;">Customer Information</h3>
                        
                        <table class="data-grid" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0;">
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03); border-bottom: 1px solid #e5e9f2;">Full Name:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 600; border-bottom: 1px solid #e5e9f2;">${name}</td>
                            </tr>
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03); border-bottom: 1px solid #e5e9f2;">Email:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 400; border-bottom: 1px solid #e5e9f2;">
                                    <a href="mailto:${email}" style="color: #0062E6; text-decoration: none;">${email}</a>
                                </td>
                            </tr>
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03);">Phone:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 400;">
                                    <a href="tel:${phone}" style="color: #0062E6; text-decoration: none;">${phone}</a>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Event Details Card -->
                    <div class="info-card" style="background-color: #f8fafc; border: 1px solid #e5e9f2; border-left: 4px solid #0062E6; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                        <h3 class="card-title" style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 15px; color: #0062E6;">Event Details</h3>
                        
                        <table class="data-grid" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0;">
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03); border-bottom: 1px solid #e5e9f2;">Event Name:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 600; border-bottom: 1px solid #e5e9f2;">${event}</td>
                            </tr>
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03); border-bottom: 1px solid #e5e9f2;">Event Date:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 500; border-bottom: 1px solid #e5e9f2;">
                                    <span class="highlight" style="color: #0062E6; font-weight: 500;">${date}</span>
                                </td>
                            </tr>
                            <tr>
                                <th style="padding: 8px 12px; text-align: left; vertical-align: top; width: 120px; color: #6c757d; font-weight: 500; background-color: rgba(0, 98, 230, 0.03);">Attendees:</th>
                                <td style="padding: 8px 12px; text-align: left; vertical-align: top; color: #333333; font-weight: 400;">${attendees}</td>
                            </tr>
                        </table>
                        
                        ${notes && notes !== 'None' ? `
                        <div class="note-section" style="background-color: #fff9e6; border: 1px solid #ffecb3; border-radius: 6px; padding: 12px; margin-top: 20px;">
                            <h4 class="note-title" style="color: #856404; font-weight: 600; margin-top: 0; margin-bottom: 8px; font-size: 14px;">Special Instructions:</h4>
                            <p class="note-content" style="color: #6c584c; font-style: italic; margin: 0; font-size: 13px;">${notes}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Call to Action -->
                    <div class="cta-container" style="text-align: center; margin: 20px 0;">
                        <a href="https://docs.google.com/spreadsheets/d/1rCPlnoSoqCXVzg0yVzqkPublXpuwEbLYKJQG7mcAed8/edit?gid=0#gid=0" class="cta-button" style="background-color: #0062E6; color: #ffffff !important; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: 600; display: inline-block; text-align: center; font-size: 14px;">
                            Review In Admin Portal
                        </a>
                    </div>
                    
                    <p style="margin-top: 20px; line-height: 1.5; font-size: 13px;">
                        Please respond to the customer within 24 hours to confirm the booking or request more information.
                    </p>
                    
                    <p style="line-height: 1.5; margin-bottom: 0; font-size: 13px;">
                        Best regards,<br>
                        <strong>Bläz Notification System</strong>
                    </p>
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td class="footer" style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e5e9f2;">
                    <p class="footer-text" style="color: #6c757d; font-size: 12px; margin: 0;">
                        This is an automated notification from the <span class="blaz-tag" style="font-weight: 600; color: #0062E6;">Bläz</span> Booking System.<br>
                        &copy; ${new Date().getFullYear()} Bläz Entertainment. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
  `;

  const rawMessage = Buffer.from(
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=\r\n` +
    `\r\n` +
    message
  ).toString('base64url');

  try {
    await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });
    console.log(`✅ Internal HTML email notification sent for booking by: ${name}`);
    res.status(200).send(`Internal HTML email notification sent for booking by: ${name}`);
  } catch (error) {
    console.error('❌ Gmail API error:', error.response ? error.response.data : error.message); // Improved error logging
    res.status(500).send('Failed to send internal HTML email notification');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});
