'use client';

import React, { createContext, useContext, useState } from 'react';

interface HeaderSlotContextType {
  headerCenter: React.ReactNode;
  setHeaderCenter: (node: React.ReactNode) => void;
  headerRight: React.ReactNode;
  setHeaderRight: (node: React.ReactNode) => void;
}

const HeaderSlotContext = createContext<HeaderSlotContextType>({
  headerCenter: null,
  setHeaderCenter: () => {},
  headerRight: null,
  setHeaderRight: () => {},
});

export function HeaderSlotProvider({ children }: { children: React.ReactNode }) {
  const [headerCenter, setHeaderCenter] = useState<React.ReactNode>(null);
  const [headerRight, setHeaderRight] = useState<React.ReactNode>(null);

  return (
    <HeaderSlotContext.Provider
      value={{ headerCenter, setHeaderCenter, headerRight, setHeaderRight }}
    >
      {children}
    </HeaderSlotContext.Provider>
  );
}

export function useHeaderSlot() {
  return useContext(HeaderSlotContext);
}
