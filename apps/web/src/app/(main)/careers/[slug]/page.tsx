'use client';

import { Card, CardContent, Button, Badge, Progress, Skeleton } from '@sv-os/ui';
import {
  Briefcase,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Star,
  Target,
  Layers,
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

export default function CareerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: career, isLoading } = useCareer(slug);
  const { data: roadmap } = useCareerRoadmap(slug);

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

  // Career may include extra fields from API not in type definition
  const c = career as unknown as Record<string, unknown>;
  const requiredSkills = c.required_skills as string[] | undefined;
  const industry = c.industry as string | undefined;
  const seniority = c.seniority as string | undefined;

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

      {/* Career Stats */}
      <StaggerGrid className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlideUp delay={0}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Seniority</p>{' '}
                  <p className="text-sm font-semibold">{slugToTitle(seniority ?? 'entry')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.05}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success-50 text-success-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Demand</p>
                  <Badge variant="success" size="sm">
                    {slugToTitle(career.demand ?? 'stable')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.1}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-info-50 text-info-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Skills Required</p>
                  <p className="text-sm font-semibold">{requiredSkills?.length ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
        <SlideUp delay={0.15}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 text-warning-600 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Salary Range</p>
                  <p className="text-sm font-semibold">{career.salary_range ?? 'Variable'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </StaggerGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Required Skills */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <Layers className="mr-1.5 inline h-3.5 w-3.5" /> Required Skills
            </h2>
            <Card>
              <CardContent className="p-4">
                {requiredSkills && requiredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill: string, i: number) => (
                      <SlideUp key={skill} delay={i * 0.03}>
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1 py-1.5"
                        >
                          <CheckCircle2 className="text-success-500 h-3 w-3" />
                          {skill}
                        </Badge>
                      </SlideUp>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">No specific skills listed yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Industry & Details */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              <Briefcase className="mr-1.5 inline h-3.5 w-3.5" /> Career Details
            </h2>
            <Card>
              <CardContent className="space-y-3 p-4">
                {[
                  { label: 'Industry', value: industry },
                  { label: 'Seniority Level', value: seniority },
                  { label: 'Salary Range', value: career.salary_range },
                  { label: 'Market Demand', value: career.demand },
                ]
                  .filter(
                    (d: { value: string | undefined }): d is { label: string; value: string } =>
                      !!d.value,
                  )
                  .map((d) => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">{d.label}</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {slugToTitle(d.value)}
                      </span>
                    </div>
                  ))}
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
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Progress
              </h3>
              <Progress value={Math.random() * 100} size="sm" />
              <p className="mt-1 text-xs text-neutral-400">Estimated progress toward this career</p>
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
