/**
 * Win Probability — pure math, no external APIs
 */
function calculateWinProbability(item, userId, bids) {
  if (!bids || bids.length === 0) return 50;

  const now       = Date.now();
  const endTime   = new Date(item.endTime).getTime();
  const startTime = new Date(item.createdAt || item.endTime).getTime() - 7 * 24 * 60 * 60 * 1000;
  const totalDuration = Math.max(endTime - startTime, 1);
  const timeLeft      = Math.max(endTime - now, 0);

  const sortedBids    = [...bids].sort((a, b) => b.amount - a.amount);
  const isWinning     = String(sortedBids[0]?.userId) === String(userId);
  const highestBid    = sortedBids[0]?.amount || 0;
  const userBid       = Math.max(...bids.filter((b) => String(b.userId) === String(userId)).map((b) => b.amount), 0);

  const uniqueBidders = new Set(bids.map((b) => String(b.userId))).size;
  const fiveMinsAgo   = now - 5 * 60 * 1000;
  const recentBids    = bids.filter((b) => new Date(b.createdAt).getTime() > fiveMinsAgo).length;

  let score = isWinning ? 60 : 20;
  if (highestBid > 0) score += (userBid / highestBid) * 20;

  const timeRatio = timeLeft / totalDuration;
  if (timeRatio < 0.1)  score += 15;
  if (timeRatio < 0.05) score += 10;

  score -= (uniqueBidders - 1) * 5;
  if (recentBids === 0) score += 10;

  return Math.min(95, Math.max(5, Math.round(score)));
}

module.exports = { calculateWinProbability };
