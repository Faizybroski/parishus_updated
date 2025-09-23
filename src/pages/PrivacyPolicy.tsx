import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  const sections = [
    { id: "info", title: "1. Information We Collect", content: `Account & Identity Data: Name, email address, profile photo, phone number, date of birth, and gender (optional).\n\nEvent & Transaction Data: RSVPs, event attendance, payments, billing details, and transaction history.\n\nUsage Data: Device information, IP address, browser type, session length, app version, pages visited, and interaction logs.\n\nCommunications: Messages you send to our support team or through community features.\n\nLocation Data (optional): To match you with nearby events or restaurants, if you enable location services.` },
    { id: "collect", title: "2. How We Collect Data", content: `Directly from you when you register, RSVP to events, or communicate with us.\n\nAutomatically through cookies, app trackers, and analytics tools when you use the Platform.\n\nFrom partners such as payment providers or analytics platforms that help us process transactions and improve services.` },
    { id: "why", title: "3. Why We Use Your Data", content: `To deliver services: create and manage your account, confirm event participation, process payments.\n\nTo improve Parish: monitor performance, fix technical issues, analyze engagement, and add features.\n\nTo ensure safety: verify eligibility, enforce community standards, detect misuse, and protect users.\n\nTo communicate with you: send confirmations, updates, reminders, or promotional content (with opt-out options).\n\nTo comply with laws: meet legal, financial, and regulatory obligations.` },
    { id: "retention", title: "4. Data Retention", content: `Account Data: Stored while your account is active. If your account is inactive for 2 years, we may delete it after notifying you.\n\nTransaction Data: Retained for up to 7 years to comply with financial and tax laws.\n\nMarketing Data: Retained for up to 3 years after last interaction unless you opt out sooner.\n\nTechnical Logs: Retained up to 12 months for security and troubleshooting.` },
    { id: "sharing", title: "5. Sharing Your Data", content: `Parish does not sell your personal data. We may share Data with:\n\nService providers: payment processors, cloud hosting, analytics, and communication platforms.\n\nBusiness partners: restaurants or venues hosting Parish events (limited to reservation details).\n\nLegal authorities: if required by law or in response to valid legal requests.\n\nIf data is transferred outside your country, we ensure adequate safeguards are in place (such as standard contractual clauses).` },
    { id: "security", title: "6. How We Protect Your Data", content: `We use administrative, technical, and organizational safeguards including:\n\nEncrypted communications (HTTPS/SSL).\n\nRestricted access to sensitive data.\n\nSecure cloud hosting with firewalls and intrusion detection.\n\nRegular monitoring and system updates.\n\nYou are responsible for protecting your password and logging out of shared devices.` },
    { id: "rights", title: "7. Your Rights", content: `Depending on your jurisdiction (e.g., GDPR in Europe, CCPA in California), you may have the right to:\n\nAccess: request a copy of the data we hold about you.\n\nCorrect: update or fix inaccurate data.\n\nDelete: request erasure of your account or specific data.\n\nRestrict: limit how we process your data.\n\nOpt-out: stop receiving marketing messages at any time.\n\nPortability: request data in a structured, machine-readable format.\n\nTo exercise these rights, email us at privacy@parishus.com. We will respond within the legally required timeframe.` },
    { id: "cookies", title: "8. Cookies & Tracking", content: `Parish uses cookies and similar technologies to:\n\nMeasure visits and usage trends.\n\nSave preferences and improve user experience.\n\nSupport secure logins and payments.\n\nYou can manage or disable cookies through your browser or device settings.` },
    { id: "children", title: "9. Children’s Privacy", content: `Parish is intended for users 18 and older. We do not knowingly collect Data from children. If we learn we have collected Data from a minor, we will delete it immediately.` },
    { id: "changes", title: "10. Changes to this Policy", content: `We may update this Policy from time to time. Updates will be posted on the Platform with the “Last Updated” date revised. Material changes will be notified to you directly (e.g., by email or in-app notice).` },
    { id: "contact", title: "11. Contact Us", content: `If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:\nprivacy@parishus.com` },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-6 md:px-20 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl lg:text-5xl font-bold text-[#e4c29a] mb-4 text-center">
          Parish Privacy Policy
        </h1>
        <p className="text-muted-foreground text-center mb-10">
          Last Updated: August 2025
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
          <ScrollArea className="h-[80vh] rounded-2xl border p-6 bg-card shadow-lg">
            <div className="space-y-10">
              <section>
                <p className="leading-relaxed text-muted-foreground">
                  At Parish, your privacy matters. This Privacy Policy (“Policy”)
                  explains how we collect, use, store, and protect your personal
                  information (“Data”) when you access or use the Parish website,
                  mobile application, or any services offered through our platform
                  (collectively, the “Platform”).
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  By using Parish, you agree to this Policy. If you do not agree, you
                  should not use the Platform.
                </p>
              </section>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className=" scroll-mt-28">
                  <h2 className="text-xl font-semibold text-[#e4c29a] mb-3">
                    {section.title}
                  </h2>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </section>
              ))}

              <section className="pt-6 text-center">
                <p className="italic text-sm text-muted-foreground">
                  © 2025 Parish LLC. All Rights Reserved.
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
