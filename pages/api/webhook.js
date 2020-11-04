import Stripe from "stripe";
import { buffer } from "micro";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, res) => {
  if (req.method == "POST") {
    // Check the event came from stripe
    const sig = req.headers["stripe-signature"];
    const buf = await buffer(req);

    let event;

    try {
      // Check the webhook is from Stripe and if so return an event.
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        webhook_secret
      );
    } catch (err) {
      res.statusCode = 400;
      res.send(
        JSON.stringify({
          error: `Webhook error: ${err.message}`,
        })
      );
    }

    if (event) {
      console.log(`🔔-> Webhook received for ${event.type}`);

      res.statusCode = 200;
      res.send(
        JSON.stringify({
          received: true,
        })
      );
    }
  } else {
    res.statusCode = 405;
    res.send(
      JSON.stringify({
        error: `Request Method: ${req.method} Not supported.`,
      })
    );
  }
};
