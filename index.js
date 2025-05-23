const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const { format } = require('date-fns');

// Explicitly provide the project ID when creating the client
const secretClient = new SecretManagerServiceClient({
  projectId: 'blaz-request-booth', // Replace with your actual project ID if different
});

const app = express();
app.use(bodyParser.json());

// This can be the same sender as your other function
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'info@spacesquare.dev';
const SENDER_NAME = 'Bläz Booking System'; // Or whatever you'd like the "From" name to be for users

async function getServiceAccountKey() {
  const [version] = await secretClient.accessSecretVersion({
    name: 'projects/blaz-request-booth/secrets/SA_KEY/versions/latest' // Ensure this path is correct
  });
  return JSON.parse(version.payload.data.toString());
}

// Helper function to format date strings based on user input
function formatEventDate(dateString) {
  try {
    // First check if we can parse the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if parsing fails
    }
    
    // Check if the original string includes a year
    // This regex looks for a 4-digit year pattern in the string
    const hasYear = /\b\d{4}\b/.test(dateString);
    
    // Format based on whether year was included
    if (hasYear) {
      return format(date, 'MMMM d, yyyy');
    } else {
      return format(date, 'MMMM d');
    }
  } catch (error) {
    console.log('Date formatting error:', error);
    return dateString; // Return original on error
  }
}

app.post('/', async (req, res) => {
  if (!req.body || !req.body.message || !req.body.message.data) {
    console.log('No Pub/Sub message data received for user confirmation.');
    return res.status(204).send('No message data, but acknowledged.');
  }

  const pubsubMessage = req.body.message;
  let bookingData;
  try {
    const raw = Buffer.from(pubsubMessage.data, 'base64').toString();
    bookingData = JSON.parse(raw);
    console.log('Received booking data for user confirmation:', bookingData);
  } catch (error) {
    console.error('⚠️ Invalid JSON in Pub/Sub message for user confirmation:', error);
    return res.status(200).send('Bad JSON, message acknowledged.');
  }

  if (!bookingData || !bookingData.email) {
    console.error('⚠️ Booking data is missing user email for confirmation.');
    return res.status(200).send('Missing user email, message acknowledged.');
  }

  let serviceAccountKey;
  try {
    serviceAccountKey = await getServiceAccountKey();
  } catch (error) {
    console.error('❌ Secret Manager error for user confirmation:', error);
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
    email, // This will be the recipient
    phone,
    event_name: event,
    event_date: date,
    number_of_people: attendees,
    special_instructions: notes = 'None',
  } = bookingData;

  // Format the date according to whether year was specified
  const formattedDate = formatEventDate(date);

  // --- Email content for the USER ---
  const userSubject = `Your Bläz Booth Request for ${event} has been Received!`;
  const from = `=?UTF-8?B?${Buffer.from(SENDER_NAME).toString('base64')}?= <${SENDER_EMAIL}>`;
  const to = email; // Send to the user who made the booking

  const userMessageBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bläz Booth Request Confirmation</title>
    <style type="text/css">
        /* Base Reset Styles */
        body, html { margin: 0; padding: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; background-color: #f5f5f5; }
        table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        table td { border-collapse: collapse; mso-line-height-rule: exactly; }
        img, a img { border: 0; outline: none; text-decoration: none; height: auto; line-height: 100%; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        
        /* Base Layout */
        .main-wrapper { max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; }
        .full-width-image { width: 100%; max-width: 600px; height: auto; }
        
        /* Typography */
        body, table, td, p, a, li, blockquote { 
            -webkit-text-size-adjust: 100%; 
            -ms-text-size-adjust: 100%; 
            font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
        }
        
        /* Color Palette */
        :root {
            --brand-purple: #8B5CF6;
            --brand-indigo: #6366F1;
            --gray-50: #F8F8F8;
            --gray-100: #E4E4E7;
            --gray-200: #D4D4D8;
            --gray-800: #27272A;
            --gray-900: #18181B;
            --gray-950: #09090B;
            --white: #FFFFFF;
            --black: #000000;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header-logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: white;
        }
        
        /* Content Area */
        .content {
            padding: 40px 30px;
            background-color: white;
            color: #333333;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #333333;
            margin-bottom: 20px;
        }
        .paragraph {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #4B5563;
        }
        .highlight {
            font-weight: 600;
            color: #6366F1;
        }
        
        /* Information Box */
        .info-box {
            background-color: #F3F4F6;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
        }
        .info-box-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #111827;
        }
        
        /* Data Table */
        .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }
        .data-table tr {
            margin-bottom: 8px;
        }
        .data-table th {
            text-align: left;
            padding: 12px 15px;
            background-color: #EEEEF2;
            color: #4F46E5;
            font-weight: 600;
            border-radius: 5px 0 0 5px;
            width: 40%;
            vertical-align: top;
            font-size: 14px;
        }
        .data-table td {
            text-align: left;
            padding: 12px 15px;
            background-color: #F8F8FC;
            color: #1F2937;
            border-radius: 0 5px 5px 0;
            vertical-align: top;
            font-size: 14px;
        }
        
        /* Button Styling */
        .button-container {
            text-align: center;
            margin: 35px 0 25px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
            color: white !important;
            font-weight: 600;
            font-size: 16px;
            padding: 15px 25px;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.25);
            transition: all 0.3s ease;
        }
        
        /* Footer Section */
        .footer {
            background-color: #18181B;
            color: #A1A1AA;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
        }
        .social-icons {
            margin: 20px 0;
        }
        .social-icons a {
            display: inline-block;
            margin: 0 8px;
        }
        .social-icon {
            width: 32px;
            height: 32px;
        }
        .footer-links {
            margin-bottom: 20px;
        }
        .footer-links a {
            color: #D4D4D8;
            margin: 0 10px;
            text-decoration: none;
        }
        .footer-text {
            margin: 5px 0;
            color: #71717A;
            font-size: 12px;
        }
        
        /* Divider */
        .divider {
            height: 1px;
            width: 100%;
            background-color: #E5E7EB;
            margin: 30px 0;
        }
        
        /* Responsive Styles */
        @media screen and (max-width: 600px) {
            .content, .header, .footer {
                padding: 30px 20px;
            }
            .data-table th {
                width: 35%;
                font-size: 13px;
            }
            .data-table td {
                font-size: 13px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
        
        @media screen and (max-width: 480px) {
            .container {
                width: 100% !important;
            }
            .header {
                padding: 25px 15px;
            }
            .content {
                padding: 25px 15px;
            }
            .info-box {
                padding: 20px 15px;
            }
            .data-table th, .data-table td {
                display: block;
                width: 100%;
                box-sizing: border-box;
                border-radius: 0;
            }
            .data-table th {
                border-radius: 5px 5px 0 0;
            }
            .data-table td {
                border-radius: 0 0 5px 5px;
                border-top: none;
                margin-bottom: 10px;
            }
        }
    </style>
</head>

<body style="margin:0; padding:0; background-color:#F5F5F5;">
    <!--[if mso]>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
    <td>
    <![endif]-->
    
    <div style="max-width:600px; margin:0 auto;">
        <!-- Preheader Text (hidden) -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all;">
            Your Bläz Booth Request for ${event} has been confirmed! Details inside...
        </div>
        
        <!-- Main Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px; border-collapse:collapse; background-color:#FFFFFF; border-radius:8px; overflow:hidden; margin-top:20px; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <!-- Header section -->
            <tr>
                <td class="header" style="background:linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding:40px 20px; text-align:center; color:white;">
                    <h1 style="margin:0; font-size:30px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:white;">BOOKING REQUEST RECEIVED!</h1>
                </td>
            </tr>
            
            <!-- Content Section -->
            <tr>
                <td class="content" style="padding:40px 30px; background-color:white; color:#333333;">
                    <!-- Greeting -->
                    <p class="greeting" style="font-size:20px; font-weight:600; color:#333333; margin-bottom:20px;">Hello ${name},</p>
                    
                    <!-- Main Message -->
                    <p class="paragraph" style="font-size:16px; line-height:1.6; margin-bottom:20px; color:#4B5563;">
                        Thank you for your booth request for <span class="highlight" style="font-weight:600; color:#6366F1;">${event}</span>. We're excited to confirm that we've received your booking details!
                    </p>
                    
                    <p class="paragraph" style="font-size:16px; line-height:1.6; margin-bottom:20px; color:#4B5563;">
                        Our team is reviewing your request and will follow up with you within one business day to finalize all arrangements. Keep an eye on your inbox and phone for updates from our team.
                    </p>
                    
                    <!-- Information Box -->
                    <div class="info-box" style="background-color:#F3F4F6; padding:25px; border-radius:10px; margin:30px 0;">
                        <p class="info-box-title" style="font-size:18px; font-weight:600; margin-bottom:20px; color:#111827;">Booth Request Details</p>
                        
                        <!-- Data Table -->
                        <table class="data-table" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:separate; border-spacing:0 8px;">
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Event Name</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${event}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Event Date</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Contact Name</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${name}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Contact Email</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${email}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Contact Phone</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${phone}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Number of Attendees</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px;">${attendees}</td>
                            </tr>
                            <tr>
                                <th style="text-align:left; padding:12px 15px; background-color:#EEEEF2; color:#4F46E5; font-weight:600; border-radius:5px 0 0 5px; width:40%; vertical-align:top; font-size:14px;">Special Instructions</th>
                                <td style="text-align:left; padding:12px 15px; background-color:#F8F8FC; color:#1F2937; border-radius:0 5px 5px 0; vertical-align:top; font-size:14px; font-style:italic;">${notes}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Additional Information -->
                    <p class="paragraph" style="font-size:16px; line-height:1.6; margin-bottom:20px; color:#4B5563;">
                        If you have any questions or need to provide additional information, please don't hesitate to contact our team by replying to this email or reaching out via phone.
                    </p>
                    
                    <!-- CTA Button -->
                    <div class="button-container" style="text-align:center; margin:35px 0 25px;">
                        <a href="https://www.blaz.us/" class="button" style="display:inline-block; background:linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color:white; font-weight:600; font-size:16px; padding:15px 25px; border-radius:8px; text-decoration:none; box-shadow:0 4px 6px rgba(139,92,246,0.25);">
                            Visit Our Website
                        </a>
                    </div>
                    
                    <!-- Signature -->
                    <p class="paragraph" style="font-size:16px; line-height:1.6; margin-top:30px; color:#4B5563;">
                        Get ready for an exceptional event – we're eager to make it happen.
                    </p>
                    
                    <p class="paragraph" style="font-size:16px; line-height:1.6; margin-bottom:10px; color:#4B5563;">
                        Sincerely,<br>
                        <span style="font-weight:700; color:#111827;">The Bläz Team</span>
                    </p>
                </td>
            </tr>
            
            <!-- Footer Section -->
            <tr>
                <td class="footer" style="background-color:#18181B; color:#A1A1AA; padding:30px 20px; text-align:center; font-size:14px;">
                    <p class="footer-text" style="margin:5px 0; color:#71717A; font-size:12px;">
                        This is an automated message from the Bläz Booking System.
                    </p>
                    
                    <p class="footer-text" style="margin:5px 0; color:#71717A; font-size:12px;">
                        &copy; ${new Date().getFullYear()} Bläz Entertainment. All rights reserved.
                    </p>
                </td>
            </tr>
            
        </table>
    </div>
    
    <!--[if mso]>
    </td>
    </tr>
    </table>
    <![endif]-->
</body>
</html>
  `;

  const rawMessage = Buffer.from(
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `From: ${from}\r\n` +
    `To: ${to}\r\n` + // User's email address
    `Reply-To: blaz@gmail.com\r\n` + // Replies will go to blaz@gmail.com
    `Subject: =?UTF-8?B?${Buffer.from(userSubject).toString('base64')}?=\r\n` +
    `\r\n` +
    userMessageBody
  ).toString('base64url');

  try {
    await gmailClient.users.messages.send({
      userId: 'me', // 'me' refers to the SENDER_EMAIL authenticated
      requestBody: { raw: rawMessage },
    });
    console.log(`✅ User confirmation email sent to: ${to} for booking by: ${name}`);
    res.status(200).send(`User confirmation email sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Gmail API error sending to user ${to}:`, error.response ? error.response.data : error.message);
    res.status(500).send('Failed to send user confirmation email');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ User confirmation email server is listening on port ${PORT}`);
});
