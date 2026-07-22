'use client';

import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  EmptyState,
  Pagination,
} from '@sv-os/ui';
import { FolderGit2, Search, Github, Globe, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, memo } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useDebounce } from '@/hooks/use-debounce';
import { useProjects } from '@/hooks/use-projects';
import { slugToTitle } from '@/lib';

const difficultyColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
  expert: 'danger',
};

const ProjectCard = memo(function ProjectCard({
  project,
}: {
  project: {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: string;
    tech_stack: string[];
    estimated_time: string;
    github_url: string | null;
    demo_url: string | null;
  };
}) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="group h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="bg-project-50 text-project-600 dark:bg-project-950/30 dark:text-project-400 flex h-10 w-10 items-center justify-center rounded-lg">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <Badge variant={difficultyColors[project.difficulty] ?? 'secondary'} size="sm">
              {slugToTitle(project.difficulty)}
            </Badge>
          </div>
          <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-1 text-base font-semibold text-neutral-900 transition-colors dark:text-neutral-100">
            {project.title}
          </h3>
          <p className="mb-3 line-clamp-2 flex-1 text-xs text-neutral-500 dark:text-neutral-400">
            {project.description}
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="outline" size="sm">
                {tech}
              </Badge>
            ))}
            {project.tech_stack.length > 4 && (
              <Badge variant="secondary" size="sm">
                +{project.tech_stack.length - 4}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
            {project.estimated_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {project.estimated_time}
              </span>
            )}
            <div className="flex items-center gap-2">
              {project.github_url && <Github className="h-3.5 w-3.5" />}
              {project.demo_url && <Globe className="h-3.5 w-3.5" />}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useProjects({
    page,
    page_size: 12,
    search: debouncedSearch || undefined,
    difficulty: difficulty || undefined,
  });

  return (
    <Shell>
      <PageHeader
        title="Projects"
        description="Build real-world projects to reinforce your learning"
        breadcrumbs={[{ label: 'Projects' }]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects..."
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
        <Select
          value={difficulty}
          onValueChange={(v: string) => {
            setDifficulty(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-3 h-3 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-error-600 dark:text-error-400 mb-3 text-sm">
              Failed to load projects
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="mb-4 text-xs text-neutral-400 dark:text-neutral-500">
            {data.total} projects found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {data.total_pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={data.page}
                totalPages={data.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<FolderGit2 className="h-12 w-12" />}
              title="No projects found"
              description={
                debouncedSearch
                  ? `No projects matching "${debouncedSearch}"`
                  : 'No projects available yet'
              }
              action={
                search || difficulty
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSearch('');
                        setDifficulty('');
                        setPage(1);
                      },
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}
