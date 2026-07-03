import { useEffect, useState } from 'react';
import { Save, Image, Phone, Mail, Type } from 'lucide-react';

import {
  getBrandSettings,
  updateBrandSettings,
} from '../services/settingsApi';


const defaultSettings = {
  name: 'Carrtell',
  persianName: 'کارتل',
  slogan: 'پلتفرم هوشمند سرویس خودرو در محل',
  phone: '',
  email: '',
  logo: '',
};


function Settings() {

  const [settings, setSettings] = useState(defaultSettings);

  const [loading, setLoading] = useState(false);


  useEffect(() => {

    async function loadSettings() {

      try {

        const data = await getBrandSettings();


        if (data) {

          setSettings({
            ...defaultSettings,
            ...data,
          });

        }


      } catch (error) {

        console.warn(
          'Supabase settings load failed, using default config',
          error
        );

      }

    }


    loadSettings();

  }, []);



  const handleChange = (
    key: keyof typeof settings,
    value: string
  ) => {

    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

  };



  const handleSave = async () => {

    try {

      setLoading(true);


      await updateBrandSettings(settings);


      alert('تنظیمات ذخیره شد ✅');


    } catch (error) {

      console.error('SAVE ERROR:', error);

      alert('خطا در ذخیره ❌');


    } finally {

      setLoading(false);

    }

  };




  return (

    <section className="space-y-6">


      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">


        <h1 className="text-2xl font-bold text-white">

          تنظیمات سایت Carrtell

        </h1>


        <p className="mt-2 text-sm text-slate-400">

          مدیریت اطلاعات برند از Supabase

        </p>


      </div>




      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-6">


        <div className="flex items-center gap-4">


          {settings.logo ? (

            <img
              src={settings.logo}
              alt={settings.name}
              className="w-20 h-20 rounded-2xl object-contain bg-white p-2"
            />

          ) : (

            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">

              <Image className="text-slate-400" />

            </div>

          )}



          <div>

            <div className="flex items-center gap-2 text-white font-bold">

              <Image size={18}/>

              لوگوی سایت

            </div>


            <p className="text-sm text-slate-400 mt-1">

              متصل به دیتابیس

            </p>


          </div>


        </div>





        <div className="grid md:grid-cols-2 gap-5">


          <InputBox
            title="نام انگلیسی"
            icon={<Type size={16}/>}
            value={settings.name}
            change={(v)=>handleChange('name',v)}
          />


          <InputBox
            title="نام فارسی"
            value={settings.persianName}
            change={(v)=>handleChange('persianName',v)}
          />



          <InputBox
            title="شعار"
            value={settings.slogan}
            change={(v)=>handleChange('slogan',v)}
          />



          <InputBox
            title="شماره تماس"
            icon={<Phone size={16}/>}
            value={settings.phone}
            change={(v)=>handleChange('phone',v)}
          />



          <div className="md:col-span-2">

            <InputBox
              title="ایمیل"
              icon={<Mail size={16}/>}
              value={settings.email}
              change={(v)=>handleChange('email',v)}
            />

          </div>


        </div>




        <button

          onClick={handleSave}

          disabled={loading}

          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300 transition disabled:opacity-50"

        >


          <Save size={18}/>


          {
            loading
            ? 'در حال ذخیره...'
            : 'ذخیره تغییرات'
          }


        </button>



      </div>


    </section>

  );

}





function InputBox({
  title,
  value,
  change,
  icon,
}: {
  title:string;
  value:string;
  change:(v:string)=>void;
  icon?:React.ReactNode;
}) {

  return (

    <label className="space-y-2 block">


      <span className="text-sm text-slate-300 flex gap-2">

        {icon}

        {title}

      </span>


      <input

        value={value}

        onChange={(e)=>change(e.target.value)}

        className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white"

      />


    </label>

  );

}




export default Settings;