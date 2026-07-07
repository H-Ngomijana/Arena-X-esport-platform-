import { useMemo, useState } from "react";
import type React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarClock, ChevronRight, Image, Palette, Shield, Trophy, Upload, Users } from "lucide-react";
import { motion } from "framer-motion";
import { DivisionSwitcher } from "@/components/divisions/DivisionSwitcher";
import { FixtureList } from "@/components/divisions/FixtureList";
import { LiveStandingsTable } from "@/components/divisions/LiveStandingsTable";
import { ResultSubmitModal } from "@/components/divisions/ResultSubmitModal";
import { BracketView } from "@/components/divisions/BracketView";
import { DivisionAccessRequestModal } from "@/components/divisions/DivisionAccessRequestModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [accessOpen, setAccessOpen] = useState(false);

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
  const playedFixtures = fixtures.filter((fixture) => fixture.status === "PLAYED" || fixture.result);
  const pendingFixtures = fixtures.filter((fixture) => fixture.status === "PENDING").slice(0, 3);
  const divisionTheme = {
    "--division-primary": division.theme?.primary || "#22d3ee",
    "--division-accent": division.theme?.accent || "#a78bfa",
  } as React.CSSProperties;

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
                className="group relative min-h-[260px] overflow-hidden rounded-lg border border-white/10 bg-[#090b12] transition-colors hover:border-cyan-300/40"
              >
                {item.bannerUrl && (
                  <img
                    src={item.bannerUrl}
                    alt={`${item.name} banner`}
                    className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/75 to-[#05070d]/20" />
                <div className="relative flex h-full min-h-[260px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-4">
                    <Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      Tier {item.tierLevel}
                    </Badge>
                    <ChevronRight className="text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-cyan-200" />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-bold">{item.name}</h2>
                    <p className="mt-1 text-sm text-white/65">Dedicated fixtures, table, uploads, announcements, and results.</p>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-xs font-mono text-white/70">
                      <span>{item._count?.players || 0}/{item.maxPlayers} users</span>
                      <span>Up {item.promotionSlots}</span>
                      <span>Down {item.relegationSlots}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12" style={divisionTheme}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <DivisionSwitcher basePath="/tournaments" activeSlug={activeSlug} />
        </div>

        <div className="relative mb-8 overflow-hidden rounded-lg border border-white/10 bg-[#090b12]">
          {division.bannerUrl && (
            <img src={division.bannerUrl} alt={`${division.name} banner`} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060912]/95 via-[#060912]/75 to-[#060912]/40" />
          <div className="relative p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-300">{division.name}</p>
              <h1 className="mt-1 text-4xl font-display font-bold">Season Command</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                This division has its own brackets, fixtures, rounds, users, announcements, upload areas, theme, next matches, and results.
              </p>
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
            <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
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
              <Button className="h-full min-h-[74px] flex-col bg-cyan-400 text-black hover:bg-cyan-300" onClick={() => setAccessOpen(true)}>
                <Upload size={16} />
                Request Access
              </Button>
            </div>
          </div>
          </div>
        </div>

        <Tabs defaultValue="fixtures">
          <TabsList className="mb-6 grid w-full grid-cols-2 border border-white/10 bg-white/[0.04] md:grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="rounds">Rounds</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="announcements">News</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="next">Next</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="fixtures">
            <FixtureList fixtures={fixtures} onSubmitResult={setSelectedFixture} />
          </TabsContent>
          <TabsContent value="rounds">
            <div className="grid gap-3 md:grid-cols-4">
              {Array.from(new Set(fixtures.map((fixture) => fixture.round))).map((round) => (
                <div key={round} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-mono text-xs text-white/45">Round</div>
                  <div className="font-display text-3xl font-bold">{round}</div>
                  <p className="mt-1 text-sm text-white/55">
                    {fixtures.filter((fixture) => fixture.round === round).length} fixtures
                  </p>
                </div>
              ))}
              {fixtures.length === 0 && <EmptyDivisionPanel label="Rounds appear after fixtures are generated." />}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <LiveStandingsTable division={division} rows={table} />
          </TabsContent>
          <TabsContent value="bracket">
            <BracketView />
          </TabsContent>
          <TabsContent value="users">
            <div className="grid gap-3 md:grid-cols-3">
              {table.map((row) => (
                <div key={row.playerId} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <Users size={16} className="mb-3 text-cyan-300" />
                  <div className="font-semibold">{row.player?.inGameName || row.player?.username || row.playerId}</div>
                  <p className="mt-1 text-sm text-white/55">#{row.rank} in {division.name}</p>
                  <p className="mt-3 font-mono text-xs text-white/45">{row.wins}W / {row.draws}D / {row.losses}L</p>
                </div>
              ))}
              {table.length === 0 && <EmptyDivisionPanel label="Approved division users will appear here." />}
            </div>
          </TabsContent>
          <TabsContent value="announcements">
            <DivisionInfoPanel icon={<Bell size={18} />} title="Division Announcements" text="Admins can publish updates, deadlines, disputes, and promotion notices scoped to this division." />
          </TabsContent>
          <TabsContent value="uploads">
            <DivisionInfoPanel icon={<Image size={18} />} title="Upload Area" text="Players submit result screenshots and division proof images here; binary files should be stored in Cloudinary/S3 and saved as URLs." />
          </TabsContent>
          <TabsContent value="theme">
            <DivisionInfoPanel icon={<Palette size={18} />} title="Personal Division Theme" text="Each division can carry its own banner, accent color, and page theme from the Division table." />
          </TabsContent>
          <TabsContent value="next">
            <FixtureList fixtures={pendingFixtures} onSubmitResult={setSelectedFixture} />
          </TabsContent>
          <TabsContent value="results">
            <FixtureList fixtures={playedFixtures} />
          </TabsContent>
        </Tabs>
      </motion.div>
      <ResultSubmitModal
        fixture={selectedFixture}
        open={Boolean(selectedFixture)}
        onOpenChange={(open) => !open && setSelectedFixture(null)}
      />
      <DivisionAccessRequestModal division={division} open={accessOpen} onOpenChange={setAccessOpen} />
    </div>
  );
};

const EmptyDivisionPanel = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">{label}</div>
);

const DivisionInfoPanel = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8">
    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
      {icon}
    </div>
    <h3 className="font-display text-2xl font-bold">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm text-white/55">{text}</p>
  </div>
);

export default Tournaments;
