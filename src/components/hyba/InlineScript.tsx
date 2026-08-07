import { escapeInlineScript } from '@/lib/hyva/inline';

/**
 * Emits a classic (non-module) inline `<script>` — parser-executed immediately as the HTML
 * streams in, which is what Alpine component factories need: every `window.init*` factory must
 * already exist by the time the (deferred, `type="module"`) bootstrap script calls
 * `Alpine.start()`. `dangerouslySetInnerHTML` is required here — plain JSX children would get
 * HTML-escaped as text instead of emitted as the tag's raw source.
 */
export default function InlineScript({ code }: { code: string }) {
  return <script dangerouslySetInnerHTML={{ __html: escapeInlineScript(code) }} />;
}
