'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { useProject, useProjectRequirements } from '@/hooks/use-projects';
import { Shell } from '@/components/shared/shell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  ErrorState,
  EmptyState,
} from '@sv-os/ui';
import { slugToTitle } from '@/lib';
import { NODE_TYPE_COLORS } from '@/components/graph';

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
          <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
        </div>
      </Shell>
    );
  }

  if (isError || !project) {
    return (
      <Shell>
        <ErrorState title="Project not found" message="This project doesn't exist or has been removed." />
      </Shell>
    );
  }

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-project-50 text-project-600 dark:bg-project-950/30 dark:text-project-400">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <Badge variant={difficultyColors[project.difficulty] ?? 'secondary'} size="sm">
            {slugToTitle(project.difficulty)}
          </Badge>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-neutral-900 dark:text-neutral-50">{project.title}</h1>
        <p className="mb-4 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">{project.description}</p>

        <div className="flex flex-wrap items-center gap-3">
          {project.estimated_time && (
            <Badge variant="secondary" size="sm" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {project.estimated_time}
            </Badge>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                Source code
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                Live demo
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Tech Stack</h2>
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
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Knowledge Requirements</h2>

          {requirements.required.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <CheckCircle2 className="mr-1 inline h-3 w-3 text-error-500" />
                Required
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {requirements.required.map((node) => (
                  <Link key={node.id} href={`/explore/${node.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)' }}
                        >{node.title.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{node.title}</p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{slugToTitle(node.difficulty)}</p>
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
              <h3 className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <BookOpen className="mr-1 inline h-3 w-3 text-info-500" />
                Recommended
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {requirements.recommended.map((node) => (
                  <Link key={node.id} href={`/explore/${node.slug}`}>
                    <Card className="group cursor-pointer transition-all hover:shadow-sm">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white" style={{ backgroundColor: NODE_TYPE_COLORS[node.node_type] ?? 'var(--color-neutral-400)' }}>{node.title.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{node.title}</p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{slugToTitle(node.difficulty)}</p>
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
