import { useState } from 'react';
import { brandConfig } from '../../config/brand';
import { Save, Image, Phone, Mail, Type } from 'lucide-react';

function Settings() {
  const [settings, setSettings] = useState({
    name: brandConfig.name,
    persianName: brandConfig.persianName,
    slogan: brandConfig.slogan,
    phone: brandConfig.phone,
    email: brandConfig.email,
    logo: brandConfig.logo,
  });

  const handleChange = (
    key: string,
    value: string
  ) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };


  return (
    <section className="space-y-6">

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">

        <h1 className="text-2xl font-bold text-white">
          تنظیمات سایت Carrtell
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          مدیریت اطلاعات اصلی برند و نمایش سایت
        </p>

      </div>


      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-6">


        <div className="flex items-center gap-4">

          <img
            src={settings.logo}
            alt={settings.name}
            className="w-20 h-20 rounded-2xl object-contain bg-white p-2"
          />


          <div>
            <div className="flex items-center gap-2 text-white font-bold">
              <Image size={18}/>
              لوگوی سایت
            </div>

            <p className="text-sm text-slate-400 mt-1">
              بعداً آپلود مستقیم از اینجا فعال می‌شود
            </p>

          </div>

        </div>


        <div className="grid md:grid-cols-2 gap-5">


          <label className="space-y-2">

            <span className="text-sm text-slate-300 flex gap-2">
              <Type size={16}/>
              نام انگلیسی
            </span>

            <input
              value={settings.name}
              onChange={(e)=>handleChange('name', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            />

          </label>


          <label className="space-y-2">

            <span className="text-sm text-slate-300">
              نام فارسی
            </span>

            <input
              value={settings.persianName}
              onChange={(e)=>handleChange('persianName', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            />

          </label>


          <label className="space-y-2">

            <span className="text-sm text-slate-300">
              شعار
            </span>

            <input
              value={settings.slogan}
              onChange={(e)=>handleChange('slogan', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            />

          </label>


          <label className="space-y-2">

            <span className="text-sm text-slate-300 flex gap-2">
              <Phone size={16}/>
              شماره تماس
            </span>

            <input
              value={settings.phone}
              onChange={(e)=>handleChange('phone', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            />

          </label>


          <label className="space-y-2 md:col-span-2">

            <span className="text-sm text-slate-300 flex gap-2">
              <Mail size={16}/>
              ایمیل
            </span>

            <input
              value={settings.email}
              onChange={(e)=>handleChange('email', e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"
            />

          </label>


        </div>


        <button
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300 transition"
        >

          <Save size={18}/>
          ذخیره تغییرات

        </button>


      </div>

    </section>
  );
}

export default Settings;