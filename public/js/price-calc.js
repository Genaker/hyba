// Vanilla-JS island: live line-total on the product page.
// Reads volume tiers from data-tiers on the add-to-cart form; no framework.
import { formatMoney, tierPrice } from '/js/lib/money.js';
import { qs, readJsonData } from '/js/lib/dom.js';

const form = qs('form[data-tiers]');
const tiers = readJsonData(form, 'tiers', []);        // [{quantity, amount}] sorted asc
const quantityInput = qs('input[name="quantity"]', form ?? undefined);
const totalOutput = qs('[data-line-total]', form ?? undefined);

if (form && tiers.length && quantityInput && totalOutput) {
  const update = () => {
    const quantity = Math.max(1, Number(quantityInput.value) || 1);
    const unitPrice = tierPrice(tiers, quantity);
    totalOutput.textContent = `${quantity} × ${formatMoney(unitPrice)} = ${formatMoney(quantity * unitPrice)}`;
  };
  quantityInput.addEventListener('input', update);
  update();
}
