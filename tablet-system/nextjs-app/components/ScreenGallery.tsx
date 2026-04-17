'use client';

import { motion } from 'framer-motion';
import { ProgressDots } from './ScreenWhy';

interface ScreenGalleryProps {
  onNext: () => void;
  onPrev: () => void;
}

const HIGHLIGHTS = [
  {
    icon: '✈︎',
    title: 'Airport Transfers',
    body:  'Tracked to your flight. Waiting when you land.',
    tag:   'From $155',
  },
  {
    icon: '⏱',
    title: 'Hourly Charter',
    body:  'By the hour, on your schedule. Corporate roadshows to evenings out.',
    tag:   '$165/hr',
  },
  {
    icon: '🏟',
    title: 'Sporting Events',
    body:  'Cowboys. Mavs. Stars. Rangers. Skip the parking.',
    tag:   '$300 RT',
  },
  {
    icon: '🌙',
    title: 'Night Out',
    body:  'Dinners, shows, and personal evenings. Professional and discreet.',
    tag:   'From $475',
  },
  {
    icon: '💍',
    title: 'Weddings',
    body:  'Red carpet arrival. Complimentary décor. Full coordination.',
    tag:   '$625+',
  },
  {
    icon: '🏢',
    title: 'Corporate Account',
    body:  '4+ rides/month. 10–15% off. Monthly invoicing.',
    tag:   'Custom',
  },
];

export default function ScreenGallery({ onNext, onPrev }: ScreenGalleryProps) {
  return (
    <div className="flex flex-col h-full px-8 py-10">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Our Services</p>
        <h2 className="font-serif-lux text-[40px] font-light text-lux-white leading-tight">
          Every Occasion. <em className="text-gold2">Every Detail.</em>
        </h2>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {HIGHLIGHTS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 + 0.15 }}
            className="rounded-2xl p-5 flex flex-col justify-between"
            style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
          >
            <div>
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="text-[14px] font-medium text-lux-white mb-2">{item.title}</h3>
              <p className="text-[12px] text-lux-muted leading-relaxed">{item.body}</p>
            </div>
            <span
              className="inline-block mt-4 text-[10px] tracking-[2px] uppercase rounded-full px-3 py-1 self-start"
              style={{ background: 'rgba(201,168,76,0.10)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {item.tag}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6">
        <button onClick={onPrev} className="text-[11px] text-lux-muted tracking-[2px] uppercase hover:text-lux-white transition-colors">
          ← Back
        </button>
        <ProgressDots active={2} total={4} />
        <button
          onClick={onNext}
          className="text-[11px] tracking-[2.5px] uppercase px-6 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/[0.06] transition-colors"
        >
          Book a Ride →
        </button>
      </div>
    </div>
  );
}
