/**
 * Deal Score (1-10) — pure math, no external APIs
 */
function calculateDealScore(item, bids) {
  const now        = Date.now();
  const endTime    = new Date(item.endTime).getTime();
  const timeLeft   = Math.max(endTime - now, 0);
  const hoursLeft  = timeLeft / (1000 * 60 * 60);

  const startingPrice = item.startingPrice || 1;
  const currentPrice  = item.currentPrice  || startingPrice;
  const priceRise     = ((currentPrice - startingPrice) / startingPrice) * 100;
  const bidCount      = bids ? bids.length : 0;

  let score = 10;

  if (priceRise > 200) score -= 4;
  else if (priceRise > 100) score -= 2;
  else if (priceRise > 50)  score -= 1;

  if (hoursLeft > 24) score += 1;
  if (hoursLeft < 1)  score += 2;

  if (bidCount < 3)  score += 2;
  if (bidCount > 20) score -= 2;

  return Math.min(10, Math.max(1, score));
}

module.exports = { calculateDealScore };
