update public.mega_menu_tiles
set
  title = 'پکیج‌های تعویض روغن اقتصادی و به‌صرفه',
  subtitle = 'انتخاب کامل برای سرویس دوره‌ای',
  updated_at = now()
where image_url = '/images/mega-menu/economy-oil-change.webp'
  and title in ('پکیج تعویض روغن اقتصادی', 'پکیج‌های تعویض روغن اقتصادی و به‌صرفه');
