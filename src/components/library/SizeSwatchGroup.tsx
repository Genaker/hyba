export type SizeOption = { value: string; label: string; available?: boolean };

/** Radio group of text size swatches — zero-JS form control. */
export default function SizeSwatchGroup({ name, options, selected }: { name: string; options: SizeOption[]; selected?: string }) {
  return (
    <fieldset className="size-swatch-group">
      <legend className="size-swatch-legend mb-1.5 text-sm font-medium text-ink">Size</legend>
      <div className="size-swatch-options flex flex-wrap gap-2">
        {options.map((option) => {
          const available = option.available ?? true;
          return (
            <label key={option.value} className={`size-swatch ${available ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                defaultChecked={option.value === selected}
                disabled={!available}
                className="size-swatch-input peer sr-only"
              />
              <span className="size-swatch-chip block rounded-lg border border-gray-300 px-3 py-1.5 text-sm peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:font-semibold">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
