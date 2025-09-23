export default function CheckoutForm({ eventId, userName, userEmail }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const result = await stripe.confirmCardPayment(elements._clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: userName,
          email: userEmail,
        },
      },
    });

    if (result?.paymentIntent?.status === "succeeded") {
      window.location.href = "/rsvp-success";
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-4 border rounded">
      <CardElement className="p-3 border rounded mb-4" />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-indigo-600 text-white py-2 rounded"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}
