import { Link } from 'react-router-dom';

export default function SignupBanner() {
  return <section aria-labelledby="signup-banner-title" className="mt-14 rounded-3xl bg-sky-600 px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-9">
    <div><h2 id="signup-banner-title" className="text-2xl font-semibold">Make everyday shopping easier</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Create a free account for faster checkout and order tracking.</p><p className="mt-3 text-sm">Already a member? <Link to="/login" className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Sign in</Link></p></div>
    <Link to="/register" className="mt-5 inline-flex shrink-0 rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 sm:mt-0">Sign up</Link>
  </section>;
}
