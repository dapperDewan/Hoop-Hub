import prisma from '../config/prisma.js';

/**
 * Script to add prices to existing players in the database
 * This assigns random prices between $500,000 and $5,000,000 based on position
 */

const POSITION_PRICE_RANGES = {
  'Point Guard': { min: 1000000, max: 5000000 },
  'Shooting Guard': { min: 1000000, max: 5000000 },
  'Small Forward': { min: 1200000, max: 5000000 },
  'Power Forward': { min: 1200000, max: 4500000 },
  'Center': { min: 1500000, max: 5000000 },
  'Guard': { min: 800000, max: 4000000 },
  'Forward': { min: 900000, max: 4200000 },
  'default': { min: 500000, max: 3000000 }
};

const getRandomPrice = (position) => {
  const range = POSITION_PRICE_RANGES[position] || POSITION_PRICE_RANGES.default;
  const price = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  // Round to nearest 50,000
  return Math.round(price / 50000) * 50000;
};

async function addPlayerPrices() {
  try {
    console.log('Starting to add prices to players...');

    // Get all players
    const allPlayers = await prisma.player.findMany();
    console.log(`Found ${allPlayers.length} total players in database.`);

    // Filter players without prices
    const players = allPlayers.filter(p => !p.price || p.price === 0);
    console.log(`Found ${players.length} players without prices.`);

    if (players.length === 0) {
      console.log('All players already have prices assigned!');
      
      // Print summary statistics
      if (allPlayers.length > 0) {
        const totalPrice = allPlayers.reduce((sum, p) => sum + (p.price || 0), 0);
        const avgPrice = totalPrice / allPlayers.length;
        const minPrice = Math.min(...allPlayers.map(p => p.price || 0).filter(p => p > 0));
        const maxPrice = Math.max(...allPlayers.map(p => p.price || 0));

        console.log('\nPrice Statistics:');
        console.log(`  Total players: ${allPlayers.length}`);
        console.log(`  Average price: $${Math.round(avgPrice).toLocaleString()}`);
        console.log(`  Min price: $${minPrice.toLocaleString()}`);
        console.log(`  Max price: $${maxPrice.toLocaleString()}`);
      }
      return;
    }

    let updated = 0;
    for (const player of players) {
      const price = getRandomPrice(player.position);
      
      await prisma.player.update({
        where: { id: player.id },
        data: {
          price,
          isAvailable: true,
          currentOwner: null,
          purchasedAt: null,
          unavailableUntil: null
        }
      });

      updated++;
      console.log(`Updated ${player.name} (${player.position}) with price: $${price.toLocaleString()}`);
    }

    console.log(`\n✓ Successfully updated ${updated} players with prices!`);
    
    // Print summary statistics
    const playersWithPrices = await prisma.player.findMany({
      where: { price: { not: null } }
    });
    
    const totalPrice = playersWithPrices.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = totalPrice / playersWithPrices.length;
    const minPrice = Math.min(...playersWithPrices.map(p => p.price || 0));
    const maxPrice = Math.max(...playersWithPrices.map(p => p.price || 0));

    console.log('\nPrice Statistics:');
    console.log(`  Total players: ${playersWithPrices.length}`);
    console.log(`  Average price: $${Math.round(avgPrice).toLocaleString()}`);
    console.log(`  Min price: $${minPrice.toLocaleString()}`);
    console.log(`  Max price: $${maxPrice.toLocaleString()}`);

  } catch (error) {
    console.error('Error adding player prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addPlayerPrices();
