interface CardProps {
  title: string;
  value: string;
  accent: 'sky' | 'emerald' | 'violet';
}

const accentClasses = {
  sky: 'bg-sky-500/10 text-sky-200',
  emerald: 'bg-emerald-500/10 text-emerald-200',
  violet: 'bg-violet-500/10 text-violet-200',
};

function Card({ title, value, accent }: CardProps) {
  return (
    <div className={`rounded-3xl border border-slate-800 p-6 ${accentClasses[accent]}`}>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default Card;
