import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { DivisionSwitcher } from "@/components/divisions/DivisionSwitcher";
import { LiveStandingsTable } from "@/components/divisions/LiveStandingsTable";
import {
  fallbackDivisions,
  fetchDivision,
  fetchDivisionLeaderboard,
  fetchDivisions,
  fetchGlobalElite,
} from "@/lib/divisions-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Rankings = () => {
  const { divisionSlug } = useParams();
  const { data: divisions = fallbackDivisions } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivisions,
  });
  const activeSlug = divisionSlug || divisions[0]?.slug;
  const { data: division = fallbackDivisions[0] } = useQuery({
    queryKey: ["division", activeSlug],
    queryFn: () => fetchDivision(activeSlug),
    enabled: Boolean(activeSlug),
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["division-leaderboard", activeSlug],
    queryFn: () => fetchDivisionLeaderboard(activeSlug),
    enabled: Boolean(activeSlug),
  });
  const { data: globalElite = [] } = useQuery({
    queryKey: ["global-elite"],
    queryFn: fetchGlobalElite,
  });

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-300">Division Rankings</p>
            <h1 className="mt-2 text-4xl font-display font-bold">Rankings</h1>
            <p className="mt-1 text-muted-foreground">Leaderboard positions are scoped to each permanent division.</p>
          </div>
          <DivisionSwitcher basePath="/rankings" activeSlug={activeSlug} className="md:max-w-xl" />
        </div>

        <Tabs defaultValue="division">
          <TabsList className="mb-6 grid w-full grid-cols-2 border border-white/10 bg-white/[0.04]">
            <TabsTrigger value="division">{division.name}</TabsTrigger>
            <TabsTrigger value="elite">Global Elite</TabsTrigger>
          </TabsList>
          <TabsContent value="division">
            <LiveStandingsTable division={division} rows={leaderboard} leaderboard />
          </TabsContent>
          <TabsContent value="elite">
            <div className="mb-4 flex items-center gap-2 text-sm text-amber-200">
              <Crown size={16} />
              Division 1 top 10
            </div>
            <LiveStandingsTable division={fallbackDivisions[0]} rows={globalElite} leaderboard />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Rankings;
