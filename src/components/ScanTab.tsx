import { Camera, Loader2, Package, Search, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChangeEventHandler, RefObject } from 'react';

type ScanTabProps = {
  aiFoodScanAvailable: boolean;
  barcodeCameraInputRef: RefObject<HTMLInputElement | null>;
  barcodeDetectorSupported: boolean;
  barcodeGalleryInputRef: RefObject<HTMLInputElement | null>;
  foodBarcode: string;
  isAnalyzing: boolean;
  isBarcodeScanning: boolean;
  onBarcodeImageUpload: ChangeEventHandler<HTMLInputElement>;
  onFoodBarcodeChange: (value: string) => void;
  onQuickBarcodeLookup: () => void;
  onQuickCameraFlow: () => void;
  onQuickGalleryFlow: () => void;
  onSearchFoodInstead: () => void;
  savedBarcodeCount: number;
};

const BARCODE_FLOW_STEPS = [
  {
    title: 'Type or scan the barcode',
    description: 'Use digits directly or let CALSNAP AI read a clean barcode photo.',
  },
  {
    title: 'Review the matched nutrition',
    description: 'Calories, macros, and available nutrients fill in before anything is saved.',
  },
  {
    title: 'Save it like any other food',
    description: 'The item lands in your log and becomes faster next time through saved barcode matches.',
  },
];

const SCAN_CONFIDENCE_STEPS = [
  'Take one clear photo of the meal.',
  'Review the estimate in the save sheet.',
  'Adjust quantity if needed, then confirm.',
];

const BEST_RESULT_TIPS = [
  {
    title: 'Clear plated meals',
    description: 'Keep the full meal in frame with good contrast and lighting.',
    icon: Camera,
  },
  {
    title: 'Use gallery when needed',
    description: 'Saved photos work well for restaurant meals or quick catch-up logging.',
    icon: Upload,
  },
  {
    title: 'Search if typing is easier',
    description: 'Search stays best for packaged foods, exact brands, and quick manual entry.',
    icon: Search,
  },
];

export function ScanTab({
  aiFoodScanAvailable,
  barcodeCameraInputRef,
  barcodeDetectorSupported,
  barcodeGalleryInputRef,
  foodBarcode,
  isAnalyzing,
  isBarcodeScanning,
  onBarcodeImageUpload,
  onFoodBarcodeChange,
  onQuickBarcodeLookup,
  onQuickCameraFlow,
  onQuickGalleryFlow,
  onSearchFoodInstead,
  savedBarcodeCount,
}: ScanTabProps) {
  return (
    <section className="space-y-6 premium-tab-shell">
      <div className="glass-card premium-tab-hero premium-scan-stage p-6 sm:p-7 space-y-6 border border-brand-500/15">
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">Photo scan</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-[#111827] dark:text-white">Scan a meal with a photo</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Use scan when a photo is faster than typing. Every result still opens review before it is saved.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="premium-home-chip premium-home-chip-sky">Photo only</span>
                  <span className="premium-home-chip premium-home-chip-soft">Review before save</span>
                  <span className={`premium-home-chip ${aiFoodScanAvailable ? 'premium-home-chip-brand' : 'premium-home-chip-muted'}`}>
                    {aiFoodScanAvailable ? 'Ready to scan' : 'Needs setup'}
                  </span>
                </div>
              </div>
              <div className="premium-scan-hero-icon w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0">
                <Camera size={24} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="premium-scan-status-card neutral-row rounded-[24px] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Scan status</p>
                <p className="mt-2 text-base font-semibold text-[#111827] dark:text-white">
                  {aiFoodScanAvailable ? 'Ready to scan' : 'Setup needed'}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {isAnalyzing
                    ? 'Analyzing the current image and preparing your review step.'
                    : 'Use scan when the photo is the clearest input.'}
                </p>
              </div>

              <div className="premium-scan-status-card neutral-row rounded-[24px] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Save flow</p>
                <p className="mt-2 text-base font-semibold text-[#111827] dark:text-white">Review before save</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Every result opens the save sheet first so quantity and labels stay easy to fix.
                </p>
              </div>
            </div>

            <div className="neutral-row rounded-[24px] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Trust note</p>
                  <p className="mt-2 text-base font-semibold text-[#111827] dark:text-white">
                    Search stays the default for typed food logging. Scan is here when a photo is the clearest input.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                    aiFoodScanAvailable
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {aiFoodScanAvailable ? 'Ready' : 'Setup'}
                </span>
              </div>
            </div>
          </div>

          <div className="premium-scan-cta-shell neutral-row rounded-[28px] p-5 sm:p-6">
            <div className="premium-scan-cta-orb">
              <motion.button
                type="button"
                onClick={onQuickCameraFlow}
                disabled={!aiFoodScanAvailable || isAnalyzing}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="premium-scan-btn premium-scan-stage-btn disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? <div className="premium-spinner" /> : <Camera size={30} className="text-white" />}
              </motion.button>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-base font-semibold text-[#111827] dark:text-white">
                {isAnalyzing
                  ? 'Analyzing your meal...'
                  : aiFoodScanAvailable
                    ? 'Tap to scan a plated meal quickly.'
                    : 'Photo scan needs setup on this device.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camera works best when the full meal is visible with good lighting.
              </p>
            </div>

            {isAnalyzing && (
              <div className="premium-scan-live-status">
                <Loader2 className="animate-spin" size={16} />
                Preparing nutrition review
              </div>
            )}

            <div className="premium-upload-card premium-scan-upload-card">
              <div className="premium-upload-card-main">
                <div className="premium-icon-badge bg-slate-50 dark:bg-slate-800">
                  <Upload size={20} className="text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-white">Upload a photo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose a saved photo and let CALSNAP AI analyze it for you.
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={onQuickGalleryFlow}
                disabled={!aiFoodScanAvailable || isAnalyzing}
                whileTap={{ scale: 0.96 }}
                className="neutral-secondary-btn inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Analyzing...
                  </>
                ) : (
                  'Upload & scan'
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="glass-card p-5 sm:p-6 space-y-4 border border-brand-500/15">
          <div className="premium-section-heading">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Packaged foods and barcodes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Look up branded foods fast, then review before they are saved.
              </p>
            </div>
            <Package size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="neutral-row rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Saved matches</p>
              <p className="mt-2 text-2xl font-black text-[#111827] dark:text-white">{savedBarcodeCount}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your repeated packaged foods get faster over time.</p>
            </div>
            <div className="neutral-row rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Camera support</p>
              <p className="mt-2 text-base font-semibold text-[#111827] dark:text-white">
                {barcodeDetectorSupported ? 'Ready on this device' : 'Manual entry fallback'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {barcodeDetectorSupported
                  ? 'Take a clean barcode photo and CALSNAP AI will try to read it.'
                  : 'Barcode lookup still works with typed digits even if camera detection is not supported here.'}
              </p>
            </div>
          </div>

          <div className="premium-food-search-shell">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
              <input
                type="text"
                inputMode="numeric"
                value={foodBarcode}
                onChange={(event) => onFoodBarcodeChange(event.target.value)}
                placeholder="Enter or scan a barcode"
                className="neutral-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>
            <div className="premium-food-search-meta">
              <span>Works with 8 to 14 digit codes</span>
              <span>Opens the same review sheet before save</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onQuickBarcodeLookup}
              disabled={isAnalyzing || isBarcodeScanning}
              className="neutral-primary-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Package size={16} />}
              Lookup barcode
            </button>
            <button
              type="button"
              onClick={() => barcodeCameraInputRef.current?.click()}
              disabled={isBarcodeScanning}
              className="neutral-pill-btn rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <Camera size={14} />
              Scan with camera
            </button>
            <button
              type="button"
              onClick={() => barcodeGalleryInputRef.current?.click()}
              disabled={isBarcodeScanning}
              className="neutral-pill-btn rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <Upload size={14} />
              Upload barcode
            </button>
          </div>

          {isBarcodeScanning && (
            <div className="premium-scan-live-status">
              <Loader2 className="animate-spin" size={16} />
              Reading barcode from image
            </div>
          )}

          <input
            ref={barcodeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onBarcodeImageUpload}
          />
          <input
            ref={barcodeGalleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onBarcodeImageUpload}
          />
        </div>

        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="premium-section-heading">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Barcode flow</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Keep it simple for packaged foods and supplements.
              </p>
            </div>
            <Sparkles size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3">
            {BARCODE_FLOW_STEPS.map((item) => (
              <div key={item.title} className="premium-scan-helper-card neutral-row rounded-[22px] px-4 py-4">
                <p className="text-sm font-semibold text-[#111827] dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="premium-section-heading">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Scan with confidence</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                One clear photo, one review step, then save.
              </p>
            </div>
            <ShieldCheck size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SCAN_CONFIDENCE_STEPS.map((item, index) => (
              <div key={`scan-step-${index}`} className="premium-scan-step neutral-row rounded-[22px] px-4 py-4">
                <div className="premium-scan-step-index">{index + 1}</div>
                <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-white">{item}</p>
              </div>
            ))}
          </div>

          <details className="neutral-row rounded-[22px] px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#111827] dark:text-white">
              Need a quick refresher?
            </summary>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Scan works best for plated meals and mixed dishes. Use search for normal typed food lookup, and use barcode for packaged foods.
            </p>
          </details>
        </div>

        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="premium-section-heading">
            <div>
              <h3 className="font-bold text-[#111827] dark:text-white">Best results</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                A few habits make scan feel faster and more accurate.
              </p>
            </div>
            <Sparkles size={18} className="text-brand-500 shrink-0" />
          </div>

          <div className="grid gap-3">
            {BEST_RESULT_TIPS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="premium-scan-helper-card neutral-row rounded-[22px] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="premium-home-card-icon flex h-10 w-10 items-center justify-center rounded-2xl shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827] dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onSearchFoodInstead}
            className="neutral-secondary-btn w-full py-3 text-sm font-semibold"
          >
            Search food instead
          </button>
        </div>
      </div>
    </section>
  );
}
