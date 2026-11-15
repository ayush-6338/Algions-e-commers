import useHomeResources from '../../hooks/useHomeResources.js';
import HeroSection from '../../components/home/HeroSection.jsx';
import TrustStrip from '../../components/home/TrustStrip.jsx';
import CategoryTiles from '../../components/home/CategoryTiles.jsx';
import ProductRow from '../../components/home/ProductRow.jsx';
import ValueCards from '../../components/home/ValueCards.jsx';
import SignupBanner from '../../components/home/SignupBanner.jsx';
import FaqAccordion from '../../components/home/FaqAccordion.jsx';

export default function LandingHome() {
  const { resources, retry } = useHomeResources(['categories', 'featured', 'newArrivals']);
  const categories = resources.categories;
  const featured = resources.featured;
  const newArrivals = resources.newArrivals;
  return <div className="space-y-0">
    <HeroSection featured={featured.data} />
    <TrustStrip />
    <CategoryTiles categories={categories.data} loading={categories.loading} error={categories.error} onRetry={() => retry('categories')} />
    <ProductRow id="featured-products" title="Featured products" products={featured.data} loading={featured.loading} error={featured.error} onRetry={() => retry('featured')} />
    <ProductRow id="new-arrivals" title="New arrivals" products={newArrivals.data} loading={newArrivals.loading} error={newArrivals.error} onRetry={() => retry('newArrivals')} horizontal />
    <ValueCards />
    <SignupBanner />
    <FaqAccordion />
  </div>;
}
