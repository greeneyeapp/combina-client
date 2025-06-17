import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Inspiration = {
  id: string;
  url: string;
  imageUrl: string | null;
  note: string;
  createdAt: string;
};

export type Collection = {
  id: string;
  name: string;
  itemIds: string[];
};

interface InspirationState {
  inspirations: Inspiration[];
  collections: Collection[];
  addInspiration: (inspiration: Inspiration) => void;
  removeInspiration: (id: string) => void;
  updateInspiration: (id: string, updated: Partial<Inspiration>) => void;
  clearAllInspirations: () => void;

  addCollection: (name: string) => void;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  toggleInCollection: (inspId: string, colId: string) => void;
}

export const useInspirationStore = create<InspirationState>()(
  persist(
    (set, get) => ({
      inspirations: [],
      collections: [{ id: 'default', name: 'default', itemIds: [] }],

      addInspiration: ins =>
        set(state => ({
          inspirations: [ins, ...state.inspirations],
        })),

      removeInspiration: id =>
        set(state => ({
          inspirations: state.inspirations.filter(i => i.id !== id),
          collections: state.collections.map(c => ({
            ...c,
            itemIds: c.itemIds.filter(iid => iid !== id),
          })),
        })),

      updateInspiration: (id, updated) =>
        set(state => ({
          inspirations: state.inspirations.map(i =>
            i.id === id ? { ...i, ...updated } : i
          ),
        })),

      clearAllInspirations: () => set({ inspirations: [] }),

      addCollection: name =>
        set(state => {
          if (
            name.trim().toLowerCase() === 'default' ||
            state.collections.some(c => c.name.toLowerCase() === name.trim().toLowerCase()) ||
            name.trim() === ''
          ) {
            return state;
          }
          return {
            collections: [
              ...state.collections,
              { id: Date.now().toString(), name: name.trim(), itemIds: [] },
            ],
          };
        }),

      renameCollection: (id, name) =>
        set(state => ({
          collections: state.collections.map(c =>
            c.id === id && c.id !== 'default' ? { ...c, name } : c
          ),
        })),

      deleteCollection: id =>
        set(state => ({
          collections:
            id === 'default'
              ? state.collections
              : state.collections.filter(c => c.id !== id),
        })),

      toggleInCollection: (inspId, colId) =>
        set(state => ({
          collections: state.collections.map(c => {
            if (c.id !== colId) return c;
            const has = c.itemIds.includes(inspId);
            return {
              ...c,
              itemIds: has
                ? c.itemIds.filter(i => i !== inspId)
                : [...c.itemIds, inspId],
            };
          }),
        })),
    }),
    {
      name: 'inspiration-storage',
      storage: createJSONStorage(() => AsyncStorage),

      // En önemli kısım: Persist edilen veride default koleksiyon yoksa EĞLE!
      merge: (persisted, current) => {
        const persistedCollections = (persisted as any)?.collections || [];
        const hasDefault = persistedCollections.some((c: any) => c.id === 'default');
        return {
          ...current,
          ...persisted,
          collections: hasDefault
            ? persistedCollections
            : [{ id: 'default', name: 'default', itemIds: [] }, ...persistedCollections],
        };
      },
    }
  )
);
