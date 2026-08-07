/** Ordered fulfillment steps with everything up to `currentIndex` marked done. */
export default function OrderTimeline({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <ol className="order-timeline flex flex-col gap-1.5">
      {steps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li key={step} className={`order-timeline-step order-timeline-step-${state} flex items-center gap-2 text-sm`}>
            <span
              aria-hidden
              className={`order-timeline-marker h-2.5 w-2.5 rounded-full ${state === 'done' ? 'bg-green-600' : state === 'current' ? 'bg-brand-600' : 'bg-gray-300'}`}
            />
            <span className={state === 'upcoming' ? 'text-gray-400' : 'text-ink'}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
