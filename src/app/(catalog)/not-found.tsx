import Link from 'next/link';
import Container from '@/theme/Container';

export default function NotFound() {
  return (
    <Container size="xl" className="py-20 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-gray-600">The page you are looking for doesn’t exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
        Back to Home
      </Link>
    </Container>
  );
}
