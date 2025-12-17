import prisma from '../config/prisma.js';

(async function(){
  try{
    await prisma.$connect();
    console.log('Connected to DB');
    const matches = await prisma.match.findMany({ orderBy: { date: 'asc' } });
    console.log('matches count:', matches.length);
    console.log(JSON.stringify(matches, null, 2));
    await prisma.$disconnect();
  }catch(err){
    console.error('error querying matches:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
