/** Share links for a page URL — plain hrefs to the networks' share endpoints. */
export default function SocialShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const networks = [
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { key: 'pinterest', label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}` },
    { key: 'email', label: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];
  return (
    <ul className="social-share-links flex gap-3">
      {networks.map((network) => (
        <li key={network.key}>
          <a
            href={network.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-share-link social-share-${network.key} text-sm text-gray-500 hover:text-ink hover:underline`}
          >
            {network.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
