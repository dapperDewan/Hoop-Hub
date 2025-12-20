import express from 'express';

const router = express.Router();

const generalFacts = [
  "Michael Jordan won six NBA championships with the Chicago Bulls.",
  "Wilt Chamberlain scored 100 points in a single NBA game.",
  "Kobe Bryant was drafted at age 17 and played 20 seasons for the Lakers.",
  "LeBron James is the only player to win NBA Finals MVP with three different teams.",
  "Shaquille O'Neal made only one three-pointer in his entire NBA career.",
  "The Boston Celtics have the most NBA championships in history.",
  "Stephen Curry holds the record for most three-pointers made in a season.",
  "Yao Ming was the first Chinese player to be drafted as the number one overall pick.",
  "Dirk Nowitzki is the highest-scoring foreign-born NBA player.",
  "Dennis Rodman won five NBA championships and was known for his rebounding.",
  "The NBA was founded in New York City in 1946 as the Basketball Association of America.",
  "The shortest player ever in the NBA was Muggsy Bogues at 5'3''.",
  "The tallest player ever in the NBA was Gheorghe Muresan at 7'7''.",
  "Magic Johnson played center in the 1980 NBA Finals as a rookie and won Finals MVP.",
  "The Toronto Raptors are the only Canadian team to win an NBA championship (2019).",
  "Vince Carter is the only player to play in four different decades (1990s, 2000s, 2010s, 2020s).",
  "The NBA logo is modeled after Hall of Famer Jerry West.",
  "Bill Russell won 11 NBA championships, the most by any player.",
  "The first NBA All-Star Game was played in 1951.",
  "The San Antonio Spurs have the highest winning percentage in NBA history.",

  // Additional authentic basketball facts
  "The three-point line was added to the NBA starting in the 1979–80 season.",
  "The 24-second shot clock was introduced in the NBA in 1954 to speed up play and prevent stalling.",
  "The first NBA game was played in 1946 between the Toronto Huskies and the New York Knickerbockers.",
  "The Boston Celtics won eight consecutive NBA championships from 1959 to 1966.",
  "The 1992 USA 'Dream Team' was the first Olympic basketball team to feature active NBA superstars and transformed international basketball.",
  "Klay Thompson scored 37 points in a single quarter (2015), the NBA record for points in one quarter.",
  "Jerry West is the only player to be named NBA Finals MVP while playing for the losing team (1969).",
  "Wilt Chamberlain once averaged over 50 points per game during the 1961–62 season.",
  "Kobe Bryant's 81-point game in 2006 is the second-highest single-game scoring performance in NBA history.",
  "The ABA merged with the NBA in 1976, bringing teams such as the Spurs, Nuggets, Nets, and Pacers into the league.",
  "The NBA Slam Dunk Contest debuted as part of All-Star Weekend in 1984.",
  "Bob Pettit was the NBA's first recipient of the regular-season MVP award in 1956–57.",
  "Tim Duncan won five championships with the San Antonio Spurs between 1999 and 2014.",
  "Dirk Nowitzki became the first European-born player to win NBA Finals MVP in 2011.",
  "Oscar Robertson averaged a triple-double for the entire 1961–62 season, a feat long unmatched until modern times.",
  "The three-point shootout and skills challenge are All-Star staples that test shooting accuracy and on-court agility.",
  "The NBA and FIBA rules differ in court dimensions, game length, and goaltending rules — international basketball has different flavors of play.",
  "The NBA expanded significantly in the 1980s and 1990s, helping globalize the game through international stars and TV exposure.",
  "The 50–40–90 club refers to shooting at least 50% FG, 40% 3PT, and 90% FT for a season — a rare efficiency milestone.",
  "The NBA draft lottery was introduced in 1985 to determine the order of the top picks and reduce incentive to lose games intentionally."
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Single random fact endpoint — public and non-personalized
router.get('/', (req, res) => {
  try {
    const fact = pickRandom(generalFacts);
    res.json({ fact });
  } catch (err) {
    console.error('funFacts error:', err);
    res.status(500).json({ error: 'Unable to generate fun fact' });
  }
});

// Batch endpoint: return `count` general facts
router.get('/list', (req, res) => {
  try {
    const count = Math.min(20, Math.max(1, parseInt(req.query.count, 10) || 5));
    const pool = [...generalFacts];
    const results = [];
    while (results.length < count && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      results.push(pool.splice(idx, 1)[0]);
    }
    res.json({ facts: results });
  } catch (err) {
    console.error('funFacts list error:', err);
    res.status(500).json({ error: 'Unable to generate fun facts list' });
  }
});

export default router;
