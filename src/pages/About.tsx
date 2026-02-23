import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-4">About Arena X</h1>
          <p className="text-muted-foreground">Arena X is a professional esports competition platform designed to make tournament participation fair, transparent, and secure.</p>
        </motion.div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">What is this platform?</h2>
          <p className="text-sm text-muted-foreground">Arena X hosts community and pro-level esports tournaments across multiple titles. Players can create teams, register for tournaments, and compete for cash and prizes.</p>

          <h2 className="text-2xl font-semibold">How tournaments work</h2>
          <p className="text-sm text-muted-foreground">Tournaments are created by organizers with a fixed format, entry fee and schedule. Players register their teams, pay the entry fee, and once the tournament reaches the required teams the bracket is generated.</p>

          <h2 className="text-2xl font-semibold">Fair play policy</h2>
          <p className="text-sm text-muted-foreground">We enforce fair play: collusion, cheating, or match manipulation will lead to disqualification. Report suspicious activity to support immediately.</p>

          <h2 className="text-2xl font-semibold">Payment security</h2>
          <p className="text-sm text-muted-foreground">Payments are secured by Flutterwave and routed through MTN MoMo for local transactions. We never store raw payment credentials — transactions are handled by the payment provider.</p>

          <h2 className="text-2xl font-semibold">Contact support</h2>
          <p className="text-sm text-muted-foreground">For help contact: <a href="mailto:support@arenax.com" className="underline">support@arenax.com</a></p>

          <h2 className="text-2xl font-semibold">Privacy & refund policy</h2>
          <p className="text-sm text-muted-foreground">We only collect necessary data to operate tournaments. Refunds are processed according to the tournament's refund policy — typically refunds are issued if a tournament is cancelled or a payment error occurs. See the specific tournament page for refund details.</p>
        </section>
      </div>
    </div>
  );
};

export default About;
