import { useEffect, useMemo, useState } from "react";
import {
  AdminSettingsMap,
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  saveAdminSettings,
} from "../services/settingsApi";

type TabKey = "site" | "theme" | "sms" | "payment" | "service" | "map" | "orders";

type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "password";

type FieldConfig = {
  group: TabKey;
  key: string;
  label: string;
  hint?: string;
  type?: FieldType;
  options?: { label: string; value: string | boolean }[];
};

const tabs: { key: TabKey; title: string; subtitle: string }[] = [
  { key: "site", title: "سایت و برند", subtitle: "نام برند، تماس و پیام‌های عمومی" },
  { key: "theme", title: "تم و ظاهر", subtitle: "رنگ، فونت و ظاهر پایه" },
  { key: "sms", title: "پیامک", subtitle: "سرویس‌دهنده و قالب‌های پیامک" },
  { key: "payment", title: "پرداخت", subtitle: "درگاه تست و زرین‌پال" },
  { key: "service", title: "سرویس در محل", subtitle: "هزینه، مناطق و کیلومتر سرویس" },
  { key: "map", title: "نقشه نشان", subtitle: "کلید API و مختصات پیش‌فرض" },
  { key: "orders", title: "سفارش‌ها", subtitle: "وضعیت‌های پایه سفارش و نظر" },
];

const fields: FieldConfig[] = [
  { group: "site", key: "brand_name", label: "نام انگلیسی برند" },
  { group: "site", key: "brand_name_fa", label: "نام فارسی برند" },
  { group: "site", key: "support_phone", label: "شماره پشتیبانی" },
  { group: "site", key: "support_whatsapp", label: "واتساپ پشتیبانی" },
  { group: "site", key: "home_notice", label: "پیام اطلاع‌رسانی صفحه اصلی", type: "textarea" },

  { group: "theme", key: "primary_color", label: "رنگ اصلی / Accent" },
  {
    group: "theme",
    key: "background_mode",
    label: "حالت پس‌زمینه",
    type: "select",
    options: [
      { label: "تیره", value: "dark" },
      { label: "روشن", value: "light" },
    ],
  },
  { group: "theme", key: "font_family", label: "فونت پیش‌فرض" },
  { group: "theme", key: "card_radius", label: "گردی کارت‌ها", type: "number", hint: "مثلاً 16 یا 24" },

  { group: "sms", key: "enabled", label: "فعال بودن پیامک", type: "boolean" },
  {
    group: "sms",
    key: "provider",
    label: "سرویس‌دهنده پیامک",
    type: "select",
    options: [
      { label: "دمو / فقط لاگ", value: "demo" },
      { label: "کاوه‌نگار", value: "kavenegar" },
      { label: "ملی پیامک", value: "melipayamak" },
      { label: "فراز SMS", value: "farazsms" },
    ],
  },
  { group: "sms", key: "sender_number", label: "شماره ارسال‌کننده" },
  { group: "sms", key: "api_key", label: "API Key پیامک", type: "password" },
  { group: "sms", key: "order_created_template", label: "قالب پیامک ثبت سفارش", type: "textarea" },
  { group: "sms", key: "order_status_template", label: "قالب پیامک تغییر وضعیت", type: "textarea" },
  { group: "sms", key: "review_template", label: "قالب پیامک ثبت نظر", type: "textarea" },

  {
    group: "payment",
    key: "gateway",
    label: "درگاه فعال",
    type: "select",
    options: [
      { label: "پرداخت تستی", value: "test" },
      { label: "زرین‌پال", value: "zarinpal" },
    ],
  },
  { group: "payment", key: "test_mode", label: "حالت تست", type: "boolean" },
  { group: "payment", key: "zarinpal_merchant_id", label: "Merchant ID زرین‌پال", type: "password" },
  { group: "payment", key: "callback_path", label: "مسیر بازگشت پرداخت" },

  { group: "service", key: "enabled", label: "فعال بودن سرویس در محل", type: "boolean" },
  { group: "service", key: "base_dispatch_fee", label: "هزینه پایه ایاب و ذهاب", type: "number" },
  { group: "service", key: "base_service_fee", label: "هزینه پایه سرویس", type: "number" },
  { group: "service", key: "price_per_km", label: "هزینه هر کیلومتر", type: "number" },
  { group: "service", key: "default_oil_interval_km", label: "کیلومتر پیش‌فرض سرویس بعدی", type: "number" },
  { group: "service", key: "service_areas", label: "مناطق خدمات‌دهی", type: "textarea" },

  { group: "map", key: "enabled", label: "فعال بودن نقشه واقعی", type: "boolean" },
  {
    group: "map",
    key: "provider",
    label: "سرویس نقشه",
    type: "select",
    options: [{ label: "نشان", value: "neshan" }],
  },
  { group: "map", key: "neshan_api_key", label: "API Key نشان", type: "password" },
  { group: "map", key: "default_lat", label: "Latitude پیش‌فرض" },
  { group: "map", key: "default_lng", label: "Longitude پیش‌فرض" },

  {
    group: "orders",
    key: "default_status_after_submit",
    label: "وضعیت بعد از ثبت سفارش",
    type: "select",
    options: [
      { label: "در انتظار پرداخت", value: "pending_payment" },
      { label: "در انتظار بررسی", value: "pending_review" },
    ],
  },
  {
    group: "orders",
    key: "default_status_after_payment",
    label: "وضعیت بعد از پرداخت",
    type: "select",
    options: [
      { label: "پرداخت شده", value: "paid" },
      { label: "در انتظار بررسی", value: "pending_review" },
    ],
  },
  {
    group: "orders",
    key: "default_status_after_admin_confirm",
    label: "وضعیت بعد از تایید مدیر",
    type: "select",
    options: [
      { label: "درحال آماده‌سازی", value: "processing" },
      { label: "آماده ارسال", value: "ready" },
    ],
  },
  {
    group: "orders",
    key: "allow_review_after_status",
    label: "ثبت نظر بعد از کدام وضعیت فعال شود؟",
    type: "select",
    options: [
      { label: "تحویل شده", value: "delivered" },
      { label: "تکمیل شده", value: "completed" },
    ],
  },
];

function cloneDefaults(): AdminSettingsMap {
  return JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("site");
  const [settings, setSettings] = useState<AdminSettingsMap>(() => cloneDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeFields = useMemo(
    () => fields.filter((field) => field.group === activeTab),
    [activeTab]
  );

  useEffect(() => {
    let mounted = true;
    getAdminSettings()
      .then((data) => {
        if (!mounted) return;
        setSettings(data);
      })
      .catch((err) => {
        setError(err?.message || "خطا در خواندن تنظیمات");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const setValue = (group: TabKey, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] ?? {}),
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await saveAdminSettings(settings);
      setMessage("تنظیمات با موفقیت ذخیره شد.");
    } catch (err: any) {
      setError(err?.message || "ذخیره تنظیمات انجام نشد. فایل SQL پچ را اجرا کن.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = settings[field.group]?.[field.key];
    const baseClass =
      "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20";

    if (field.type === "boolean") {
      return (
        <button
          type="button"
          onClick={() => setValue(field.group, field.key, !Boolean(value))}
          className={`relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
            value
              ? "border-yellow-400/60 bg-yellow-400/15 text-yellow-100"
              : "border-white/10 bg-slate-950/70 text-slate-300"
          }`}
        >
          <span>{value ? "فعال" : "غیرفعال"}</span>
          <span
            className={`h-6 w-11 rounded-full p-1 transition ${
              value ? "bg-yellow-400" : "bg-slate-700"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition ${
                value ? "translate-x-[-20px]" : ""
              }`}
            />
          </span>
        </button>
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={String(value ?? "")}
          onChange={(event) => {
            const option = field.options?.find((item) => String(item.value) === event.target.value);
            setValue(field.group, field.key, option?.value ?? event.target.value);
          }}
          className={baseClass}
        >
          {(field.options ?? []).map((option) => (
            <option key={String(option.value)} value={String(option.value)} className="bg-slate-950 text-white">
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          rows={4}
          value={String(value ?? "")}
          onChange={(event) => setValue(field.group, field.key, event.target.value)}
          className={`${baseClass} min-h-[112px] resize-y`}
        />
      );
    }

    return (
      <input
        type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(event) => setValue(field.group, field.key, event.target.value)}
        className={baseClass}
      />
    );
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-yellow-400/20 bg-gradient-to-l from-yellow-400/15 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/30">
          <p className="text-sm text-yellow-200">پنل مدیریت Carrtell</p>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">تنظیمات یکپارچه پروژه</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            تنظیمات برند، تم، پیامک، پرداخت، سرویس در محل، نقشه نشان و وضعیت سفارش‌ها از این بخش مدیریت می‌شود.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-900/80 p-3 shadow-xl shadow-black/20">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full rounded-2xl px-4 py-4 text-right transition ${
                    activeTab === tab.key
                      ? "bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20"
                      : "bg-slate-950/50 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="block text-sm font-bold">{tab.title}</span>
                  <span className={`mt-1 block text-xs ${activeTab === tab.key ? "text-slate-800" : "text-slate-500"}`}>
                    {tab.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 md:p-7">
            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">{tabs.find((tab) => tab.key === activeTab)?.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{tabs.find((tab) => tab.key === activeTab)?.subtitle}</p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
                در حال خواندن تنظیمات...
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {activeFields.map((field) => (
                  <label key={`${field.group}.${field.key}`} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                    <span className="mb-2 block text-sm font-bold text-slate-200">{field.label}</span>
                    {renderField(field)}
                    {field.hint && <span className="mt-2 block text-xs text-slate-500">{field.hint}</span>}
                  </label>
                ))}
              </div>
            )}

            {(message || error) && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {error || message}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-xs leading-6 text-slate-400">
              اگر ذخیره تنظیمات خطا داد، فایل SQL داخل همین پچ را در Supabase اجرا کن:
              <span className="mx-1 rounded-lg bg-slate-800 px-2 py-1 text-yellow-200">docs/sql/2026_admin_settings_hub.sql</span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
