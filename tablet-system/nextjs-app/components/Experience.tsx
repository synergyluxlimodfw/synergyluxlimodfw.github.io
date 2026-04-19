'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScreenWelcome from './ScreenWelcome';
import ScreenWhy     from './ScreenWhy';
import ScreenGallery from './ScreenGallery';
import ScreenBooking from './ScreenBooking';
import DriverOverlay from './DriverOverlay';
import Modal         from './Modal';
import { track }     from '@/lib/events';
import type { Session, Screen, RidePhase, ModalType } from '@/lib/types';

interface ExperienceProps {
  session:   Session;
  isGuest?:  boolean;  // true → skip Why + Gallery screens
  isReturn?: boolean;  // true → highlight Schedule Return in booking
}

// Website visitors see the full 4-screen flow.
// In-car guests (?guest=1) jump straight to booking — no pitch needed.
const FULL_SCREENS:  Screen[] = ['welcome', 'why', 'gallery', 'booking'];
const GUEST_SCREENS: Screen[] = ['welcome', 'booking'];

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ?  40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -40 :  40, opacity: 0 }),
};

export default function Experience({ session, isGuest = false, isReturn = false }: ExperienceProps) {
  const SCREENS = isGuest ? GUEST_SCREENS : FULL_SCREENS;

  const [screenIdx, setScreenIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase,     setPhase]     = useState<RidePhase>('active');
  const [modal,     setModal]     = useState<ModalType>(null);

  function navigate(delta: number) {
    const next = screenIdx + delta;
    if (next < 0 || next >= SCREENS.length) return;
    setDirection(delta);
    setScreenIdx(next);
  }

  function handleReset() {
    setDirection(1);
    setScreenIdx(0);
    setModal(null);
  }

  function handleModalOpen(type: ModalType) {
    setModal(type);
    if (type === 'midway')      track('midway_prompt');
    if (type === 'pre_dropoff') track('pre_dropoff_prompt');
  }

  const currentScreen = SCREENS[screenIdx];
  const customerId    = session.rideId ?? 'demo';

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-lux-black"
      style={{ borderTop: '1px solid rgba(201,168,76,0.07)' }}
    >
      {/* ── Screen container ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentScreen}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {currentScreen === 'welcome' && (
            <ScreenWelcome session={session} onNext={() => navigate(1)} />
          )}
          {currentScreen === 'why' && (
            <ScreenWhy onNext={() => navigate(1)} onPrev={() => navigate(-1)} />
          )}
          {currentScreen === 'gallery' && (
            <ScreenGallery onNext={() => navigate(1)} onPrev={() => navigate(-1)} />
          )}
          {currentScreen === 'booking' && (
            <ScreenBooking
              onPrev={() => navigate(-1)}
              customerId={customerId}
              guestName={session.name}
              occasion={session.occasion}
              destination={session.destination}
              pickup={session.vipNote}
              isGuest={isGuest}
              isReturn={isReturn}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Driver overlay (long press corner) ── */}
      <DriverOverlay
        phase={phase}
        onPhaseChange={setPhase}
        onModalOpen={handleModalOpen}
        onReset={handleReset}
      />

      {/* ── Rebook modals ── */}
      <Modal
        type={modal}
        session={session}
        onClose={() => setModal(null)}
        onBook={(route) => {
          setModal(null);
          track('rebook_clicked', { route });
          setDirection(1);
          setScreenIdx(SCREENS.indexOf('booking'));
        }}
      />
    </div>
  );
}
