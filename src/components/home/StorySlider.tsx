import {
  Battery,
  Droplets,
  SlidersHorizontal,
  Flame,
  Gauge,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';

const stories = [
  { title: 'روغن موتور', icon: Droplets },
  { title: 'فیلتر روغن', icon: SlidersHorizontal },
  { title: 'فیلتر هوا', icon: Gauge },
  { title: 'باتری', icon: Battery },
  { title: 'شمع', icon: Zap },
  { title: 'ضدیخ', icon: Flame },
  { title: 'سرویس دوره‌ای', icon: Wrench },
  { title: 'پک ویژه', icon: Sparkles },
];

export default function StorySlider() {
  return (
    <section className="bg-white py-6 border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex gap-5 overflow-x-auto pb-2">

          {stories.map((story) => {
            const Icon = story.icon;

            return (
              <button
                key={story.title}
                className="shrink-0 w-24 text-center group"
              >

                <div className="mx-auto w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-yellow-400 to-black">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <Icon className="w-8 h-8 text-black" />
                  </div>
                </div>

                <p className="mt-2 text-xs font-bold text-neutral-700">
                  {story.title}
                </p>

              </button>
            );
          })}

        </div>

      </div>
    </section>
  );
}