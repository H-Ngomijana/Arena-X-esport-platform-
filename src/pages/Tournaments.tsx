import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight, Shield, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { DivisionSwitcher } from "@/components/divisions/DivisionSwitcher";
import { FixtureList } from "@/components/divisions/FixtureList";
import { LiveStandingsTable } from "@/components/divisions/LiveStandingsTable";
import { ResultSubmitModal } from "@/components/divisions/ResultSubmitModal";
import { BracketView } from "@/components/divisions/BracketView";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DivisionFixture,
  fallbackDivisions,
  fetchCurrentSeason,
  fetchDivision,
  fetchDivisionFixtures,
  fetchDivisions,
  fetchDivisionTable,
} from "@/lib/divisions-api";

const Tournaments = () => {
  const { divisionSlug } = useParams();
  const [selectedFixture, setSelectedFixture] = useState<DivisionFixture | null>(null);

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
  const { data: season } = useQuery({
    queryKey: ["division-season", activeSlug],
    queryFn: () => fetchCurrentSeason(activeSlug),
    enabled: Boolean(activeSlug),
  });
  const { data: table = [] } = useQuery({
    queryKey: ["division-table", activeSlug],
    queryFn: () => fetchDivisionTable(activeSlug),
    enabled: Boolean(activeSlug),
  });
  const { data: fixtures = [] } = useQuery({
    queryKey: ["division-fixtures", activeSlug, season?.currentRound],
    queryFn: () => fetchDivisionFixtures(activeSlug, season?.currentRound),
    enabled: Boolean(activeSlug),
  });

  const overviewStats = useMemo(
    () => ({
      active: divisions.filter((item) => (item._count?.seasons || 0) > 0).length,
      capacity: divisions.reduce((sum, item) => sum + item.maxPlayers, 0),
    }),
    [divisions]
  );

  if (!divisionSlug) {
    return (
      <div className="container py-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-300">Division Pyramid</p>
              <h1 className="mt-2 text-4xl font-display font-bold">Tournaments</h1>
              <p className="mt-1 text-muted-foreground">Every division runs its own season, table, fixtures, and results.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-xs text-white/45">Active</div>
                <div className="font-display text-2xl font-bold">{overviewStats.active}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-xs text-white/45">Capacity</div>
                <div className="font-display text-2xl font-bold">{overviewStats.capacity}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {divisions.map((item) => (
              <Link
                key={item.id}
                to={`/tournaments/${item.slug}`}
                className="group rounded-lg border border-white/10 bg-[#090b12] p-5 transition-colors hover:border-cyan-300/40 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      Tier {item.tierLevel}
                    </Badge>
                    <h2 className="mt-4 font-display text-2xl font-bold">{item.name}</h2>
                    <p className="mt-1 text-sm text-white/55">
                      {item._count?.players || 0}/{item.maxPlayers} players
                    </p>
                  </div>
                  <ChevronRight className="text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-cyan-200" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-mono text-white/55">
                  <span>Promote {item.promotionSlots}</span>
                  <span>Relegate {item.relegationSlots}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <DivisionSwitcher basePath="/tournaments" activeSlug={activeSlug} />
        </div>

        <div className="mb-8 rounded-lg border border-white/10 bg-[#090b12] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-300">{division.name}</p>
              <h1 className="mt-1 text-4xl font-display font-bold">Season Command</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-white/70">
                  Round {season?.currentRound || 1}
                </Badge>
                <Badge variant="outline" className="border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                  {season?.status || "SCHEDULED"}
                </Badge>
                <Badge variant="outline" className="border-amber-300/20 bg-amber-300/10 text-amber-200">
                  {season?.daysRemaining ?? "-"} days
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white/[0.04] px-4 py-3">
                <Shield size={16} className="mx-auto mb-1 text-cyan-300" />
                <div className="font-mono text-xs text-white/45">Tier</div>
                <div className="font-display text-xl font-bold">{division.tierLevel}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] px-4 py-3">
                <Trophy size={16} className="mx-auto mb-1 text-emerald-300" />
                <div className="font-mono text-xs text-white/45">Up</div>
                <div className="font-display text-xl font-bold">{division.promotionSlots}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] px-4 py-3">
                <CalendarClock size={16} className="mx-auto mb-1 text-rose-300" />
                <div className="font-mono text-xs text-white/45">Down</div>
                <div className="font-display text-xl font-bold">{division.relegationSlots}</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="fixtures">
          <TabsList className="mb-6 grid w-full grid-cols-3 border border-white/10 bg-white/[0.04]">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="fixtures">
            <FixtureList fixtures={fixtures} onSubmitResult={setSelectedFixture} />
          </TabsContent>
          <TabsContent value="table">
            {season?.competitionType === "KNOCKOUT" ? <BracketView /> : <LiveStandingsTable division={division} rows={table} />}
          </TabsContent>
          <TabsContent value="history">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
              Archived seasons will appear after this division completes its first season.
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
      <ResultSubmitModal
        fixture={selectedFixture}
        open={Boolean(selectedFixture)}
        onOpenChange={(open) => !open && setSelectedFixture(null)}
      />
    </div>
  );
};

export default Tournaments;
