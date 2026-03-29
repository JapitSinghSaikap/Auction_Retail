/**
 * Bid Suggestion — pure algorithm, no external APIs
 */
function suggestBid(item, bids) {
  const currentPrice = item.currentPrice || item.startingPrice;

  if (!bids || bids.length < 2) {
    return Math.ceil(currentPrice + 10);
  }

  // Calculate average increment from bid history
  const sorted = [...bids].sort((a, b) => a.amount - b.amount);
  let totalIncrement = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalIncrement += sorted[i].amount - sorted[i - 1].amount;
  }
  const avgIncrement = totalIncrement / (sorted.length - 1);

  // Bid velocity: bids per hour
  const now       = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentCount = bids.filter((b) => new Date(b.createdAt).getTime() > oneHourAgo).length;
  const velocity   = recentCount; // per hour

  let multiplier = 1.2;
  if (velocity > 10) multiplier = 1.8;
  else if (velocity > 5) multiplier = 1.4;
  else if (velocity < 2) multiplier = 1.1;

  return Math.ceil(currentPrice + avgIncrement * multiplier);
}

module.exports = { suggestBid };
