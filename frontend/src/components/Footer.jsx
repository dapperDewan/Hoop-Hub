const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">Hoop Hub</p>
          <p className="text-slate-200/90">Stories, stats, and merch tailored for basketball fans.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-slate-100/90">
          <a href="mailto:hello@hoophub.app" className="hover:text-white">hello@hoophub.app</a>
          <a href="/fixtures" className="hover:text-white">Fixtures</a>
          <a href="/merchandise" className="hover:text-white">Merch</a>
          <a href="/profile" className="hover:text-white">Profile</a>
        </div>
        <p className="text-slate-100">© {year} Hoop Hub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
