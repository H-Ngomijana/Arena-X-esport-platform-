import { motion } from "framer-motion";
import TeamCard from "@/components/TeamCard";
import { getPageBackgrounds, getTeams } from "@/lib/storage";

const TeamsPage = () => {
  const teams = getTeams();
  const backgrounds = getPageBackgrounds();
  const pageBg = backgrounds.teams_page;

  return (
    <div className="relative min-h-screen">
      {pageBg && (
        <img
          src={pageBg}
          alt="Teams background"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/75 to-slate-950/95" />
      <div className="container py-12 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-display font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground mb-8">Browse competitive teams</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <TeamCard key={t.id} {...t} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamsPage;
