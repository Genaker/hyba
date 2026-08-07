export type ColorOption = { value: string; label: string; hex: string };

/** Radio group of color swatches — zero-JS form control (submit via parent <form>). */
export default function ColorSwatchGroup({ name, options, selected }: { name: string; options: ColorOption[]; selected?: string }) {
  return (
    <fieldset className="color-swatch-group">
      <legend className="color-swatch-legend mb-1.5 text-sm font-medium text-ink">Color</legend>
      <div className="color-swatch-options flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="color-swatch cursor-pointer" title={option.label}>
            <input type="radio" name={name} value={option.value} defaultChecked={option.value === selected} className="color-swatch-input peer sr-only" />
            <span
              className="color-swatch-chip block h-7 w-7 rounded-full border border-gray-300 peer-checked:ring-2 peer-checked:ring-brand-600 peer-checked:ring-offset-1"
              style={{ backgroundColor: option.hex }}
            />
            <span className="sr-only">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
