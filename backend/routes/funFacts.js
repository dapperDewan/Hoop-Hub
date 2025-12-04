import express from 'express';

const router = express.Router();

const funFacts = [
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
  "The San Antonio Spurs have the highest winning percentage in NBA history."
];

router.get('/', (req, res) => {
  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
  res.json({ fact: randomFact });
});

export default router;
