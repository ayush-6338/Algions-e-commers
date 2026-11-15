import { useCallback, useMemo } from 'react';
import { getByIds, getFeatured, getProducts } from '../../services/productService.js';
import useHomeResources from '../../hooks/useHomeResources.js';
import useHomeSection from '../../hooks/useHomeSection.js';
import useRecentlyViewed from '../../hooks/useRecentlyViewed.js';
import WelcomeRow from '../../components/home/WelcomeRow.jsx';
import QuickActions from '../../components/home/QuickActions.jsx';
import ProductRow from '../../components/home/ProductRow.jsx';

export default function MemberHome({ user }) {
  const { ids, lastCategorySlug, clearRecentlyViewed } = useRecentlyViewed(user);
  const { resources, retry } = useHomeResources(['featured', 'bestSellers', 'newArrivals']);
  const idsKey = ids.join(',');
  const recentlyViewedLoader = useCallback(() => getByIds(ids), [ids]);
  const recent = useHomeSection(recentlyViewedLoader, idsKey);
  const excludedIds = useMemo(() => new Set(ids), [ids]);
  const pickedLoader = useCallback(async () => {
    const candidates = [];
    const seen = new Set(excludedIds);
    if (lastCategorySlug) {
      const response = await getProducts({ category: lastCategorySlug, limit: 48, sort: 'newest' });
      response.data.forEach((product) => { const id = String(product._id); if (!seen.has(id)) { seen.add(id); candidates.push(product); } });
    }
    if (candidates.length < 4) (await getFeatured(8)).forEach((product) => { const id = String(product._id); if (!seen.has(id)) { seen.add(id); candidates.push(product); } });
    return candidates.slice(0, 4);
  }, [lastCategorySlug, excludedIds]);
  const picked = useHomeSection(pickedLoader, `${lastCategorySlug}:${idsKey}`);

  return <div>
    <WelcomeRow user={user} />
    <QuickActions />
    {ids.length > 0 && <ProductRow id="continue-browsing" title="Continue browsing" products={recent.data} loading={recent.loading} error={recent.error} onRetry={recent.retry} extraAction={<button type="button" onClick={clearRecentlyViewed} className="text-sm text-stone-700 underline underline-offset-4 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">Clear history</button>} />}
    <ProductRow id="picked-for-you" title="Picked for you" products={picked.data} loading={picked.loading} error={picked.error} onRetry={picked.retry} />
    <ProductRow id="member-best-sellers" title="Best sellers" products={resources.bestSellers.data} loading={resources.bestSellers.loading} error={resources.bestSellers.error} onRetry={() => retry('bestSellers')} />
    <ProductRow id="member-new-arrivals" title="New arrivals" products={resources.newArrivals.data} loading={resources.newArrivals.loading} error={resources.newArrivals.error} onRetry={() => retry('newArrivals')} horizontal />
  </div>;
}
