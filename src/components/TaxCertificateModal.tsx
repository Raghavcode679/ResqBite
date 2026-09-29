import React from 'react';
import { DonationBatch } from '../types';
import { X, Printer, ShieldCheck, Award, Leaf, Download } from 'lucide-react';

interface TaxCertificateModalProps {
  batch: DonationBatch | null;
  onClose: () => void;
}

export const TaxCertificateModal: React.FC<TaxCertificateModalProps> = ({
  batch,
  onClose,
}) => {
  if (!batch) return null;

  const certificateId = `CSR-80G-${batch.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const assessedValue = batch.quantityKg * 110; // ~₹110/kg average value

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Actions Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            GOVERNMENT OF INDIA RECOGNIZED SECTION 80G RECEIPT
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Styled View */}
        <div className="p-8 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 space-y-6 border-8 border-slate-800/40 m-4 rounded-xl">
          {/* Certificate Header */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold tracking-wider uppercase text-white font-sans">
              National Food Surplus Diversion Certificate
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Issued under Income Tax Act Section 80G & Companies Act 2013 (Schedule VII CSR Provisions)
            </p>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">
              Certificate No: {certificateId}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed text-justify">
              This is to certify that <strong className="text-white">{batch.donorName}</strong> has successfully diverted wholesome institutional food surplus to prevent organic landfill degradation and alleviate nutritional deprivation.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Food Item:</span>
                <span className="text-slate-200">{batch.foodTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Quantity:</span>
                <span className="text-emerald-400 font-bold">{batch.quantityKg} kg (~{batch.estimatedMeals} meals)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assessed CSR Valuation:</span>
                <span className="text-amber-400 font-bold">₹{assessedValue.toLocaleString('en-IN')} INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CO₂ Avoided:</span>
                <span className="text-teal-400 font-bold">{Math.round(batch.quantityKg * 2.45)} kg CO₂e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Redistribution Partner:</span>
                <span className="text-blue-400">{batch.matchedFoodBankName || `${batch.city} Verified Food Bank`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Timestamp:</span>
                <span className="text-slate-400">{batch.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Footer & Digital Seal */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-[9px] bg-emerald-950/40">
                SEAL
              </div>
              <div>
                <span className="text-slate-300 font-bold block">FSSAI Certified</span>
                <span>Audit Protocol Verified</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block font-sans">ResqBite Foundation & Trust</span>
              <span>Autonomous Registry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
