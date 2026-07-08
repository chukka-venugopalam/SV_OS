'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { useKnowledgeNode, useNodePrerequisites, useRelatedNodes, useNodeResources, useNodeCareers } from '@/hooks/use-knowledge';
import { useIsBookmarked, useToggleBookmark, useIsFavorited, useAddFavorite } from '@/hooks/use-bookmarks';
import { useAuth } from '@/providers/auth-provider';
import { Shell } from '@/components/shared/shell';
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
  LoadingState,
  ErrorState,
} from '@sv-os/ui';
import { cn, slugToTitle } from '@/lib';
import { NODE_TYPE_COLORS } from '@/components/graph';

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
            <Badge variant="secondary" size="sm" className="capitalize mb-1">
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
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {node.description}
        </p>

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
              <Badge variant="secondary" size="sm">{prerequisites.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="related" className="gap-2">
            <Link2 className="h-4 w-4" />
            Related
            {related && related.length > 0 && (
              <Badge variant="secondary" size="sm">{related.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Resources
            {resources && resources.length > 0 && (
              <Badge variant="secondary" size="sm">{resources.length}</Badge>
            )}
          </TabsTrigger>
          {careers?.careers && careers.careers.length > 0 && (
            <TabsTrigger value="careers" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Careers
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardContent className="prose prose-neutral max-w-none p-6 dark:prose-invert">
              {node.content ? (
                <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {node.content}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 dark:text-neutral-500">No additional details available for this node.</p>
              )}
            </CardContent>
          </Card>

          {node.metadata && Object.keys(node.metadata).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(node.metadata as Record<string, unknown>).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-neutral-900 dark:text-neutral-100">{String(value ?? '')}</dd>
                    </div>
                  ))}
                </dl>
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
                        style={{ backgroundColor: NODE_TYPE_COLORS[prereq.node_type] ?? 'var(--color-neutral-400)' }}
                      >
                        {prereq.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                          {prereq.title}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
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
                        style={{ backgroundColor: NODE_TYPE_COLORS[rel.node_type] ?? 'var(--color-neutral-400)' }}
                      >
                        {rel.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                          {rel.title}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                        {resourceIcons[resource.resource_type] ?? <Globe className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                            {resource.title}
                          </p>
                          <Badge variant="secondary" size="sm" className="shrink-0 capitalize">
                            {resource.resource_type}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
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
                            <Badge variant="success" size="sm">Free</Badge>
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-career-50 text-career-600 dark:bg-career-950/30 dark:text-career-400">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
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
