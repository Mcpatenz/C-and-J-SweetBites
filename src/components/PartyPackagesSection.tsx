import React, { useState } from 'react';
import { Check, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { CartItem, PartyPackageCustomization } from '../types/bakery';
import { IMAGES } from '../data/initialData';
import { ResilientImage } from './ResilientImage';

interface PartyPackagesSectionProps {
  onAddPackageToCart: (item: CartItem) => void;
}

interface PackagePreset {
  id: string;
  title: string;
  occasion: PartyPackageCustomization['eventType'];
  paxLabel: string;
  price: number;
  savingsLabel: string;
  image: string;
  inclusions: string[];
  defaultCakeFlavor: string;
  defaultBrownies: string;
  defaultSavory: string;
}

const OCCASION_FILTERS = [
  'All Occasions',
  'Birthday',
  'Baptism',
  'Graduation',
  'Corporate Events',
  'Wedding',
  'Christmas',
] as const;

const PARTY_PACKAGES: PackagePreset[] = [
  {
    id: 'pkg-birthday-999',
    title: 'Birthday Fiesta All-In Package',
    occasion: 'Birthday',
    paxLabel: 'Serves 12 Guests',
    price: 999,
    savingsLabel: 'Save ₱280 Bundle Rate',
    image: IMAGES.partyPackage,
    inclusions: [
      '1 × 8" Custom Dedication Cake',
      '12 × Belgian Dark Fudge Brownies',
      '12 × Frosted Buttercream Cupcakes',
      '12 × Savory Fiesta Food Packs',
    ],
    defaultCakeFlavor: 'Ube Macapuno Sponge',
    defaultBrownies: '6 Fudge + 6 Toasted Walnut',
    defaultSavory: 'Pancit Canton, Honey Glazed Chicken & Shanghai',
  },
  {
    id: 'pkg-baptism-1850',
    title: 'Baptism & Dedication Reception Set',
    occasion: 'Baptism',
    paxLabel: 'Serves 20 Guests',
    price: 1850,
    savingsLabel: 'Save ₱420 Bundle Rate',
    image: IMAGES.customCake,
    inclusions: [
      '1 × 8" Vintage Lambeth Cross/Floral Cake',
      '1 × Large Tray Golden Cassava Cake (16 slices)',
      '16 × Assorted Artisanal Brownie Squares',
      '20 × Gourmet Baptism Food Packs',
    ],
    defaultCakeFlavor: 'Madagascar Vanilla & Guimaras Mango',
    defaultBrownies: '8 Classic Fudge + 8 Cream Cheese Swirl',
    defaultSavory: 'Creamy Carbonara, Herb Roast Chicken & Garlic Bread',
  },
  {
    id: 'pkg-graduation-2450',
    title: 'Graduation & Family Milestone Banquet',
    occasion: 'Graduation',
    paxLabel: 'Serves 25–30 Guests',
    price: 2450,
    savingsLabel: 'Save ₱550 Bundle Rate',
    image: IMAGES.heroSpread,
    inclusions: [
      '1 × 10" Celebration Cake with Class Topper',
      '24 × Fudge & Walnut Brownie Bars',
      '2 × Whole Egg Heritage Leche Flan Llaneras',
      '25 × Fiesta Bilao & Individual Food Packs',
    ],
    defaultCakeFlavor: 'Belgian Dark Chocolate Ganache',
    defaultBrownies: '12 Fudge + 12 Salted Caramel Pretzel',
    defaultSavory: 'Beef Caldereta, Sotanghon Guisado & Lumpiang Shanghai',
  },
  {
    id: 'pkg-corporate-3200',
    title: 'Corporate Townhall & School Event Box',
    occasion: 'Corporate Events',
    paxLabel: 'Serves 30 Attendees',
    price: 3200,
    savingsLabel: 'Official Receipt Included',
    image: IMAGES.fudgeBrownies,
    inclusions: [
      '1 × 10" Company Logo Dedication Sheet Cake',
      '30 × Individually Wrapped Brownie Bars',
      '30 × Baked Cassava Cake Merienda Squares',
      '30 × Sealed Executive Hot Meal Packs',
    ],
    defaultCakeFlavor: 'Barako Mocha Chiffon',
    defaultBrownies: '30 Individually Sealed Fudge Bars',
    defaultSavory: 'Roast Beef Mushroom, Garlic Rice & Buttered Corn',
  },
  {
    id: 'pkg-wedding-4500',
    title: 'Intimate Civil Wedding & Anniversary Table',
    occasion: 'Wedding',
    paxLabel: 'Serves 35–40 Guests',
    price: 4500,
    savingsLabel: 'Includes Setup Guide',
    image: IMAGES.customCake,
    inclusions: [
      '1 × Two-Tier Swiss Meringue Floral Cake',
      '24 × Mango Bravo & Tiramisu Dessert Cups',
      '24 × Petite Gold-Leaf Brownie Bites',
      '35 × Premium Reception Meal Boxes',
    ],
    defaultCakeFlavor: 'Red Velvet with Cream Cheese Frosting',
    defaultBrownies: '24 Gold-Dusted Dark Chocolate Bites',
    defaultSavory: 'Herb Crusted Fish Fillet, Chicken Cordon Bleu & Truffle Pasta',
  },
  {
    id: 'pkg-christmas-2150',
    title: 'Noche Buena & Holiday Gift Feast',
    occasion: 'Christmas',
    paxLabel: 'Serves 18–22 Guests',
    price: 2150,
    savingsLabel: 'Holiday Ribbon Packaging',
    image: IMAGES.cassavaCake,
    inclusions: [
      '1 × 8" Holiday Wreath Ube Macapuno Cake',
      '1 × Fiesta Bilao Baked Cheese Cassava Cake',
      '16 × Peppermint & Walnut Fudge Brownies',
      '15 × Holiday Ham & Lasagna Food Packs',
    ],
    defaultCakeFlavor: 'Bohol Ube & Young Coconut',
    defaultBrownies: '16 Walnut & Dark Chocolate Bars',
    defaultSavory: 'Baked Beef Lasagna, Glazed Holiday Ham & Dinner Rolls',
  },
];

const CAKE_FLAVOR_CHOICES = [
  'Ube Macapuno Sponge',
  'Belgian Dark Chocolate Ganache',
  'Madagascar Vanilla & Guimaras Mango',
  'Red Velvet with Cream Cheese',
  'Barako Mocha Chiffon',
];

const BROWNIE_CHOICES = [
  '6 Fudge + 6 Toasted Walnut',
  '100% Belgian Dark Chocolate Fudge',
  'Assorted Fudge, Walnut & Salted Caramel',
];

const SAVORY_MENU_CHOICES = [
  'Pancit Canton, Honey Glazed Chicken & Shanghai',
  'Creamy Carbonara, Herb Roast Chicken & Garlic Bread',
  'Beef Caldereta, Garlic Rice & Lumpiang Shanghai',
  'Baked Beef Lasagna, BBQ Pork Skewer & Java Rice',
];

export const PartyPackagesSection: React.FC<PartyPackagesSectionProps> = ({
  onAddPackageToCart,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All Occasions');
  const [customizingPkgId, setCustomizingPkgId] = useState<string | null>('pkg-birthday-999');
  const [cakeFlavor, setCakeFlavor] = useState<string>(CAKE_FLAVOR_CHOICES[0]);
  const [brownieAssortment, setBrownieAssortment] = useState<string>(BROWNIE_CHOICES[0]);
  const [savoryMenu, setSavoryMenu] = useState<string>(SAVORY_MENU_CHOICES[0]);
  const [eventNotes, setEventNotes] = useState<string>('Happy Birthday! Please pack forks & napkins.');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const filteredPackages =
    selectedOccasion === 'All Occasions'
      ? PARTY_PACKAGES
      : PARTY_PACKAGES.filter((p) => p.occasion === selectedOccasion);

  const openCustomizer = (pkg: PackagePreset) => {
    if (customizingPkgId === pkg.id) {
      setCustomizingPkgId(null);
      return;
    }
    setCustomizingPkgId(pkg.id);
    setCakeFlavor(pkg.defaultCakeFlavor);
    setBrownieAssortment(pkg.defaultBrownies);
    setSavoryMenu(pkg.defaultSavory);
  };

  const handleAddPackage = (pkg: PackagePreset, useCustomState: boolean) => {
    const customization: PartyPackageCustomization = {
      eventType: pkg.occasion,
      cakeFlavor: useCustomState ? cakeFlavor : pkg.defaultCakeFlavor,
      brownieAssortment: useCustomState ? brownieAssortment : pkg.defaultBrownies,
      savoryMenuChoice: useCustomState ? savoryMenu : pkg.defaultSavory,
      eventNotes: useCustomState ? eventNotes : undefined,
    };

    onAddPackageToCart({
      cartItemId: `${pkg.id}-${Date.now()}`,
      productId: pkg.id,
      name: pkg.title,
      category: 'food_packs',
      unitPrice: pkg.price,
      quantity: 1,
      image: pkg.image,
      partyPackage: customization,
    });

    setJustAddedId(pkg.id);
    setTimeout(() => setJustAddedId(null), 2000);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200 mb-8">
        <div>
          <p className="text-xs font-medium text-amber-900 mb-2">
            Celebration & Catering Bundles · Ready for Pickup or Chilled Van Delivery
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900 tracking-tight">
            Party & Event Packages
          </h1>
        </div>

        {/* Functional Segmented Filter Bar */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/70 rounded-lg">
          {OCCASION_FILTERS.map((occ) => (
            <button
              key={occ}
              type="button"
              onClick={() => setSelectedOccasion(occ)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedOccasion === occ
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPackages.map((pkg) => {
          const isCustomizing = customizingPkgId === pkg.id;
          const isAdded = justAddedId === pkg.id;

          return (
            <article
              key={pkg.id}
              className="bg-white border border-stone-200/90 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                <ResilientImage
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {/* Clean unboxed metadata with typographic separators */}
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
                  <span>{pkg.occasion}</span>
                  <span aria-hidden="true">·</span>
                  <span>{pkg.paxLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-900 font-medium">{pkg.savingsLabel}</span>
                </div>

                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-stone-900 leading-snug">
                    {pkg.title}
                  </h2>
                  <span className="font-mono text-lg font-semibold text-amber-900 tabular-nums shrink-0">
                    ₱{pkg.price.toLocaleString()}
                  </span>
                </div>

                {/* Package Inclusions List */}
                <ul className="space-y-1.5 text-xs text-stone-700 mb-5 border-t border-b border-stone-100 py-3.5">
                  {pkg.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2">
                      <span className="text-amber-900 font-mono font-semibold">•</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>

                {/* Interactive Customization Panel */}
                {isCustomizing && (
                  <div className="mb-5 pt-2 space-y-3 border-b border-stone-200 pb-4">
                    <p className="text-xs font-semibold text-stone-900">
                      Customize Package Menu & Flavors
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Cake Flavor
                      </label>
                      <select
                        value={cakeFlavor}
                        onChange={(e) => setCakeFlavor(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900"
                      >
                        {CAKE_FLAVOR_CHOICES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Brownie Box Selection
                      </label>
                      <select
                        value={brownieAssortment}
                        onChange={(e) => setBrownieAssortment(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900"
                      >
                        {BROWNIE_CHOICES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Savory Food Pack Menu
                      </label>
                      <select
                        value={savoryMenu}
                        onChange={(e) => setSavoryMenu(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900"
                      >
                        {SAVORY_MENU_CHOICES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Cake Dedication / Event Note
                      </label>
                      <input
                        type="text"
                        value={eventNotes}
                        onChange={(e) => setEventNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-300 bg-white text-stone-900"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => openCustomizer(pkg)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      isCustomizing
                        ? 'border-stone-900 bg-stone-100 text-stone-900'
                        : 'border-stone-300 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isCustomizing ? 'Hide Options' : 'Customize'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddPackage(pkg, isCustomizing)}
                    className="py-2.5 px-3 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add · ₱{pkg.price.toLocaleString()}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
