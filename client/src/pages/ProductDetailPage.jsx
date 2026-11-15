import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../services/productService.js';
import { Badge, Breadcrumb, EmptyState, ErrorState, money, Skeleton } from '../components/catalogue/CatalogueComponents.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useRecentlyViewed from '../hooks/useRecentlyViewed.js';
import SafeImage from '../components/common/SafeImage.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState('');
  const { user } = useAuth();
  const { addRecentlyViewed } = useRecentlyViewed(user);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setProduct(null);
    getProduct(slug).then((value) => {
      if (active) { setProduct(value); setImageIndex(0); setVariantId(value.variants?.[0]?._id || ''); setLoading(false); }
    }).catch((requestError) => {
      if (active) { setError(requestError.response?.data?.message || 'Could not load this product.'); setLoading(false); }
    });
    return () => { active = false; };
  }, [slug, retry]);

  useEffect(() => { if (product) addRecentlyViewed(product); }, [product, addRecentlyViewed]);

  const selectedVariant = useMemo(() => product?.variants?.find((variant) => variant._id === variantId), [product, variantId]);
  const stock = selectedVariant ? selectedVariant.stock : product?.totalStock || 0;
  const price = selectedVariant?.price ?? product?.price ?? 0;
  const images = product?.images?.length ? product.images : [];
  function chooseVariant(id) { setVariantId(id); setQuantity(1); }
  async function handleAddToCart() {
    if (!user) { navigate('/login', { state: { from: { pathname: `/products/${slug}` } } }); return; }
    try {
      await addItem({ productId: product._id, variantId: variantId || undefined, quantity });
      setToast('Added to your cart.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Could not add this item to your cart.');
    }
    window.setTimeout(() => setToast(''), 3500);
  }

  if (loading) return <Skeleton count={1} />;
  if (error) return <ErrorState message={error} onRetry={() => setRetry((value) => value + 1)} />;
  if (!product) return <EmptyState title="Product not found" message="This product may have been removed or is unavailable." />;

  return <>
    <Breadcrumb items={[{ label: 'Shop', to: '/shop' }, ...(product.category ? [{ label: product.category.name, to: `/shop?category=${product.category.slug}` }] : []), { label: product.name }]} />
    <div className="grid gap-9 lg:grid-cols-2">
      <section aria-label={`${product.name} images`}>
        <div className="aspect-square overflow-hidden rounded-3xl bg-[#e8e5dc]">
          <SafeImage src={images[imageIndex]} alt={`${product.name} view ${imageIndex + 1}`} className="h-full w-full object-cover" />
        </div>
        {images.length > 1 && <div className="mt-3 flex gap-3">{images.map((image, index) => <button key={image} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${imageIndex === index ? 'border-teal-800' : 'border-transparent'}`}><SafeImage src={image} alt="" width={80} height={80} className="h-full w-full object-cover" /></button>)}</div>}
      </section>
      <section className="py-2">
        <p className="text-xs uppercase tracking-widest text-teal-800">{product.brand || 'SkyKart'}</p>
        <h1 className="mt-2 text-3xl font-medium md:text-4xl">{product.name}</h1>
        {product.category && <Link to={`/shop?category=${product.category.slug}`} className="mt-2 inline-block text-sm text-stone-600 underline underline-offset-4">{product.category.name}</Link>}
        <p className="mt-4 text-sm text-stone-600" aria-label={`${product.ratingAverage} out of 5 stars`}>★ {Number(product.ratingAverage || 0).toFixed(1)} <span className="text-stone-400">({product.ratingCount || 0} ratings)</span></p>
        <div className="mt-4 flex items-baseline gap-3"><p className="text-2xl font-semibold">{money(price)}</p>{product.compareAtPrice > price && <del className="text-stone-400">{money(product.compareAtPrice)}</del>}</div>
        <p className="mt-5 leading-7 text-stone-600">{product.description}</p>
        {product.variants?.length > 0 && <fieldset className="mt-6"><legend className="mb-2 text-sm font-medium">Choose an option</legend><div className="flex flex-wrap gap-2">{product.variants.map((variant) => <button key={variant._id} type="button" aria-pressed={variantId === variant._id} onClick={() => chooseVariant(variant._id)} className={`rounded-xl border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${variantId === variant._id ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`}>{variant.label}{variant.stock < 1 ? ' · Sold out' : ''}</button>)}</div></fieldset>}
        <div className="mt-5">{stock > 0 ? <Badge tone={stock <= 5 ? 'amber' : 'teal'}>{stock <= 5 ? `Only ${stock} left` : 'In stock'}</Badge> : <Badge tone="red">Out of stock</Badge>}</div>
        <label className="mt-5 block max-w-32 text-sm font-medium" htmlFor="product-quantity">Quantity<input id="product-quantity" className="mt-1 w-full rounded-xl border border-stone-300 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" type="number" min="1" max={Math.max(stock, 1)} disabled={stock < 1} value={quantity} onChange={(event) => setQuantity(Math.min(stock, Math.max(1, Number(event.target.value) || 1)))} /></label>
        <button type="button" disabled={stock < 1} onClick={handleAddToCart} className="mt-6 w-full rounded-xl bg-stone-900 px-6 py-4 text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Add to cart</button>
        <p aria-live="polite" role={toast ? 'status' : undefined} className="mt-3 min-h-6 text-sm text-teal-800">{toast}</p>
      </section>
    </div>
  </>;
}
