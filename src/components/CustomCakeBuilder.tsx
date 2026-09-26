import React, { useState } from 'react';
import { Upload, Check, Sparkles, Calendar, Clock, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { CustomCakeSpec, CartItem } from '../types/bakery';
import { IMAGES } from '../data/initialData';
import { ResilientImage } from './ResilientImage';
import { VoiceDictationButton } from './VoiceDictationButton';

interface CustomCakeBuilderProps {
  onAddCustomCake: (item: CartItem) => void;
}

const SIZE_OPTIONS: {
  id: CustomCakeSpec['size'];
  servings: string;
  basePrice: number;
  tiers: number;
}[] = [
  { id: 'Custom Bento', servings: '4" Lunchbox · 2–3 pax', basePrice: 380, tiers: 1 },
  { id: '6" Round', servings: '3 Layers · 8–10 pax', basePrice: 650, tiers: 1 },
  { id: '8" Round', servings: '3 Layers · 15–20 pax', basePrice: 950, tiers: 1 },
  { id: '10" Tiered', servings: '2-Tier Celebration · 35–40 pax', basePrice: 1850, tiers: 2 },
];

const FLAVOR_OPTIONS: {
  id: CustomCakeSpec['flavor'];
  note: string;
  priceDelta: number;
  spongeColor: string;
}[] = [
  { id: 'Chocolate', note: '70% Belgian dark cocoa sponge', priceDelta: 0, spongeColor: '#3E2723' },
  { id: 'Vanilla', note: 'Madagascar bourbon vanilla bean', priceDelta: 0, spongeColor: '#F5E6C8' },
  { id: 'Red Velvet', note: 'Classic cocoa buttermilk crumb', priceDelta: 80, spongeColor: '#8B1E24' },
  { id: 'Ube', note: 'Real Bohol purple yam sponge', priceDelta: 100, spongeColor: '#6B3FA0' },
  { id: 'Mocha', note: 'Batangas barako espresso chiffon', priceDelta: 60, spongeColor: '#795548' },
];

const FILLING_OPTIONS: {
  id: CustomCakeSpec['filling'];
  priceDelta: number;
  layerColor: string;
}[] = [
  { id: 'Chantilly Cream', priceDelta: 0, layerColor: '#FFFDF9' },
  { id: 'Belgian Chocolate', priceDelta: 120, layerColor: '#2D1A12' },
  { id: 'Guimaras Mango', priceDelta: 150, layerColor: '#F59E0B' },
  { id: 'Ube Halaya', priceDelta: 140, layerColor: '#7E57C2' },
  { id: 'Salted Caramel', priceDelta: 110, layerColor: '#C67D3B' },
];

const FROSTING_OPTIONS: {
  id: CustomCakeSpec['frosting'];
  priceDelta: number;
  coatColor: string;
}[] = [
  { id: 'Swiss Meringue Buttercream', priceDelta: 0, coatColor: '#FAF3E8' },
  { id: 'Whipped Cream Cheese', priceDelta: 90, coatColor: '#F7EFE2' },
  { id: 'Dark Ganache Glaze', priceDelta: 130, coatColor: '#3A231B' },
  { id: 'Minimalist Naked Coat', priceDelta: -40, coatColor: '#EFE5D5' },
];

const THEME_OPTIONS: {
  id: CustomCakeSpec['theme'];
  detail: string;
  priceDelta: number;
  accentColor: string;
}[] = [
  { id: 'Minimalist Pastel', detail: 'Smooth palette-knife finish & clean script', priceDelta: 0, accentColor: '#D4A373' },
  { id: 'Vintage Lambeth Piping', detail: 'Intricate Victorian ruffles & pearl dragees', priceDelta: 220, accentColor: '#E5989B' },
  { id: 'Tropical Floral Crown', detail: 'Edible pressed blooms & foliage', priceDelta: 260, accentColor: '#588157' },
  { id: 'Gold Leaf & Macarons', detail: '24k edible gold leaf & 4 French macarons', priceDelta: 350, accentColor: '#C59B27' },
  { id: 'Kids Character Theme', detail: 'Custom fondant topper & festive sprinkles', priceDelta: 300, accentColor: '#457B9D' },
];

const TIME_SLOTS = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

const PRESET_INSPIRATIONS = [
  { label: 'Vintage Lambeth Ribbon', url: IMAGES.customCake },
  { label: 'Royal Ube Macapuno Crown', url: IMAGES.heroSpread },
  { label: 'Celebration Dessert Tier', url: IMAGES.partyPackage },
];

export const CustomCakeBuilder: React.FC<CustomCakeBuilderProps> = ({ onAddCustomCake }) => {
  const [size, setSize] = useState<CustomCakeSpec['size']>('8" Round');
  const [flavor, setFlavor] = useState<CustomCakeSpec['flavor']>('Ube');
  const [filling, setFilling] = useState<CustomCakeSpec['filling']>('Ube Halaya');
  const [frosting, setFrosting] = useState<CustomCakeSpec['frosting']>('Swiss Meringue Buttercream');
  const [theme, setTheme] = useState<CustomCakeSpec['theme']>('Vintage Lambeth Piping');
  const [message, setMessage] = useState<string>('Happy Birthday Princess!');
  const [inspirationImage, setInspirationImage] = useState<string>(IMAGES.customCake);
  const [inspirationNote, setInspirationNote] = useState<string>('Pastel lavender borders with gold script on top');
  const [preferredDate, setPreferredDate] = useState<string>('2026-09-27');
  const [preferredTime, setPreferredTime] = useState<string>('2:00 PM');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const selectedSizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[2];
  const selectedFlavorObj = FLAVOR_OPTIONS.find((f) => f.id === flavor) || FLAVOR_OPTIONS[3];
  const selectedFillingObj = FILLING_OPTIONS.find((f) => f.id === filling) || FILLING_OPTIONS[3];
  const selectedFrostingObj = FROSTING_OPTIONS.find((f) => f.id === frosting) || FROSTING_OPTIONS[0];
  const selectedThemeObj = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[1];

  const estimatedPrice =
    selectedSizeObj.basePrice +
    selectedFlavorObj.priceDelta +
    selectedFillingObj.priceDelta +
    selectedFrostingObj.priceDelta +
    selectedThemeObj.priceDelta;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInspirationImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    const spec: CustomCakeSpec = {
      size,
      flavor,
      filling,
      frosting,
      theme,
      message: message.trim() || 'No inscription',
      inspirationImage,
      inspirationNote,
      preferredDate,
      preferredTime,
      estimatedPrice,
    };

    onAddCustomCake({
      cartItemId: `custom-cake-${Date.now()}`,
      productId: 'custom-cake-studio',
      name: `Custom ${size} ${flavor} Cake (${theme})`,
      category: 'cakes',
      unitPrice: estimatedPrice,
      quantity: 1,
      image: inspirationImage || IMAGES.customCake,
      customCake: spec,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-stone-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-900 mb-2">
            Bespoke Patisserie Configurator · 10-Step Custom Order
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900 tracking-tight">
            Customize Your Celebration Cake
          </h1>
        </div>
        <p className="text-sm text-stone-600 max-w-md">
          Crafted to order by our pastry team. Select your sponge, artisanal filling, piping aesthetic, and upload your reference design for live pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left 7 Columns: 10-Step Configurator */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Cake Size */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">
                01. Choose Cake Size & Portion
              </h2>
              <span className="text-xs text-stone-500">Base price by diameter</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIZE_OPTIONS.map((opt) => {
                const isSelected = size === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSize(opt.id)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-amber-900 bg-amber-950/[0.03] text-stone-900'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{opt.id}</span>
                      <span className="font-mono text-sm font-medium text-amber-900 tabular-nums">
                        ₱{opt.basePrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">{opt.servings}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Sponge Flavor */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">
                02. Choose Sponge Flavor
              </h2>
              <span className="text-xs text-stone-500">Freshly baked daily</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FLAVOR_OPTIONS.map((opt) => {
                const isSelected = flavor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFlavor(opt.id)}
                    className={`text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'border-amber-900 bg-amber-950/[0.03] text-stone-900'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 mt-0.5 border border-black/15"
                      style={{ backgroundColor: opt.spongeColor }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{opt.id}</span>
                        <span className="font-mono text-xs text-stone-500 tabular-nums">
                          {opt.priceDelta === 0 ? 'Included' : `+₱${opt.priceDelta}`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{opt.note}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 & Step 4: Filling & Frosting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200/90 rounded-xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-4">
                03. Choose Layer Filling
              </h2>
              <div className="space-y-2.5">
                {FILLING_OPTIONS.map((opt) => {
                  const isSelected = filling === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilling(opt.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isSelected
                          ? 'border-amber-900 bg-amber-950/[0.03] font-semibold text-stone-900'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-3 h-3 rounded-full border border-stone-300 shrink-0"
                          style={{ backgroundColor: opt.layerColor }}
                        />
                        <span className="truncate">{opt.id}</span>
                      </span>
                      <span className="font-mono text-xs text-stone-500 tabular-nums shrink-0 ml-2">
                        {opt.priceDelta === 0 ? 'Included' : `+₱${opt.priceDelta}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-stone-200/90 rounded-xl p-6">
              <h2 className="text-base font-semibold text-stone-900 mb-4">
                04. Choose Frosting Coat
              </h2>
              <div className="space-y-2.5">
                {FROSTING_OPTIONS.map((opt) => {
                  const isSelected = frosting === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFrosting(opt.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                        isSelected
                          ? 'border-amber-900 bg-amber-950/[0.03] font-semibold text-stone-900'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{opt.id}</span>
                      <span className="font-mono text-xs text-stone-500 tabular-nums shrink-0 ml-2">
                        {opt.priceDelta === 0
                          ? 'Included'
                          : opt.priceDelta > 0
                          ? `+₱${opt.priceDelta}`
                          : `-₱${Math.abs(opt.priceDelta)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 5: Design / Theme */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-900">
                05. Choose Design & Piping Theme
              </h2>
              <span className="text-xs text-stone-500">Hand-crafted finish</span>
            </div>
            <div className="space-y-2.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-amber-900 bg-amber-950/[0.03] text-stone-900'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{opt.id}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{opt.detail}</p>
                    </div>
                    <span className="font-mono text-xs font-medium text-amber-900 tabular-nums shrink-0">
                      {opt.priceDelta === 0 ? 'Included' : `+₱${opt.priceDelta}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 6 & Step 7: Dedication Message + Inspiration Photo Upload & Inquiry Description */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="cake-dedication-input"
                  className="block text-base font-semibold text-stone-900"
                >
                  06. Dedication Message on Cake
                </label>
                <VoiceDictationButton
                  onTranscript={(spoken) => setMessage(spoken.slice(0, 45))}
                  fallbackPhrases={[
                    'Happy Birthday Princess!',
                    'Happy 50th Golden Anniversary!',
                    'Congratulations on Your Graduation!',
                  ]}
                  ariaLabel="Dictate dedication message on cake"
                  title="Speak dedication message (Voice-to-Text)"
                  className="px-2.5 py-1 border border-stone-200 bg-stone-50"
                  showLabel
                  labelText="Speak Message"
                />
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Hand-piped on the top cake board or crown (up to 45 characters).
              </p>
              <div className="relative">
                <input
                  id="cake-dedication-input"
                  type="text"
                  maxLength={45}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Happy Birthday Princess!"
                  className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-amber-900"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <VoiceDictationButton
                    onTranscript={(spoken) => setMessage(spoken.slice(0, 45))}
                    fallbackPhrases={[
                      'Happy Birthday Princess!',
                      'Happy 50th Golden Anniversary!',
                      'Congratulations on Your Graduation!',
                    ]}
                    ariaLabel="Voice input for dedication message"
                    title="Voice input for dedication message"
                    className="p-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-stone-900">
                  07. Upload Inspiration Photo &amp; Inquiry Description
                </span>
                <span className="text-xs text-stone-500">JPG, PNG or Reference Preset</span>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Attach a photo of your peg/reference cake and describe your custom cake inquiry details (or use the microphone button for voice-to-text dictation).
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium cursor-pointer hover:bg-stone-800 transition-colors whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Reference Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {PRESET_INSPIRATIONS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setInspirationImage(preset.url)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                      inspirationImage === preset.url
                        ? 'border-amber-900 bg-amber-950/[0.04] text-amber-950'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="decorator-notes"
                  className="block text-xs font-semibold text-stone-800"
                >
                  Custom Cake Inquiry Description &amp; Decorator Notes
                </label>
                <VoiceDictationButton
                  onTranscript={(spoken) =>
                    setInspirationNote((prev) =>
                      prev.trim() ? `${prev.trim()} · ${spoken}` : spoken
                    )
                  }
                  fallbackPhrases={[
                    'Two-tier pastel lavender Lambeth piping with edible gold leaf, less sweet buttercream, and macapuno filling',
                    'Soft blush pink base with Victorian cream ruffles, pearl beads, and fresh mango compote layers',
                    'Minimalist ivory coat with pressed tropical flowers and gold script inscription on top',
                  ]}
                  ariaLabel="Voice-to-text input for custom cake inquiry description"
                  title="Dictate custom cake inquiry description (Voice-to-Text)"
                  className="px-2.5 py-1 border border-amber-900/30 bg-amber-50/50 text-amber-950"
                  showLabel
                  labelText="Dictate Description"
                />
              </div>

              <div className="relative">
                <textarea
                  id="decorator-notes"
                  rows={3}
                  value={inspirationNote}
                  onChange={(e) => setInspirationNote(e.target.value)}
                  placeholder="Describe your custom cake inquiry, color palette, piping style, dietary notes, or tap the microphone to speak..."
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-800 focus:outline-none focus:border-amber-900 resize-y"
                />
                <div className="absolute right-2.5 top-2.5">
                  <VoiceDictationButton
                    onTranscript={(spoken) =>
                      setInspirationNote((prev) =>
                        prev.trim() ? `${prev.trim()} · ${spoken}` : spoken
                      )
                    }
                    fallbackPhrases={[
                      'Two-tier pastel lavender Lambeth piping with edible gold leaf, less sweet buttercream, and macapuno filling',
                      'Soft blush pink base with Victorian cream ruffles, pearl beads, and fresh mango compote layers',
                      'Minimalist ivory coat with pressed tropical flowers and gold script inscription on top',
                    ]}
                    ariaLabel="Microphone voice-to-text for custom cake inquiry description"
                    title="Speak custom cake inquiry description"
                    className="p-1.5 bg-stone-100 hover:bg-amber-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 8: Select Date & Time */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6">
            <h2 className="text-base font-semibold text-stone-900 mb-4">
              08. Select Preferred Pickup or Delivery Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cake-date" className="block text-xs font-medium text-stone-600 mb-1.5">
                  Celebration / Fulfillment Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cake-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Preferred Time Window
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredTime(slot)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors whitespace-nowrap ${
                        preferredTime === slot
                          ? 'border-amber-900 bg-amber-900 text-white font-medium'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live Schematic + Step 9 Price Estimator + Step 10 Add to Cart */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-stone-500">
                Live Patisserie Preview · {size}
              </span>
              <span className="text-xs font-mono text-amber-900 tabular-nums">
                Est. ₱{estimatedPrice.toLocaleString()}
              </span>
            </div>

            {/* Interactive Cake Cross-Section & Inscription Preview */}
            <div className="bg-[#FAF8F5] border border-stone-200/70 rounded-xl p-5 mb-5 flex flex-col items-center">
              {/* Top-Down Inscription Plaque Preview */}
              <div
                className="w-full py-4 px-5 rounded-lg border border-stone-300/80 shadow-xs text-center mb-4 transition-colors"
                style={{
                  backgroundColor: selectedFrostingObj.coatColor,
                  borderColor: selectedThemeObj.accentColor,
                  borderWidth: '2px',
                }}
              >
                <p className="text-[11px] text-stone-500 mb-1">
                  Inscription Preview ({theme})
                </p>
                <p
                  className="font-display italic text-lg sm:text-xl font-semibold tracking-wide break-words"
                  style={{
                    color:
                      frosting === 'Dark Ganache Glaze' ? '#FDE68A' : '#582F0E',
                  }}
                >
                  “{message || 'Your Custom Dedication'}”
                </p>
              </div>

              {/* Layer Architecture Diagram */}
              <div className="w-full flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                  <ResilientImage
                    src={inspirationImage}
                    alt="Selected cake inspiration"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-xs border border-black/20 shrink-0"
                      style={{ backgroundColor: selectedFrostingObj.coatColor }}
                    />
                    <span className="text-stone-500">Coat:</span>
                    <span className="font-medium text-stone-900 truncate">{frosting}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-xs border border-black/20 shrink-0"
                      style={{ backgroundColor: selectedFlavorObj.spongeColor }}
                    />
                    <span className="text-stone-500">Sponge:</span>
                    <span className="font-medium text-stone-900 truncate">{flavor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-xs border border-black/20 shrink-0"
                      style={{ backgroundColor: selectedFillingObj.layerColor }}
                    />
                    <span className="text-stone-500">Filling:</span>
                    <span className="font-medium text-stone-900 truncate">{filling}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span className="truncate">
                      {preferredDate} at {preferredTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 9: Itemized Price Breakdown */}
            <div className="border-t border-stone-200 pt-4 mb-6">
              <h3 className="text-xs font-semibold text-stone-900 mb-3">
                09. Itemized Price Estimate
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>Base Size ({size})</dt>
                  <dd className="font-mono tabular-nums text-stone-900">
                    ₱{selectedSizeObj.basePrice.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Sponge ({flavor})</dt>
                  <dd className="font-mono tabular-nums text-stone-900">
                    {selectedFlavorObj.priceDelta === 0
                      ? '₱0'
                      : `+₱${selectedFlavorObj.priceDelta}`}
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Filling ({filling})</dt>
                  <dd className="font-mono tabular-nums text-stone-900">
                    {selectedFillingObj.priceDelta === 0
                      ? '₱0'
                      : `+₱${selectedFillingObj.priceDelta}`}
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Frosting ({frosting})</dt>
                  <dd className="font-mono tabular-nums text-stone-900">
                    {selectedFrostingObj.priceDelta === 0
                      ? '₱0'
                      : selectedFrostingObj.priceDelta > 0
                      ? `+₱${selectedFrostingObj.priceDelta}`
                      : `-₱${Math.abs(selectedFrostingObj.priceDelta)}`}
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Design ({theme})</dt>
                  <dd className="font-mono tabular-nums text-stone-900">
                    {selectedThemeObj.priceDelta === 0
                      ? '₱0'
                      : `+₱${selectedThemeObj.priceDelta}`}
                  </dd>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-stone-200 font-semibold text-stone-900 text-base">
                  <dt>Estimated Total</dt>
                  <dd className="font-mono text-xl text-amber-900 tabular-nums">
                    ₱{estimatedPrice.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Step 10: Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-3.5 px-5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Custom Cake Added to Order Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>10. Add Custom Cake to Bag · ₱{estimatedPrice.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
