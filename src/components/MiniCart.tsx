import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from 'lucide-react';
import { changeCartQuantity, getCartCount, readCart, removeProductFromCart, type CartMap } from '../lib/cart';
import { formatPrice, getProductFinalPrice } from '../admin/services/ordersUtils';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { CARRTELL_APPEARANCE_EVENT } from '../lib/appearanceThemes';

function isDarkColor(hex?: string) {
  if (!hex) return false;
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (full.length < 6) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

function readableText(background?: string, preferred?: string) {
  if (!background) return preferred || '#0f172a';
  return isDarkColor(background) ? '#f8fafc' : '#0f172a';
}

function mutedText(background?: string, fallback?: string) {
  return isDarkColor(background) ? '#cbd5e1' : fallback || '#64748b';
}

export default function MiniCart() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartMap>(() => readCart());
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    getThemeSettings()
      .then((data) => {
        if (mounted) setTheme({ ...defaultThemeSettings, ...(data || {}) });
      })
      .catch(() => setTheme(defaultThemeSettings));
    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    const reloadTheme = () => {
      getThemeSettings()
        .then((data) => setTheme({ ...defaultThemeSettings, ...(data || {}) }))
        .catch(() => setTheme(defaultThemeSettings));
    };
    window.addEventListener(CARRTELL_APPEARANCE_EVENT, reloadTheme);
    window.addEventListener('storage', reloadTheme);
    return () => {
      window.removeEventListener(CARRTELL_APPEARANCE_EVENT, reloadTheme);
      window.removeEventListener('storage', reloadTheme);
    };
  }, []);

  useEffect(() => {
    const sync = () => setCart(readCart());
    const openCart = () => { setCart(readCart()); setOpen(true); };
    window.addEventListener('carrtell-cart-updated', sync);
    window.addEventListener('carrtell-cart-open', openCart);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('carrtell-cart-updated', sync);
      window.removeEventListener('carrtell-cart-open', openCart);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    function closeOnClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!boxRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', closeOnClick);
    return () => document.removeEventListener('mousedown', closeOnClick);
  }, [open]);

  const items = useMemo(() => Object.values(cart), [cart]);
  const count = getCartCount(cart);
  const total = items.reduce((sum, item) => { const q = Number(item?.quantity); const quantity = Number.isFinite(q) && q > 0 ? q : 0; return sum + getProductFinalPrice(item.product) * quantity; }, 0);

  const panelBg = theme.surfaceColor || defaultThemeSettings.surfaceColor;
  const itemBg = theme.searchBackground || theme.cardBackground || '#f8fafc';
  const panelText = readableText(panelBg, theme.textColor);
  const panelMuted = mutedText(panelBg, theme.mutedTextColor);
  const itemText = readableText(itemBg, theme.textColor);
  const itemMuted = mutedText(itemBg, theme.mutedTextColor);
  const primary = theme.primaryColor || theme.addButtonBackground || '#facc15';
  const primaryText = readableText(primary, '#0f172a');
  const borderColor = isDarkColor(panelBg) ? 'rgba(255,255,255,.12)' : 'rgba(15,23,42,.10)';
  const softBorderColor = isDarkColor(itemBg) ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)';

  function inc(product: any) {
    changeCartQuantity(product, 1);
    setCart(readCart());
  }

  function dec(product: any) {
    changeCartQuantity(product, -1);
    setCart(readCart());
  }

  function remove(productId?: string) {
    removeProductFromCart(productId);
    setCart(readCart());
  }

  return (
    <div className="relative" ref={boxRef} dir="rtl" style={{ fontFamily: theme.headerFontFamily || theme.fontFamily }}>
      <button
        type="button"
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setCart(readCart()); setOpen((v) => !v); }}
        className="ct-new-cart-button relative flex h-11 w-11 items-center justify-center rounded-full border transition"
        style={{
          background: 'transparent',
          color: readableText(theme.headerBackground || panelBg, theme.textColor),
          borderColor: 'transparent',
        }}
        aria-label="سبد خرید"
        data-testid="header-cart-button"
        aria-expanded={open}
      >
        <ShoppingBag className="h-5 w-5" />
        <span
          className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-black"
          style={{ background: primary, color: primaryText }}
        >
          {new Intl.NumberFormat('fa-IR').format(count)}
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          data-testid="mini-cart-panel"
          className="fixed left-3 right-3 top-[118px] z-[2147483646] mx-auto flex max-h-[min(430px,calc(100dvh-155px))] w-auto max-w-[380px] flex-col overflow-hidden rounded-3xl shadow-2xl sm:absolute sm:left-0 sm:right-auto sm:top-14 sm:mx-0 sm:w-[330px]"
          style={{
            background: `linear-gradient(180deg, ${panelBg} 0%, ${theme.cardBackground || panelBg} 100%)`,
            color: panelText,
            border: `1px solid ${borderColor}`,
            borderRadius: theme.borderRadius || '24px',
          }}
        >
          <div className="shrink-0 flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div>
              <h3 className="font-black" style={{ color: panelText }}>سبد خرید سریع</h3>
              <p className="text-xs" style={{ color: panelMuted }}>{new Intl.NumberFormat('fa-IR').format(count)} قلم کالا</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 transition hover:scale-105"
              style={{ background: itemBg, color: itemText }}
              aria-label="بستن سبد خرید سریع"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
            {items.length === 0 ? (
              <div className="rounded-2xl p-6 text-center text-sm font-bold" style={{ background: itemBg, color: itemMuted }}>
                سبد خرید خالی است.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="flex gap-2 rounded-2xl p-2.5 shadow-sm" style={{ background: itemBg, color: itemText, border: `1px solid ${softBorderColor}` }}>
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: theme.cardImageBackground || panelBg, border: `1px solid ${softBorderColor}` }}
                  >
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <ShoppingCart className="h-6 w-6" style={{ color: itemMuted }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="line-clamp-1 text-sm" style={{ color: itemText }}>{item.product.name}</b>
                    <p className="mt-1 text-xs" style={{ color: itemMuted }}>{formatPrice(getProductFinalPrice(item.product))} تومان</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: panelBg, border: `1px solid ${borderColor}` }}>
                        <button onClick={() => inc(item.product)} className="rounded-lg p-1" style={{ background: primary, color: primaryText }} aria-label="افزایش تعداد">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-black" style={{ color: panelText }}>{new Intl.NumberFormat('fa-IR').format(item.quantity)}</span>
                        <button onClick={() => dec(item.product)} className="rounded-lg p-1" style={{ background: itemBg, color: itemText }} aria-label="کاهش تعداد">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(item.product.id)} className="rounded-xl p-2 text-red-500" style={{ background: isDarkColor(panelBg) ? 'rgba(248,113,113,.14)' : '#fef2f2' }} aria-label="حذف محصول">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 p-4" style={{ borderTop: `1px solid ${borderColor}` }}>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span style={{ color: panelMuted }}>جمع سبد</span>
              <b style={{ color: theme.productPriceColor || panelText }}>{formatPrice(total)} تومان</b>
            </div>
            <Link
              onClick={() => setOpen(false)}
              to="/cart"
              className="block rounded-2xl py-3 text-center text-sm font-black shadow-lg transition hover:-translate-y-0.5 hover:brightness-95"
              style={{ background: primary, color: primaryText }}
            >
              رفتن به سبد خرید
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
