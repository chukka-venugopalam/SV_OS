'use client';

import { Card, CardContent, Badge, Button, Skeleton, ErrorState, EmptyState } from '@sv-os/ui';
import {
  ArrowLeft,
  FolderGit2,
  Github,
  Globe,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { NODE_TYPE_COLORS } from '@/components/graph';
import { Shell } from '@/components/shared/shell';
import { useProject, useProjectRequirements } from '@/hooks/use-projects';
import { slugToTitle } from '@/lib';

const difficultyColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
  expert: 'danger',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: project, isLoading, isError } = useProject(slug);
  const { data: requirements } = useProjectRequirements(slug);

  if (isLoading) {
    return (
      <Shell maxWidth="4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </Shell>
    );
  }

  if (isError || !project) {
    return (
      <Shell>
        <ErrorState
          title="Project not found"
          message="This project doesn't exist or has been removed."
        />
      </Shell>
    );
  }

  const pObj = project as unknown as Record<string, unknown>;
  const meta = (pObj.extra_metadata as Record<string, unknown>) || {};
  const referenceRepos =
    (pObj.reference_repos as Array<{ title?: string; url?: string; note?: string }>) ||
    (meta.reference_repos as Array<{ title?: string; url?: string; note?: string }>) ||
    [];
  const primaryGithubUrl = project.github_url || referenceRepos[0]?.url;

  return (
    <Shell maxWidth="4xl">
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-project-50 text-project-600 dark:bg-project-950/30 dark:text-project-400 flex h-12 w-12 items-center justify-center rounded-xl">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <Badge variant={difficultyColors[project.difficulty] ?? 'secondary'} size="sm">
            {slugToTitle(project.difficulty)}
          </Badge>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          {project.title}
        </h1>
        <p className="mb-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          {project.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {project.estimated_time && (
            <Badge variant="secondary" size="sm" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {project.estimated_time}
            </Badge>
          )}
          {primaryGithubUrl && (
            <a href={primaryGithubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                GitHub Repository
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                Live Demo
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* GitHub Reference Repositories Section */}
      {referenceRepos.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Github className="mr-1.5 inline h-4 w-4 text-neutral-900 dark:text-neutral-100" />
            GitHub Reference Repositories & Study Implementations
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {referenceRepos.map((repo, idx) => (
              <Card
                key={repo.url || idx}
                className="flex flex-col justify-between p-4 transition-all hover:shadow-md"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      <Github className="text-primary-600 dark:text-primary-400 h-4 w-4" />
                      {repo.title || 'Reference Repository'}
                    </h3>
                  </div>
                  {repo.note && (
                    <p className="mb-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {repo.note}
                    </p>
                  )}
                </div>
                {repo.url && (
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="mt-2">
                    <Button variant="outline" size="xs" className="w-full gap-1.5 text-xs">
                      Open Repository <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Draws on Domains Callout */}
      {(project as unknown as { domains_crossed?: string[] }).domains_crossed &&
        ((project as unknown as { domains_crossed?: string[] }).domains_crossed?.length ?? 0) >
          0 && (
          <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              ⚡ Draws on knowledge domains:
            </h2>
            <div className="flex flex-wrap gap-2">
              {(project as unknown as { domains_crossed: string[] }).domains_crossed.map(
                (domain) => (
                  <Badge
                    key={domain}
                    variant="secondary"
                    size="md"
                    className="bg-white dark:bg-neutral-800"
                  >
                    {domain}
                  </Badge>
                ),
              )}
            </div>
          </div>
        )}

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.tech_stack.map((tech) => (
              <Badge key={tech} variant="secondary" size="lg" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Requirements */}
      {requirements && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Knowledge Requirements
          </h2>

          {requirements.required.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <CheckCircle2 className="text-error-500 mr-1 inline h-3 w-3" />
                Required
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {requirements.required.map((node) => (
                  <Link key={node.id} href={`/explore/${node.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)',
                          }}
                        >
                          {node.title.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {node.title}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            {slugToTitle(node.difficulty)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 group-hover:opacity-100" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {requirements.recommended.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <BookOpen className="text-info-500 mr-1 inline h-3 w-3" />
                Recommended
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {requirements.recommended.map((node) => (
                  <Link key={node.id} href={`/explore/${node.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)',
                          }}
                        >
                          {node.title.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {node.title}
                          </p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            {slugToTitle(node.difficulty)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 opacity-0 group-hover:opacity-100" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {requirements.required.length === 0 && requirements.recommended.length === 0 && (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No requirements listed"
              description="Knowledge requirements haven't been defined for this project yet."
            />
          )}
        </div>
      )}
    </Shell>
  );
}
