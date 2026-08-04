'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@sv-os/ui';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Clock,
  GraduationCap,
  Link2,
  Layers,
  ArrowRight,
  Bookmark,
  Heart,
  Youtube,
  FileText,
  Globe,
  Github,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Code,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { Shell } from '@/components/shared/shell';
import { AluBitwiseVisualizer } from '@/components/simulators/alu-bitwise-visualizer';
import { AstParserVisualizer } from '@/components/simulators/ast-parser-visualizer';
import { BstAvlVisualizer } from '@/components/simulators/bst-avl-visualizer';
import { BTreeVisualizer } from '@/components/simulators/btree-visualizer';
import { CacheMappingVisualizer } from '@/components/simulators/cache-mapping-visualizer';
import { CallStackVisualizer } from '@/components/simulators/call-stack-visualizer';
import { CpuRegisterVisualizer } from '@/components/simulators/cpu-register-visualizer';
import { CpuSchedulerVisualizer } from '@/components/simulators/cpu-scheduler-visualizer';
import { DeadlockBankerVisualizer } from '@/components/simulators/deadlock-banker-visualizer';
import { DijkstraGraphVisualizer } from '@/components/simulators/dijkstra-graph-visualizer';
import { DpMatrixVisualizer } from '@/components/simulators/dp-matrix-visualizer';
import { FiniteAutomataVisualizer } from '@/components/simulators/finite-automata-visualizer';
import { GraphTraversalVisualizer } from '@/components/simulators/graph-traversal-visualizer';
import { HashTableVisualizer } from '@/components/simulators/hash-table-visualizer';
import { HeapOperationsVisualizer } from '@/components/simulators/heap-operations-visualizer';
import { KmapLogicVisualizer } from '@/components/simulators/kmap-logic-visualizer';
import { LexerVisualizer } from '@/components/simulators/lexer-visualizer';
import { LogicCircuitSimulator } from '@/components/simulators/logic-circuit-simulator';
import { LruCacheVisualizer } from '@/components/simulators/lru-cache-visualizer';
import { MatrixTransformVisualizer } from '@/components/simulators/matrix-transform-visualizer';
import { MemoryPageReplacementVisualizer } from '@/components/simulators/memory-page-replacement-visualizer';
import { MmuAddressTranslationVisualizer } from '@/components/simulators/mmu-address-translation-visualizer';
import { PipelineHazardVisualizer } from '@/components/simulators/pipeline-hazard-visualizer';
import { RegexNfaVisualizer } from '@/components/simulators/regex-nfa-visualizer';
import { RelationalAlgebraVisualizer } from '@/components/simulators/relational-algebra-visualizer';
import { RsaCryptoVisualizer } from '@/components/simulators/rsa-crypto-visualizer';
import { SlidingWindowVisualizer } from '@/components/simulators/sliding-window-visualizer';
import { SortingVisualizer } from '@/components/simulators/sorting-visualizer';
import { SubnetCalculatorVisualizer } from '@/components/simulators/subnet-calculator-visualizer';
import { TcpPacketFlowVisualizer } from '@/components/simulators/tcp-packet-flow-visualizer';
import { TruthTableVisualizer } from '@/components/simulators/truth-table-visualizer';
import { TuringMachineVisualizer } from '@/components/simulators/turing-machine-visualizer';
import {
  useIsBookmarked,
  useToggleBookmark,
  useIsFavorited,
  useAddFavorite,
} from '@/hooks/use-bookmarks';
import {
  useKnowledgeNode,
  useNodePrerequisites,
  useRelatedNodes,
  useNodeResources,
  useNodeCareers,
} from '@/hooks/use-knowledge';
import { cn, slugToTitle } from '@/lib';
import { useAuth } from '@/providers/auth-provider';

const resourceIcons: Record<string, React.ReactNode> = {
  video: <Youtube className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  documentation: <FileText className="h-4 w-4" />,
  course: <GraduationCap className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
};

const difficultyColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
  expert: 'danger',
};

export default function KnowledgeNodeDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuth();

  const { data: node, isLoading: nodeLoading, isError: nodeError } = useKnowledgeNode(slug);
  const { data: prerequisites } = useNodePrerequisites(slug);
  const { data: related } = useRelatedNodes(slug);
  const { data: resources } = useNodeResources(slug);
  const { data: careers } = useNodeCareers(slug);

  const { data: bookmarkStatus } = useIsBookmarked(node?.id ?? '');
  const { data: favoriteStatus } = useIsFavorited(node?.id ?? '');
  const toggleBookmark = useToggleBookmark();
  const addFavorite = useAddFavorite();

  if (nodeLoading) {
    return (
      <Shell maxWidth="4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </Shell>
    );
  }

  if (nodeError || !node) {
    return (
      <Shell>
        <ErrorState
          title="Node not found"
          message="The knowledge node you're looking for doesn't exist or has been removed."
        />
      </Shell>
    );
  }

  const nodeColor = NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)';

  const extraMetadata = ((node as unknown as Record<string, unknown>).extra_metadata ||
    node.metadata ||
    {}) as {
    learning_outcomes?: string[];
    common_mistakes?: string[];
    cross_domain_connections?: Array<{ target_slug: string; reason: string }>;
    resources?: Array<{ title: string; url?: string; platform?: string; resource_type?: string }>;
    interview_questions?: string[];
    coding_challenges?: Array<{ title: string; description: string; difficulty?: string }>;
  };

  return (
    <Shell maxWidth="4xl">
      {/* Back link */}
      <Link
        href="/explore"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to explorer
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: nodeColor }}
          >
            {node.title.charAt(0)}
          </div>
          <div>
            <Badge variant="secondary" size="sm" className="mb-1 capitalize">
              {node.node_type}
            </Badge>
            <Badge variant={difficultyColors[node.difficulty] ?? 'secondary'} size="sm">
              {slugToTitle(node.difficulty)}
            </Badge>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {node.title}
        </h1>
        <p className="text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          {node.description}
        </p>

        {/* Promoted Cross-Domain Connections */}
        {Boolean(
          (node.metadata as Record<string, unknown> | undefined)?.cross_domain_connections &&
          Array.isArray((node.metadata as Record<string, unknown>).cross_domain_connections) &&
          ((node.metadata as Record<string, unknown>).cross_domain_connections as Array<unknown>)
            .length > 0,
        ) && (
          <div className="mt-5 rounded-xl border border-pink-200 bg-pink-50/60 p-4 dark:border-pink-900/40 dark:bg-pink-950/20">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
              ⚡ Same idea shows up in:
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                (node.metadata as Record<string, unknown>).cross_domain_connections as Array<{
                  target_id: string;
                  target_title: string;
                  domain: string;
                  reason: string;
                }>
              ).map((cd, idx) => (
                <Link key={idx} href={`/explore/${cd.target_id}`}>
                  <Badge
                    variant="secondary"
                    size="md"
                    className="cursor-pointer gap-1.5 hover:bg-pink-100 dark:hover:bg-pink-900/40"
                  >
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {cd.target_title || cd.target_id}
                    </span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400">
                      ({cd.domain})
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isAuthenticated && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={bookmarkStatus?.bookmarked ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => node.id && toggleBookmark.mutate(node.id)}
            >
              <Bookmark className={cn('h-4 w-4', bookmarkStatus?.bookmarked && 'fill-current')} />
              {bookmarkStatus?.bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button
              variant={favoriteStatus?.favorited ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => node.id && addFavorite.mutate(node.id)}
            >
              <Heart className={cn('h-4 w-4', favoriteStatus?.favorited && 'fill-current')} />
              {favoriteStatus?.favorited ? 'Favorited' : 'Favorite'}
            </Button>
          </div>
        )}
      </div>

      {/* Interactive Simulator (if slug matches core subjects) */}
      {slug === 'logic-gates' && (
        <div className="mb-8">
          <LogicCircuitSimulator />
        </div>
      )}
      {slug === 'recursion-and-divide-and-conquer' && (
        <div className="mb-8">
          <SortingVisualizer />
        </div>
      )}
      {slug === 'intro-to-ai-and-search-algorithms' && (
        <div className="mb-8">
          <GraphTraversalVisualizer />
        </div>
      )}
      {slug === 'cpu-scheduling' && (
        <div className="mb-8">
          <CpuSchedulerVisualizer />
        </div>
      )}
      {slug === 'tcp-and-congestion-control' && (
        <div className="mb-8">
          <TcpPacketFlowVisualizer />
        </div>
      )}
      {slug === 'indexing-b-tree-hash' && (
        <div className="mb-8">
          <BTreeVisualizer />
        </div>
      )}
      {slug === 'finite-automata' && (
        <div className="mb-8">
          <FiniteAutomataVisualizer />
        </div>
      )}
      {slug === 'cpu-architecture-and-instruction-cycle' && (
        <div className="mb-8">
          <CpuRegisterVisualizer />
        </div>
      )}
      {slug === 'lexical-analysis' && (
        <div className="mb-8">
          <LexerVisualizer />
        </div>
      )}
      {slug === 'set-theory-and-mathematical-logic' && (
        <div className="mb-8">
          <TruthTableVisualizer />
        </div>
      )}
      {slug === 'dsa-hash-tables' && (
        <div className="mb-8">
          <HashTableVisualizer />
        </div>
      )}
      {slug === 'virtual-memory' && (
        <div className="mb-8 space-y-8">
          <MemoryPageReplacementVisualizer />
          <MmuAddressTranslationVisualizer />
        </div>
      )}
      {slug === 'pipelining-and-instruction-level-parallelism' && (
        <div className="mb-8">
          <PipelineHazardVisualizer />
        </div>
      )}
      {slug === 'stacks-and-queues' && (
        <div className="mb-8">
          <CallStackVisualizer />
        </div>
      )}
      {slug === 'algo-graph-algorithms' && (
        <div className="mb-8">
          <DijkstraGraphVisualizer />
        </div>
      )}
      {slug === 'dsa-trees' && (
        <div className="mb-8">
          <BstAvlVisualizer />
        </div>
      )}
      {slug === 'turing-machines-and-computability' && (
        <div className="mb-8">
          <TuringMachineVisualizer />
        </div>
      )}
      {slug === 'parsing-syntax-analysis' && (
        <div className="mb-8">
          <AstParserVisualizer />
        </div>
      )}
      {slug === 'synchronization-and-deadlocks' && (
        <div className="mb-8">
          <DeadlockBankerVisualizer />
        </div>
      )}
      {slug === 'heaps-and-priority-queues' && (
        <div className="mb-8">
          <HeapOperationsVisualizer />
        </div>
      )}
      {slug === 'memory-hierarchy-and-caching' && (
        <div className="mb-8">
          <CacheMappingVisualizer />
        </div>
      )}
      {slug === 'application-layer-protocols-http-dns' && (
        <div className="mb-8">
          <SlidingWindowVisualizer />
        </div>
      )}
      {slug === 'relational-model-and-sql' && (
        <div className="mb-8">
          <RelationalAlgebraVisualizer />
        </div>
      )}
      {slug === 'algo-dp' && (
        <div className="mb-8">
          <DpMatrixVisualizer />
        </div>
      )}
      {slug === 'digital-logic' && (
        <div className="mb-8">
          <AluBitwiseVisualizer />
        </div>
      )}
      {slug === 'asymmetric-cryptography-and-pki' && (
        <div className="mb-8">
          <RsaCryptoVisualizer />
        </div>
      )}
      {slug === 'regular-languages-and-regular-expressions' && (
        <div className="mb-8">
          <RegexNfaVisualizer />
        </div>
      )}
      {slug === 'ip-addressing-and-routing' && (
        <div className="mb-8">
          <SubnetCalculatorVisualizer />
        </div>
      )}
      {slug === 'caching-strategies' && (
        <div className="mb-8">
          <LruCacheVisualizer />
        </div>
      )}
      {slug === 'linear-algebra' && (
        <div className="mb-8">
          <MatrixTransformVisualizer />
        </div>
      )}
      {slug === 'boolean-algebra' && (
        <div className="mb-8">
          <KmapLogicVisualizer />
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="details" className="mb-8">
        <TabsList>
          <TabsTrigger value="details" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="prerequisites" className="gap-2">
            <Layers className="h-4 w-4" />
            Prerequisites
            {prerequisites && prerequisites.length > 0 && (
              <Badge variant="secondary" size="sm">
                {prerequisites.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="related" className="gap-2">
            <Link2 className="h-4 w-4" />
            Related
            {related && related.length > 0 && (
              <Badge variant="secondary" size="sm">
                {related.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Resources
            {resources && resources.length > 0 && (
              <Badge variant="secondary" size="sm">
                {resources.length}
              </Badge>
            )}
          </TabsTrigger>
          {careers?.careers && careers.careers.length > 0 && (
            <TabsTrigger value="careers" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Careers
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-6">
          {/* Main Summary / Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BookOpen className="text-primary-500 h-5 w-5" />
                Overview & Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {(node as { summary?: string }).summary || node.description || node.content ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {(node as { summary?: string }).summary || node.description || node.content}
                </p>
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  No summary available for this node.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          {extraMetadata.learning_outcomes && extraMetadata.learning_outcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Key Learning Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {extraMetadata.learning_outcomes.map((outcome: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {idx + 1}
                      </span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Common Mistakes */}
          {extraMetadata.common_mistakes && extraMetadata.common_mistakes.length > 0 && (
            <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Common Misconceptions & Mistakes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {extraMetadata.common_mistakes.map((mistake: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-amber-950 dark:text-amber-200"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Cross Domain Connections */}
          {extraMetadata.cross_domain_connections &&
            extraMetadata.cross_domain_connections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Cross-Domain Connections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extraMetadata.cross_domain_connections.map(
                    (conn: { target_slug: string; reason: string }, idx: number) => (
                      <Link
                        key={idx}
                        href={`/explore/${conn.target_slug}`}
                        className="group flex flex-col gap-1 rounded-lg border border-neutral-200 p-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-neutral-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                      >
                        <div className="flex items-center justify-between text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">
                          <span>{slugToTitle(conn.target_slug)}</span>
                          <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {conn.reason}
                        </p>
                      </Link>
                    ),
                  )}
                </CardContent>
              </Card>
            )}

          {/* Interview Questions */}
          {extraMetadata.interview_questions && extraMetadata.interview_questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <HelpCircle className="h-5 w-5 text-sky-500" />
                  Interview Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {extraMetadata.interview_questions.map((q: string, idx: number) => (
                    <li
                      key={idx}
                      className="rounded-md bg-neutral-50 p-3 text-sm font-medium text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                      Q: {q}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Coding Challenges */}
          {extraMetadata.coding_challenges && extraMetadata.coding_challenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Code className="h-5 w-5 text-purple-500" />
                  Coding Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {extraMetadata.coding_challenges.map(
                  (c: { title: string; description: string; difficulty?: string }, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-neutral-200 p-3.5 dark:border-neutral-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {c.title}
                        </h4>
                        {c.difficulty && (
                          <Badge variant={difficultyColors[c.difficulty] ?? 'info'} size="sm">
                            {c.difficulty}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        {c.description}
                      </p>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prerequisites" className="mt-6">
          {prerequisites && prerequisites.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {prerequisites.map((prereq) => (
                <Link key={prereq.id} href={`/explore/${prereq.slug}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            NODE_TYPE_COLORS[prereq.node_type] ?? 'var(--color-neutral-400)',
                        }}
                      >
                        {prereq.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                          {prereq.title}
                        </p>
                        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                          {slugToTitle(prereq.node_type)} · {slugToTitle(prereq.difficulty)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 dark:text-neutral-600" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Layers className="h-8 w-8" />}
              title="No prerequisites"
              description="This node has no prerequisites. You can start learning it right away."
            />
          )}
        </TabsContent>

        <TabsContent value="related" className="mt-6">
          {related && related.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((rel) => (
                <Link key={rel.id} href={`/explore/${rel.slug}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            NODE_TYPE_COLORS[rel.node_type] ?? 'var(--color-neutral-400)',
                        }}
                      >
                        {rel.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                          {rel.title}
                        </p>
                        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                          {slugToTitle(rel.node_type)} · {slugToTitle(rel.difficulty)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 dark:text-neutral-600" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Link2 className="h-8 w-8" />}
              title="No related nodes"
              description="No related concepts found for this node."
            />
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          {resources && resources.length > 0 ? (
            <div className="space-y-3">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="group cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        {resourceIcons[resource.resource_type] ?? <Globe className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                            {resource.title}
                          </p>
                          <Badge variant="secondary" size="sm" className="shrink-0 capitalize">
                            {resource.resource_type}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {resource.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                          {resource.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {resource.duration_minutes} min
                            </span>
                          )}
                          {resource.is_free && (
                            <Badge variant="success" size="sm">
                              Free
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Open
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No resources yet"
              description="Learning resources haven't been added for this node yet."
            />
          )}
        </TabsContent>

        {careers?.careers && careers.careers.length > 0 && (
          <TabsContent value="careers" className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {careers.careers.map((career) => (
                <Link key={career.id} href={`/careers/${career.id}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="bg-career-50 text-career-600 dark:bg-career-950/30 dark:text-career-400 flex h-9 w-9 items-center justify-center rounded-lg">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                          {career.title}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          Related career path
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Shell>
  );
}
