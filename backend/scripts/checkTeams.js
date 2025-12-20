import prisma from '../config/prisma.js';

(async ()=>{
  try{
    await prisma.$connect();
    const ids = ['691e8f92c759d50c34f71010','691e8f92c759d50c34f71015'];
    const teams = await prisma.team.findMany({ where: { id: { in: ids } } });
    console.log('found teams:', JSON.stringify(teams, null, 2));
    await prisma.$disconnect();
  }catch(e){
    console.error('err', e);
    process.exit(1);
  }
})();
