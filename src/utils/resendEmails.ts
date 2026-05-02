// ============================================================
// MANUAL EMAIL RESEND — Sip of Summer (6 users)
// Ek baar run karo, phir delete kar do yeh file
// ============================================================

import { sendRSVPedEmail } from "@/lib/sendRSVPedEmail";

const EVENT_NAME = "Sip of Summer";
const EVENT_DATE_TIME = "2026-05-30T22:30:00+00:00";
const EVENT_LOCATION = "Location To Be Decided";
const EVENT_LOCATION_ADDRESS = "Address To Be Decided";
const EVENT_FEE = "165";
const ORGANIZER_EMAIL = "thesocialsection@njpierre.com";
const ORGANIZER_NAME = "The Social Section";

// 6 users jinhein email nahi gayi
const users = [
  {
    email: "aminah.fonseca@gmail.com",
    name: "Aminah Fonseca",
    trackCode: "E3U4FUGA",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/E3U4FUGA.png",
  },
  {
    email: "melisssawow@gmail.com",
    name: "Melissa Elie",
    trackCode: "TK24TRN6",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/TK24TRN6.png",
  },
  {
    email: "audreyquality3@gmail.com",
    name: "Audrey (Drizzy)",
    trackCode: "7G4WKJY4",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/7G4WKJY4.png",
  },
  {
    email: "sylvia.singleton16@gmail.com",
    name: "Sylvia Singleton-Kennet",
    trackCode: "QMWGVVHA",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/QMWGVVHA.png",
  },
  {
    email: "joshuannahope@gmail.com",
    name: "Joshuanna (Hope) Jean-Baptiste",
    trackCode: "56SYTPY8",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/56SYTPY8.png",
  },
  {
    email: "bostonfoodieeats@gmail.com",
    name: "Urvi Patel",
    trackCode: "ECHN73NM",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/ECHN73NM.png",
  },
   {
    email: "globalsmtp2024@gmail.com",
    name: "Urvi Patel",
    trackCode: "ECHN73NM",
    qrCodeUrl:
      "https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/qr-code/ECHN73NM.png",
  },
];

export const resendAllEmails = async () => {
  console.log(`📧 Starting email resend for ${users.length} users...`);

  for (const user of users) {
    try {
      await sendRSVPedEmail({
        rsvpedUserEmail: user.email,
        rsvpedUserName: user.name,
        eventName: EVENT_NAME,
        eventDateTime: EVENT_DATE_TIME,
        eventLocation: EVENT_LOCATION,
        eventLocationAddress: EVENT_LOCATION_ADDRESS,
        trackCode: user.trackCode,
        qrCodeUrl: user.qrCodeUrl,
        isPaid: true,
        paymentStatus: "paid",
        pricePaid: EVENT_FEE || undefined,
        organizerEmail: ORGANIZER_EMAIL,
        organizerName: ORGANIZER_NAME,
        replyTo: "support@parishus.com",
      });

      console.log(`✅ Email sent → ${user.name} (${user.email})`);
    } catch (err) {
      console.error(`❌ Failed → ${user.name} (${user.email}):`, err);
    }
  }

  console.log("🎉 Done! All emails processed.");
};