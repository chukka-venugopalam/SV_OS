'use client';

import type { CareerCertification } from '@sv-os/types';
import { Card, CardContent, Button, Badge, Progress, Skeleton } from '@sv-os/ui';
import {
  Briefcase,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Target,
  Building2,
  Award,
  FolderGit2,
  DollarSign,
  Brain,
  Server,
  Blocks,
  Cloud,
  Cpu,
  Shield,
  Database,
  LayoutTemplate,
  Gamepad2,
  BrainCircuit,
  Bot,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SlideUp, StaggerGrid } from '@/components/shared/animations';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useCareer, useCareerRoadmap } from '@/hooks/use-careers';
import { slugToTitle } from '@/lib';
import { ROUTES } from '@/lib/constants';

// All 12 career slugs are stable, hand-verified against the live DB — unlike
// knowledge node slugs, these aren't subject to the Act/District restructuring
// churn, so hardcoding is safe here. Every career currently has icon=null in
// the DB, so this is the only source of visual distinction until enriched.
const CAREER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'ai-engineer': Brain,
  'backend-engineer': Server,
  'blockchain-engineer': Blocks,
  'cloud-devops-engineer': Cloud,
  'compiler-engineer': Cpu,
  'cybersecurity-engineer': Shield,
  'data-engineer-data-scientist': Database,
  'frontend-engineer': LayoutTemplate,
  'game-developer': Gamepad2,
  'ml-engineer': BrainCircuit,
  'robotics-engineer': Bot,
  'systems-kernel-engineer': Cpu,
};

export default function CareerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: career, isLoading } = useCareer(slug);
  const { data: roadmap } = useCareerRoadmap(slug);
  const CareerIcon = CAREER_ICONS[slug] ?? Briefcase;

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (!career) {
    return (
      <Shell>
        <PageHeader
          title="Career Not Found"
          description="The career path you're looking for doesn't exist."
        />
      </Shell>
    );
  }

  const c = career as unknown as Record<string, unknown>;
  const meta = (c.extra_metadata as Record<string, unknown>) || {};
  const linkedProjects =
    (c.linked_projects as string[]) || (meta.linked_projects as string[]) || [];
  const companiesHiring =
    (c.companies_hiring as string[]) || (meta.companies_hiring as string[]) || [];
  const certifications =
    (c.certifications as Array<CareerCertification | string>) ||
    (meta.certifications as Array<CareerCertification | string>) ||
    [];
  const salaryRange =
    (c.salary_range as string) ||
    (c.average_salary as string) ||
    (meta.salary_range as string) ||
    'Variable';
  const demandLevel = (c.demand_level as string) || (c.demand as string) || 'high_demand';

  return (
    <Shell>
      <div className="bg-career-50 text-career-600 dark:bg-career-950/30 dark:text-career-400 mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
        <CareerIcon className="h-6 w-6" />
      </div>
      <PageHeader
        title={career.title}
        description={career.description}
        breadcrumbs={[{ label: 'Careers', href: ROUTES.CAREERS }, { label: career.title }]}
        actions={
          <div className="flex gap-2">
            <Link href={ROUTES.CAREERS}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" /> All Careers
              </Button>
            </Link>
          </div>
        }
      />

      {/* Career Header Stats */}
      <StaggerGrid className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlideUp delay={0}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success-50 text-success-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Market Demand</p>
                  <Badge variant="success" size="sm" className="mt-0.5 capitalize">
                    {slugToTitle(demandLevel.replace(/_/g, ' '))}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.05}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 text-warning-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-500">Compensation</p>
                  <p
                    className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100"
                    title={salaryRange}
                  >
                    {salaryRange.slice(0, 35)}
                    {salaryRange.length > 35 ? '...' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.1}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Linked Projects</p>
                  <p className="text-sm font-semibold">{linkedProjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.15}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-info-50 text-info-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Top Employers</p>
                  <p className="text-sm font-semibold">{companiesHiring.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </StaggerGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Linked Hands-On Projects */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <FolderGit2 className="text-primary-500 mr-1.5 inline h-4 w-4" /> Linked Hands-On
              Projects
            </h2>
            {linkedProjects.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {linkedProjects.map((pSlug: string, i: number) => (
                  <SlideUp key={pSlug} delay={i * 0.05}>
                    <Link href={`/projects/${pSlug}`}>
                      <Card className="hover:border-primary-300 dark:hover:border-primary-700 group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-lg">
                              <FolderGit2 className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {slugToTitle(pSlug)}
                              </h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Hands-on build project
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="group-hover:text-primary-500 h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-1" />
                        </CardContent>
                      </Card>
                    </Link>
                  </SlideUp>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-xs text-neutral-500">
                  Independent career track — foundation nodes cover theory and algorithms.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Companies Hiring */}
          {companiesHiring.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                <Building2 className="text-info-500 mr-1.5 inline h-4 w-4" /> Top Hiring Companies
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {companiesHiring.map((company: string, i: number) => (
                      <SlideUp key={company} delay={i * 0.03}>
                        <Badge
                          variant="secondary"
                          size="md"
                          className="flex items-center gap-1.5 py-1.5 text-xs font-medium"
                        >
                          <Building2 className="h-3 w-3 text-neutral-400" />
                          {company}
                        </Badge>
                      </SlideUp>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Industry Certifications */}
          {certifications.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                <Award className="text-warning-500 mr-1.5 inline h-4 w-4" /> Industry Certifications
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {certifications.map((cert: CareerCertification | string, idx: number) => {
                      const name = typeof cert === 'string' ? cert : cert?.name || '';
                      const url = typeof cert === 'object' && cert !== null ? cert?.url : undefined;
                      const note =
                        typeof cert === 'object' && cert !== null ? cert?.note : undefined;

                      return (
                        <div
                          key={name || idx}
                          className="flex items-center justify-between gap-2 text-xs text-neutral-700 dark:text-neutral-300"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-success-500 h-3.5 w-3.5 shrink-0" />
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1 font-medium hover:underline"
                              >
                                <span>{name}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span>{name}</span>
                            )}
                          </div>
                          {note && (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              {note}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Market Demand & Compensation Breakdown */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <DollarSign className="text-success-500 mr-1.5 inline h-4 w-4" /> Compensation &
              Market Analysis
            </h2>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Salary Range (India & Global)
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {salaryRange}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Roadmap status — was a hardcoded 40% with no backing data.
              career_requirements is empty for all careers (verified live),
              so this now honestly reflects that rather than fabricating a
              number. */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Curriculum Roadmap
              </h3>
              {roadmap && roadmap.total_requirements > 0 ? (
                <>
                  <Progress value={0} size="sm" />
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {roadmap.total_requirements} node
                    {roadmap.total_requirements !== 1 ? 's' : ''} mapped to this career path.
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Per-career curriculum sequencing hasn&apos;t been built for this career yet.
                  Explore the GATE-core path in the meantime.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Link href={ROUTES.LEARNING_PATH}>
              <Button variant="default" size="sm" className="w-full gap-2">
                <BookOpen className="h-4 w-4" /> Explore GATE-Core Path
              </Button>
            </Link>
            <Link href={ROUTES.PROGRESS}>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Target className="h-4 w-4" /> Track Progress
              </Button>
            </Link>
            <Link href="/learning">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ArrowRight className="h-4 w-4" /> Learning Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
