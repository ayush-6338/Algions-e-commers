import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { CartIcon } from './Icons.jsx';

export default function CartButton() {
  const { itemCount } = useCart();
  const count = itemCount > 9 ? '9+' : itemCount;
  return <Link to="/cart" aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-900 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
    <CartIcon />
    {itemCount > 0 && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-semibold text-white">{count}</span>}
  </Link>;
}
