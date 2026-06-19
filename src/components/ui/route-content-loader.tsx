import { PageListLoadingState } from '@/components/ui/page-states';

export function RouteContentLoader() {
  return <PageListLoadingState itemCount={3} itemHeightClassName="h-64" />;
}
