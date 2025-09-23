import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TermsAndConditions() {
  const sections = [
    { id: "legal", title: "1. Legal Notices", content: `Parish is operated by: \nParishUs LLC\nNewyork, NY\nUSA\n\nYou can contact us at:\nsupport@parish.com\n\nThe Platform is hosted by a third-party provider. We may change hosting providers at any time without notice.`},
    { id: "principles", title: "2. General Principles", content: `These Terms form the sole agreement between parish and its users (“you,” “your,” or “Client”).\n\nBy ticking the acceptance box during signup, you confirm your agreement.\n\nIf you do not accept, you must not use the Platform.Additional guidelines (such as Safety Guidelines or Refund Policy) are incorporated by reference.\n\nIn case of conflict, these Terms prevail.\n\nParish may update these Terms at any time. Continued use of the Platform after updates constitutes acceptance of the new Terms.` },
    { id: "eligibility", title: "3. Eligibility", content: `By creating an account, you confirm that you:\n\nAre at least 18 years old (or the legal age of majority in your jurisdiction).\n\nHave the legal capacity to enter into a binding contract.\n\nHave not been convicted of violent, sexual, or serious criminal offenses.\n\nHave not been previously banned from parish without written authorization to return.\n\nAre using parish strictly for personal, non-commercial purposes.\n\nFailure to meet these requirements may result in suspension or termination of your account.` },
    { id: "services", title: "4. Description of Services", content: `Parish provides tools that allow users to:\n\nRSVP to curated group dining events organized by parish or other approved hosts.\n\nPay event participation fees through the Platform.\n\nConnect with attendees after events using optional community features.\n\nPlease note:\n\nParishUs does not operate the restaurants and is not responsible for the quality of food, service, or environment.\n\nMeals, drinks, and tips are not included in event participation fees unless otherwise stated.\n\nWe cannot guarantee participant gender ratios, backgrounds, or compatibility.` },
    { id: "reservations", title: "5. Reservations, Cancellations & Refunds", content: `All payments are final and nonrefundable. By registering for a paid event, you acknowledge that no refunds, credits, or exchanges will be provided, including for cancellations or no-shows.\n\nEvent details (location, time, restaurant) are provided via the Platform before the event.\n\nLast-minute changes to venue or seating may occur due to unforeseen circumstances. Parish will make reasonable efforts to inform you promptly.\n\nGuests not registered through the Platform may not attend.` },
    { id: "obligations", title: "6. User Obligations", content: `By using parish, you agree to:\n\nProvide accurate information during signup and keep it updated.\n\nMaintain the confidentiality of your account credentials.\n\nAttend events you RSVP for and arrive on time.\n\nPay your share of any food, drinks, or service charges directly to the restaurant.\n\nConduct yourself respectfully toward other participants, staff, and restaurant personnel.` },
    { id: "prohibited", title: "7. Prohibited Activities", content: `You may not:\n\nMisrepresent your identity, age, or background.\n\nSolicit money, donations, or business from other users.\n\nHarass, threaten, or abuse participants in any way.\n\nShare private or sensitive information of others without consent.\n\nPost harmful, offensive, or illegal content through the Platform.\n\nAttempt to interfere with the security or functionality of the Platform.\n\nViolation of these rules may result in immediate removal from events, suspension, or account termination.` },
    { id: "safety", title: "8. Safety & Responsibility", content: `Parish is committed to fostering safe experiences but cannot guarantee user behavior. Use your judgment when meeting others.\n\nYou are responsible for your personal belongings, health, and safety during events.\n\nDo not accept rides from strangers unless you feel safe and in control. Use licensed transport services where possible.\n\nIf you experience inappropriate behavior, report it to support@parish.com.` },
    { id: "payments", title: "9. Payments & Billing", content: `Service fees and event participation fees are displayed in the currency applicable to your location.\n\nPayments made via app stores (Apple App Store, Google Play) are subject to those stores’ terms in addition to these Terms.\n\nParishUs does not store your payment details; transactions are processed by secure third-party providers.\n\nBy completing payment, you authorize parish to process charges as described.` },
    { id: "content", title: "10. Content & Intellectual Property", content: `The Platform, including its design, logos, text, and software, are owned by parish and protected by intellectual property laws.\n\nUsers may not reproduce, resell, or distribute Platform content without written permission.\n\nPhotos or videos may be taken at parish events for community or marketing purposes. By attending, you consent to their use, unless you notify us otherwise in writing.` },
    { id: "data", title: "11. Data Protection", content: `Parish respects your privacy. Personal data is collected and processed according to our Privacy Policy, available on the Platform.` },
    { id: "liability", title: "12. Limitation of Liability", content: `Parish provides its Services “as is.” We do not guarantee uninterrupted or error-free access.\n\nParishUs is not responsible for restaurant services, third-party providers, or the conduct of participants.\n\nTo the maximum extent permitted by law, ParishUs’ liability is limited to the amount you paid for Services in the 12 months prior to the claim.` },
    { id: "termination", title: "13. Termination", content: `You may delete your account at any time via the Platform.\n\nParishUs reserves the right to suspend or terminate your account for violations of these Terms.\n\nFees already paid remain nonrefundable upon termination.` },
    { id: "law", title: "14. Governing Law & Dispute Resolution", content: `Disputes will first be addressed through good faith discussions. If unresolved, disputes will be subject to the exclusive jurisdiction of the courts.` },
    { id: "contact", title: "15. Contact Us", content: `For questions, complaints, or support:\nsupport@parish.com` },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-6 md:px-20 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl lg:text-5xl font-bold text-[#e4c29a] mb-4 text-center">
          Parish Terms & Conditions
        </h1>
        <p className="text-muted-foreground text-center mb-10">
          Effective Date: 08/26/2026
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden md:block">
            <Card className="sticky top-20 bg-muted/40 border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-[#e4c29a] mb-4">Quick Navigation</h2>
                <ul className="space-y-3 text-sm">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <ScrollArea className="h-[90vh] rounded-2xl border p-6 bg-card shadow-lg">
            <div className="space-y-10">
              <section>
                <p className="leading-relaxed text-muted-foreground">
                  Welcome to parish (“Parish,” “we,” “us,” or “our”). Parish is
                  a platform designed to connect individuals for shared dining
                  experiences, encouraging authentic conversations and meaningful
                  connections. By signing up, accessing, or using the parish platform,
                  website, or mobile application (collectively, the “Platform”), you agree
                  to be bound by these Terms & Conditions (the “Terms”). Please read them
                  carefully.
                </p>
              </section>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className=" scroll-mt-28">
                  <h2 className="text-xl font-semibold text-[#e4c29a] mb-3">{section.title}</h2>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground leading-relaxed  whitespace-pre-line">
{section.content}
                  </p>
                </section>
              ))}

              <section className="pt-6 text-center">
                <p className="italic text-sm text-muted-foreground">
                  ✨ By signing up, you confirm that you have read, understood, and agree
                  to these Terms & Conditions.
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
