import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Heart, Check } from 'lucide-react';
import { CartItem, Product } from '../types/bakery';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}) => {
  const [selectedVarIdx, setSelectedVarIdx] = useState<number>(
    product?.variations && product.variations.length > 1 ? 1 : 0
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  if (!product) return null;

  const activeVariation = product.variations?.[selectedVarIdx];
  const unitPrice = product.price + (activeVariation ? activeVariation.priceDelta : 0);

  const handleAdd = () => {
    onAddToCart({
      cartItemId: `${product.id}-${activeVariation?.id || 'std'}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      category: product.category,
      unitPrice,
      quantity,
      image: product.image,
      selectedVariation: activeVariation ? activeVariation.label : product.unitLabel,
    });
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12">
        {/* Left Gallery */}
        <div className="md:col-span-6 bg-stone-100 aspect-[4/3] md:aspect-auto relative">
          <ResilientImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>{product.subcategory}</span>
                <span aria-hidden="true">·</span>
                <span>{product.prepTime}</span>
                <span aria-hidden="true">·</span>
                <span>{product.stock} in kitchen</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                aria-label="Close product detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-2xl font-display font-semibold text-stone-900 leading-tight">
              {product.name}
            </h2>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold text-amber-900 tabular-nums">
                ₱{unitPrice.toLocaleString()}
              </span>
              <span className="text-xs text-stone-500">
                {activeVariation ? activeVariation.label : product.unitLabel} ·{' '}
                {product.rating.toFixed(1)} ★ ({product.reviewCount} reviews)
              </span>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed mt-4">
              {product.description}
            </p>

            {/* Variations Selector */}
            {product.variations && product.variations.length > 0 && (
              <div className="mt-5">
                <span className="block text-xs font-semibold text-stone-900 mb-2">
                  Select Portion / Size
                </span>
                <div className="space-y-2">
                  {product.variations.map((v, idx) => {
                    const varPrice = product.price + v.priceDelta;
                    const isSelected = idx === selectedVarIdx;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVarIdx(idx)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-amber-900 bg-amber-950/[0.04] font-semibold text-stone-900'
                            : 'border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <span>{v.label}</span>
                        <span className="font-mono tabular-nums text-amber-900">
                          ₱{varPrice.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bundle Inclusions */}
            {product.inclusions && product.inclusions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-stone-200">
                <span className="block text-xs font-semibold text-stone-900 mb-2">
                  Package Inclusions
                </span>
                <ul className="space-y-1 text-xs text-stone-600">
                  {product.inclusions.map((inc) => (
                    <li key={inc}>• {inc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Purchase Controls */}
          <div className="mt-6 pt-5 border-t border-stone-200 flex items-center gap-3">
            <div className="inline-flex items-center border border-stone-300 rounded-lg bg-stone-50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-mono font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                isFavorite
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
              aria-label="Save to favorites"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2.5 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag · ₱{(unitPrice * quantity).toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
