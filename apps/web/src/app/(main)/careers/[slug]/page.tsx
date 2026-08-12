'use client';

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
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SlideUp, StaggerGrid } from '@/components/shared/animations';
import { PageHeader } from '@/components/shared/page-header';
import { Shell } from '@/components/shared/shell';
import { useCareer, useCareerRoadmap } from '@/hooks/use-careers';
import { slugToTitle } from '@/lib';
import { ROUTES } from '@/lib/constants';

export default function CareerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: career, isLoading } = useCareer(slug);
  useCareerRoadmap(slug);

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
  const certifications = (c.certifications as string[]) || (meta.certifications as string[]) || [];
  const salaryRange =
    (c.salary_range as string) ||
    (c.average_salary as string) ||
    (meta.salary_range as string) ||
    'Variable';
  const demandLevel = (c.demand_level as string) || (c.demand as string) || 'high_demand';

  return (
    <Shell>
      <PageHeader
        title={career.title}
        description={career.description}
        breadcrumbs={[{ label: 'Careers', href: ROUTES.CAREERS }, { label: career.title }]}
        actions={
          <div className="flex gap-2">
            <Link href={ROUTES.CAREERS}>
              <Button variant="outline" size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" /> Compare Careers
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
                    {certifications.map((cert: string) => (
                      <div
                        key={cert}
                        className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300"
                      >
                        <CheckCircle2 className="text-success-500 h-3.5 w-3.5 shrink-0" />
                        <span>{cert}</span>
                      </div>
                    ))}
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
          {/* Skill Gap */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Path Mastery Progress
              </h3>
              <Progress value={40} size="sm" />
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                40% of foundational CS nodes completed toward this career path.
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Link href={`${ROUTES.EXPLORE}?career=${slug}`}>
              <Button variant="default" size="sm" className="w-full gap-2">
                <BookOpen className="h-4 w-4" /> View Learning Path
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
