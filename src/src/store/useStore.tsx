/**
 * useStore.tsx — Global Application State
 *
 * Implements a Redux-style store using React Context + useReducer.
 * Wraps the app in StoreProvider; consume state with the useStore() hook.
 *
 * State:
 *  user / isAuthenticated  — current logged-in user
 *  projects                — list of active projects (loaded on dashboard mount)
 *  currentProject          — project currently open on ProjectPage
 *  tasks                   — tasks for currentProject
 *  members                 — members for currentProject
 *  isLoading               — global loading flag
 *
 * Session persistence: on module load, reads token + user from localStorage
 * so the user stays logged in across page refreshes.
 *
 * Actions: SET_USER, SET_PROJECTS, ADD_PROJECT, SET_CURRENT_PROJECT,
 *          ADD_TASK, UPDATE_TASK, DELETE_TASK, ADD_MEMBER, SET_LOADING
 */
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Project, Task, ProjectMember } from '../types';
import { api, tokenStore } from '../services/api';

interface State {
  user: User | null;
  isAuthenticated: boolean;
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  members: ProjectMember[];
  isLoading: boolean;
}

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'SET_CURRENT_PROJECT'; payload: { project: Project; tasks: Task[]; members: ProjectMember[] } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_MEMBER'; payload: ProjectMember }
  | { type: 'SET_LOADING'; payload: boolean };

const storedUser = tokenStore.loadUser();
const isAuthed   = api.auth.isAuthenticated();

const initialState: State = {
  user: isAuthed ? storedUser : null,
  isAuthenticated: isAuthed && !!storedUser,
  projects: [],
  currentProject: null,
  tasks: [],
  members: [],
  isLoading: false,
};

function reducer(state: State, action: Action): State {
  try {
    switch (action.type) {
      case 'SET_USER':
        return { ...state, user: action.payload, isAuthenticated: !!action.payload };
      case 'SET_PROJECTS':
        return { ...state, projects: action.payload };
      case 'ADD_PROJECT':
        console.log('[REDUCER] ADD_PROJECT with payload:', action.payload);
        const newProjects = [...state.projects, action.payload];
        console.log('[REDUCER] New projects count:', newProjects.length);
        return { ...state, projects: newProjects };
      case 'SET_CURRENT_PROJECT':
        return { ...state, currentProject: action.payload.project, tasks: action.payload.tasks, members: action.payload.members };
      case 'ADD_TASK':
        return { ...state, tasks: [...state.tasks, action.payload] };
      case 'UPDATE_TASK':
        return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
      case 'DELETE_TASK':
        return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
      case 'ADD_MEMBER':
        return { ...state, members: [...state.members, action.payload] };
      case 'SET_LOADING':
        return { ...state, isLoading: action.payload };
      default:
        return state;
    }
  } catch (e) {
    console.error('[REDUCER] Error in action:', action.type, e);
    throw e;
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
