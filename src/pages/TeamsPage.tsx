import { motion } from "framer-motion";
import TeamCard from "@/components/TeamCard";
import { teams } from "@/lib/mock-data";
import type { RankTier } from "@/lib/mock-data";

const TeamsPage = () => (
  <div className="container py-12">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-4xl font-display font-bold mb-2">Teams</h1>
      <p className="text-muted-foreground mb-8">Browse competitive teams</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <TeamCard key={t.id} {...t} tier={t.tier as RankTier} />
        ))}
      </div>
    </motion.div>
  </div>
);

export default TeamsPage;
