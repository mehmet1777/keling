import React from "react";
import { PinContainer } from "./ui/3d-pin";

const ReplayDialog = ({ time, onReplay, onBack }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <PinContainer title="Tebrikler!" onReplay={onReplay} onBack={onBack}>
        <div className="flex flex-col items-center justify-center p-8 tracking-tight text-slate-100/50 w-[24rem] h-[16rem] bg-[#1a1f2e] rounded-2xl border border-white/[0.1]">
          <h2 className="text-2xl font-bold text-white mb-6">
            Bu bölümü daha önce tamamladınız!
          </h2>

          <div className="flex flex-col items-center mb-8">
            <div className="text-pink-500 text-sm mb-1">En İyi Süreniz</div>
            <div className="flex items-center gap-2">
              <span className="text-pink-500 text-2xl">⏰</span>
              <span className="text-pink-500 text-2xl font-mono">{time}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onReplay}
              className="px-6 py-2 bg-[#2a2f3e] text-white rounded-lg hover:bg-[#3a3f4e] transition-colors"
            >
              Tekrar Oyna
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-[#2a2f3e] text-white rounded-lg hover:bg-[#3a3f4e] transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </PinContainer>
    </div>
  );
};

export default ReplayDialog;
