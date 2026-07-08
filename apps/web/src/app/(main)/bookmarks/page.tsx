'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Heart,
  ArrowRight,
  BookmarkX,
  Trash2,
} from 'lucide-react';
import { useBookmarks, useFavorites, useToggleBookmark, useRemoveFavorite } from '@/hooks/use-bookmarks';
import { Shell } from '@/components/shared/shell';
import { PageHeader } from '@/components/shared/page-header';
import {
  Button,
  Card,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Skeleton,
  EmptyState,
  Pagination,
} from '@sv-os/ui';
import { slugToTitle } from '@/lib';
import { NODE_TYPE_COLORS } from '@/components/graph';

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('bookmarks');

  const { data: bookmarks, isLoading: bookmarksLoading } = useBookmarks({ page, page_size: 12 });
  const { data: favorites, isLoading: favoritesLoading } = useFavorites({ page, page_size: 12 });
  const toggleBookmark = useToggleBookmark();
  const removeFavorite = useRemoveFavorite();

  return (
    <Shell>
      <PageHeader
        title="Bookmarks & Favorites"
        description="Your saved learning resources"
        breadcrumbs={[{ label: 'Bookmarks' }]}
      />

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="bookmarks" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Bookmarks
            {bookmarks && <Badge variant="secondary" size="sm">{bookmarks.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="h-4 w-4" />
            Favorites
            {favorites && <Badge variant="secondary" size="sm">{favorites.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className="mt-6">
          {bookmarksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : bookmarks && bookmarks.items.length > 0 ? (
            <>
              <div className="space-y-2">
                {bookmarks.items.map((bookmark) => (
                  <Card key={bookmark.id} className="group transition-all hover:shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
                        <Bookmark className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/explore/${bookmark.node_slug || bookmark.node_id}`}>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {bookmark.node_title}
                          </p>
                        </Link>
                        <Badge variant="secondary" size="sm" className="capitalize">
                          {bookmark.node_type}
                        </Badge>
                      </div>
                      <button
                        onClick={() => toggleBookmark.mutate(bookmark.node_id)}
                        className="shrink-0 text-neutral-400 hover:text-error-500 transition-colors p-1"
                        aria-label="Remove bookmark"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {bookmarks.total_pages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={bookmarks.page} totalPages={bookmarks.total_pages} onPageChange={setPage} />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={<Bookmark className="h-12 w-12" />}
                  title="No bookmarks yet"
                  description="Bookmark concepts to save them for later"
                  action={{ label: 'Explore', onClick: () => window.location.href = '/explore' }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {favoritesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : favorites && favorites.items.length > 0 ? (
            <>
              <div className="space-y-2">
                {favorites.items.map((fav) => (
                  <Card key={fav.id} className="group transition-all hover:shadow-sm">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${NODE_TYPE_COLORS[fav.node_type] ?? 'var(--color-neutral-400)'}15` }}
                      >
                        <Heart className="h-4 w-4" style={{ color: NODE_TYPE_COLORS[fav.node_type] ?? 'var(--color-neutral-400)' }} />
                      </div>
                      <div className="min-w-0 flex-1">                          <Link href={`/explore/${fav.node_slug || fav.node_id}`}>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {fav.node_title}
                          </p>
                        </Link>
                        <Badge variant="secondary" size="sm" className="capitalize">{fav.node_type}</Badge>
                      </div>
                      <button
                        onClick={() => removeFavorite.mutate(fav.node_id)}
                        className="shrink-0 text-neutral-400 hover:text-error-500 transition-colors p-1"
                        aria-label="Remove from favorites"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {favorites.total_pages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={favorites.page} totalPages={favorites.total_pages} onPageChange={setPage} />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={<Heart className="h-12 w-12" />}
                  title="No favorites yet"
                  description="Favorite concepts you love"
                  action={{ label: 'Explore', onClick: () => window.location.href = '/explore' }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
