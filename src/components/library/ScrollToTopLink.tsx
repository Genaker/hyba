/** Fixed back-to-top anchor — targets the page-top element id (default "top").
 *  Smooth scrolling comes from CSS `scroll-behavior` at the use site. */
export default function ScrollToTopLink({ targetId = 'top', label = 'Back to top' }: { targetId?: string; label?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="scroll-to-top fixed bottom-6 right-6 z-40 rounded-full border border-mist bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink shadow-lg hover:bg-mist"
    >
      ↑ <span className="scroll-to-top-label">{label}</span>
    </a>
  );
}
