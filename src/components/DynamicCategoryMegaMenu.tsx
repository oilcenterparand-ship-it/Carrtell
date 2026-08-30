import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Droplets, Grid3X3, PackageCheck, Truck, X } from 'lucide-react';
import { buildCategoryTree, getCategoryDestination, type ProductCategory, type ProductCategoryNode } from '../admin/services/categoriesApi';
import { type MegaMenuPromotion } from '../admin/services/homeContentApi';

type Props = {
  open: boolean;
  categories: ProductCategory[];
  promotion: MegaMenuPromotion;
  onClose: () => void;
  onChooseCategory: (slug: string) => void;
};

function CategoryIcon({ category }: { category: ProductCategory }) {
  if (category.image_url) return <img src={category.image_url} alt="" loading="lazy" />;
  return <span aria-hidden="true">{category.icon_emoji || '🔧'}</span>;
}

function findChildren(nodes: ProductCategoryNode[], id?: string): ProductCategoryNode[] {
  if (!id) return nodes;
  for (const node of nodes) {
    if (node.id === id) return node.children;
    const nested: ProductCategoryNode[] = findChildren(node.children, id);
    if (nested !== nodes && nested.length) return nested;
  }
  return [];
}

function getInitialDesktopPath(tree: ProductCategoryNode[]) {
  const firstRootWithChildren = tree.find((item) => item.children.length > 0);
  if (!firstRootWithChildren?.id) return [];
  const path = [firstRootWithChildren.id];
  const firstChildWithChildren = firstRootWithChildren.children.find((item) => item.children.length > 0);
  if (firstChildWithChildren?.id) path.push(firstChildWithChildren.id);
  return path;
}

export default function DynamicCategoryMegaMenu({ open, categories, promotion, onClose, onChooseCategory }: Props) {
  const [path, setPath] = useState<string[]>([]);
  const [desktopGeometry, setDesktopGeometry] = useState({ top: 260, height: 348 });
  const hoverPathTimer = useRef<number | null>(null);
  const tree = useMemo(() => buildCategoryTree(categories.filter((item) => item.is_active !== false)), [categories]);
  const byId = useMemo(() => new Map(categories.filter((item) => item.id).map((item) => [item.id as string, item])), [categories]);
  const activeParent = byId.get(path[path.length - 1] || '');
  const mobileChoices = findChildren(tree, activeParent?.id);
  const columns = useMemo(() => {
    const result: ProductCategoryNode[][] = [tree];
    for (const id of path) {
      const selected = result[result.length - 1]?.find((item) => item.id === id);
      if (!selected?.children.length) break;
      result.push(selected.children);
    }
    return result;
  }, [path, tree]);
  const breadcrumb = path.map((id) => byId.get(id)?.title).filter(Boolean).join(' ← ');

  const cancelQueuedPath = () => {
    if (hoverPathTimer.current !== null) {
      window.clearTimeout(hoverPathTimer.current);
      hoverPathTimer.current = null;
    }
  };

  const queueDesktopPath = (nextPath: string[]) => {
    cancelQueuedPath();
    hoverPathTimer.current = window.setTimeout(() => {
      setPath(nextPath);
      hoverPathTimer.current = null;
    }, 110);
  };

  useEffect(() => {
    if (!open) return;
    setPath(window.innerWidth >= 768 ? getInitialDesktopPath(tree) : []);
  }, [open, tree]);

  useEffect(() => {
    if (!open) return;
    const updateGeometry = () => {
      const trigger = document.querySelector<HTMLElement>('[data-testid="home-category-toolbar-trigger"]');
      const triggerBottom = trigger?.getBoundingClientRect().bottom || 0;
      const top = Math.max(8, Math.min(triggerBottom + 3, window.innerHeight - 238));
      const availableHeight = Math.max(220, window.innerHeight - top - 18);
      const height = Math.min(348, availableHeight);
      setDesktopGeometry({ top, height });
    };
    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    window.addEventListener('scroll', updateGeometry, true);
    return () => {
      window.removeEventListener('resize', updateGeometry);
      window.removeEventListener('scroll', updateGeometry, true);
    };
  }, [open]);

  useEffect(() => () => cancelQueuedPath(), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const choose = (slug: string) => {
    onChooseCategory(slug);
    onClose();
  };

  const overlayStyle = {
    '--ct-home-menu-top': `${desktopGeometry.top}px`,
    '--ct-home-menu-height': `${desktopGeometry.height}px`,
  } as CSSProperties;

  return createPortal(
    <div className="ct-shop-category-modal ct-home-category-modal fixed inset-0 z-[100100]" style={overlayStyle} onClick={onClose} data-testid="home-category-modal">
      <section className="ct-shop-category-sheet ct-home-category-sheet w-[82%] max-w-sm overflow-y-auto p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="دسته‌بندی محصولات" onClick={(event) => event.stopPropagation()}>
        <div className="ct-home-category-desktop-head">
          <div className="ct-home-category-desktop-title"><span><Grid3X3 /></span><b>دسته‌بندی محصولات</b></div>
          <div className="ct-home-category-desktop-path"><span>خانه</span>{path.map((id) => byId.get(id)?.title).filter(Boolean).map((title) => <span key={title as string}><ArrowLeft />{title}</span>)}</div>
          <button type="button" onClick={onClose} aria-label="بستن دسته‌بندی‌ها"><X /></button>
        </div>
        <div className={`ct-shop-category-sheet-head ct-home-category-mobile-head ct-category-level-${path.length} mb-6 flex items-center justify-between`}>
          <div>
            <b>دسته‌بندی محصولات</b>
            <p>{breadcrumb || 'دسته مادر را انتخاب کن'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن دسته‌بندی‌ها"><X /></button>
        </div>

        <div className="ct-shop-category-mobile-list ct-home-category-mobile-body max-h-[calc(100vh-100px)] space-y-2 overflow-y-auto pl-1" data-testid="home-category-mobile-accordion">
          <div className="ct-home-category-mobile-roots" aria-label="دسته‌های مادر">
            {tree.map((category) => (
              <button
                type="button"
                key={category.id || category.slug}
                data-category-level="0"
                data-has-children={category.children.length > 0 ? 'true' : 'false'}
                className={path[0] === category.id ? 'is-active' : ''}
                onClick={() => category.children.length && category.id ? setPath([category.id]) : choose(getCategoryDestination(category))}
              >
                <span className="ct-category-card-media"><CategoryIcon category={category} /></span><b>{category.title}</b>
              </button>
            ))}
          </div>
          {path.length > 0 && (
            <button type="button" onClick={() => setPath((current) => current.slice(0, -1))} className="ct-shop-category-choice ct-category-back w-full rounded-2xl px-4 py-3 text-right font-bold">
              <span className="ct-shop-category-choice-icon"><ArrowLeft className="rotate-180" /></span>
              <span><b>بازگشت به مرحله قبل</b><small>{path.length > 1 ? byId.get(path[path.length - 2])?.title : 'دسته‌های مادر'}</small></span>
            </button>
          )}
          {path.length > 0 && mobileChoices.map((category) => (
            <button
              type="button"
              key={category.id || category.slug}
              data-category-level={path.length}
              data-has-children={category.children.length > 0 ? 'true' : 'false'}
              onClick={() => category.children.length && category.id ? setPath((current) => [...current, category.id as string]) : choose(getCategoryDestination(category))}
              className={`ct-shop-category-choice ct-category-choice-level-${Math.min(path.length, 2)} w-full rounded-2xl px-4 py-3 text-right font-bold`}
            >
              <span className="ct-shop-category-choice-icon"><CategoryIcon category={category} /></span>
              <span className="ct-category-choice-copy"><b>{category.title}</b><small>{path.length === 0 ? 'دسته مادر' : category.children.length ? `شاخه سطح ${path.length + 1}` : 'دسته نهایی محصولات'}</small></span>
              {category.children.length ? <><em>{category.children.length.toLocaleString('fa-IR')} زیرشاخه</em><ArrowLeft /></> : <span className="ct-category-leaf-action">نمایش محصولات</span>}
            </button>
          ))}
          {activeParent && mobileChoices.length === 0 && (
            <button type="button" onClick={() => choose(getCategoryDestination(activeParent))} className="ct-shop-category-choice ct-category-final-action w-full rounded-2xl px-4 py-3 text-right font-bold">
              <span className="ct-shop-category-choice-icon"><PackageCheck /></span><span>نمایش محصولات {activeParent.title}</span><ArrowLeft />
            </button>
          )}
          {path.length === 0 && promotion.is_active && (
            <button type="button" onClick={() => choose(promotion.link_url || '/shop')} className="ct-mobile-mega-promotion ct-home-mobile-promotion w-full text-right" data-testid="home-mobile-mega-menu-promotion">
              {promotion.image_url ? <img src={promotion.image_url} alt={promotion.title} /> : <span><Truck /><Droplets /></span>}
              <div>{promotion.badge && <small>{promotion.badge}</small>}<b>{promotion.title}</b><em>{promotion.subtitle}</em><strong>{promotion.button_text}<ArrowLeft /></strong></div>
            </button>
          )}
          {path.length === 0 && (
            <button type="button" onClick={() => choose('/shop')} className="ct-home-mobile-all-products">
              <Grid3X3 /><span>مشاهده همه محصولات</span><ArrowLeft />
            </button>
          )}
        </div>

        <div className="ct-shop-category-desktop-cascade" data-testid="home-category-desktop-cascade">
          <section className="ct-home-category-root-panel" data-testid="home-category-column-0">
            <h3>دسته‌های اصلی</h3>
            <div className="ct-home-category-root-grid">
              {tree.map((category) => (
                <button
                  type="button"
                  key={category.id || category.slug}
                  data-has-children={category.children.length > 0 ? 'true' : 'false'}
                  className={path[0] === category.id ? 'is-active' : ''}
                  onMouseEnter={() => category.id && category.children.length > 0 && queueDesktopPath([category.id])}
                  onFocus={() => category.id && category.children.length > 0 && setPath([category.id])}
                  onClick={() => category.children.length && category.id ? setPath([category.id]) : choose(getCategoryDestination(category))}
                >
                  <span className="ct-category-card-media"><CategoryIcon category={category} /></span><b>{category.title}</b>{category.children.length ? <ArrowLeft /> : <small>محصولات</small>}
                </button>
              ))}
            </div>
          </section>
          <div className="ct-shop-category-cascade-columns ct-home-category-branch-columns" onMouseEnter={cancelQueuedPath}>
            {columns.slice(1).map((column, columnIndex) => {
              const depth = columnIndex + 1;
              return (
              <section key={`home-category-column-${depth}`} data-testid={`home-category-column-${depth}`}>
                <h3>{byId.get(path[depth - 1] || '')?.title}</h3>
                {column.map((category) => (
                  <button
                    type="button"
                    key={category.id || category.slug}
                    data-has-children={category.children.length > 0 ? 'true' : 'false'}
                    className={path[depth] === category.id ? 'is-active' : ''}
                    onMouseEnter={() => category.id && category.children.length > 0 && queueDesktopPath([...path.slice(0, depth), category.id as string])}
                    onFocus={() => category.id && category.children.length > 0 && setPath((current) => [...current.slice(0, depth), category.id as string])}
                    onClick={() => category.children.length && category.id ? setPath((current) => [...current.slice(0, depth), category.id as string]) : choose(getCategoryDestination(category))}
                  >
                    <span><CategoryIcon category={category} /></span><b>{category.title}</b>{category.children.length ? <ArrowLeft /> : <small>محصولات</small>}
                  </button>
                ))}
              </section>
              );
            })}
          </div>
          {promotion.is_active && (
            <a href={promotion.link_url || '/shop'} onClick={(event) => { event.preventDefault(); choose(promotion.link_url || '/shop'); }} className="ct-mega-promotion ct-home-mega-promotion text-right" data-testid="home-mega-menu-promotion">
              <span className="ct-mega-promotion-grid" aria-hidden="true" />
              {promotion.image_url ? <img src={promotion.image_url} alt={promotion.title} /> : <span className="ct-mega-promotion-visual"><Truck /><Droplets /></span>}
              <span className="ct-mega-promotion-copy">{promotion.badge && <small>{promotion.badge}</small>}<b>{promotion.title}</b>{promotion.subtitle && <span>{promotion.subtitle}</span>}<strong>{promotion.button_text || 'مشاهده محصولات'} <ArrowLeft /></strong></span>
            </a>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
