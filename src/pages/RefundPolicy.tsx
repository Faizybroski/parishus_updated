import { Card, CardContent } from "@/components/ui/card"

export default function RefundPolicyPage() {
  return (
    <section className="relative min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-card/70 backdrop-blur-xl border border-border/40 shadow-2xl rounded-2xl">
          <CardContent className="p-10 md:p-14">
            
            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6">
              Parish Refund Policy
            </h1>
            <p className="text-foreground/80 text-lg mb-10">
              Thank you for choosing <span className="text-primary font-semibold">parish</span>, 
              the platform where strangers meet to share meals and meaningful conversations. 
              We strive to provide an enjoyable and seamless experience for all users.
            </p>
            
            {/* Policy Sections */}
            <div className="space-y-8 text-foreground/90 leading-relaxed">
              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">1. All Sales Are Final</h2>
                <p>
                  All payments made through parish are <span className="font-medium">nonrefundable</span>. 
                  Once a booking, RSVP, or event payment is completed, no refunds, credits, or exchanges will 
                  be provided, regardless of the reason for cancellation, no-shows, or changes in availability.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">2. Cancellations by Users</h2>
                <p>
                  If you choose to cancel your participation in an event for any reason, you will not be entitled 
                  to a refund or credit.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">3. Cancellations by Organizers or parish</h2>
                <p>
                  If an event is canceled by the event organizer or parish, participants may be provided with a 
                  credit to use toward a future event at the <span className="italic">sole discretion of parish</span>. 
                  Refunds will not be issued.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">4. No-Shows</h2>
                <p>
                  Failure to attend an event you registered for will not entitle you to a refund or credit.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">5. Payment Disputes</h2>
                <p>
                  By completing a payment on parish, you agree to this Refund Policy. Attempting to dispute 
                  charges through your bank or payment provider may result in suspension or termination of your account.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-primary mb-2">6. Contact Us</h2>
                <p>
                  If you have questions about this policy, please contact us:
                </p>
                <p className="mt-2 font-medium">
                  <a href="mailto:support@parish.com" className="underline hover:text-primary">support@parish.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
