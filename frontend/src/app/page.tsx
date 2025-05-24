
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/inbox');
  // Note: redirect() must be called before any JSX is returned.
  // For components that might return JSX before redirecting, ensure redirect is unconditional or handled by a Suspense boundary if data fetching is involved.
  // Here, it's a simple top-level redirect.
  return null; // Or <></> if your linter prefers, but redirect makes this unreachable.
}
