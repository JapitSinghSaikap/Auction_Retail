/**
 * Commentary Generator — random templates based on context, no external APIs
 */
function generateCommentary(bid, item, bids, isBattle = false) {
  const name       = bid.bidderName || bid.userName || 'Someone';
  const prev       = bids.length > 1 ? bids[1]?.amount || 0 : item.startingPrice;
  const raise      = Number(bid.amount) - Number(prev);
  const now        = Date.now();
  const endTime    = new Date(item.endTime).getTime();
  const hoursLeft  = Math.max(0, (endTime - now) / (1000 * 60 * 60));
  const totalBids  = bids.length;
  const price      = Number(bid.amount);

  // Detect milestone crossing
  const roundNumbers = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  const milestone    = roundNumbers.find((r) => price >= r && prev < r);

  let pool = [];
  let type = 'neutral';

  if (isBattle) {
    type = 'battle';
    pool = [
      `⚔️ ${name} fires back!`,
      `${name} won't back down!`,
      `This battle is INTENSE! 🔥`,
      `⚡ ${name} counter-attacks!`,
      `🔥 What a back-and-forth! ${name} strikes again!`,
    ];
  } else if (milestone) {
    type = 'milestone';
    pool = [
      `Price just crossed ₹${milestone.toLocaleString('en-IN')}!`,
      `${totalBids} bids and counting!`,
      `🎯 ₹${milestone.toLocaleString('en-IN')} mark has been broken!`,
    ];
  } else if (hoursLeft < 1) {
    type = 'endingSoon';
    pool = [
      `⏱️ Under an hour left!`,
      `🚨 Final stretch begins!`,
      `⚡ Who wants it more?`,
      `🔥 Last chance bidding!`,
      `⏰ Tick tock… ${name} is in the lead!`,
    ];
  } else if (raise > 500) {
    type = 'bigRaise';
    pool = [
      `${name} makes a bold ₹${raise.toLocaleString('en-IN')} jump!`,
      `${name} means business! 🔥`,
      `Massive raise from ${name}!`,
      `💰 ${name} is serious with that raise!`,
    ];
  } else if (raise > 100) {
    type = 'raise';
    pool = [
      `${name} makes a confident move`,
      `${name} ups the ante! 💪`,
      `Solid bid from ${name}`,
    ];
  } else {
    type = 'smallRaise';
    pool = [
      `${name} edges ahead`,
      `${name} takes the lead`,
      `${name} nudges the price up`,
      `Careful move from ${name}`,
    ];
  }

  const text = pool[Math.floor(Math.random() * pool.length)];
  return { text, type };
}

module.exports = { generateCommentary };
