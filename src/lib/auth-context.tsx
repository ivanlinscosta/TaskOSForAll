import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './firebase-config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Mantido para compatibilidade com código antigo; o produto agora usa
// um único contexto unificado (sem dualidade work/life).
export type WorkspaceMode = 'work' | 'life';

export interface UserPreferences {
  /** Objetivos de uso da plataforma (lista unificada, sem work/life). */
  objetivos: string[];
  /** Compat com código legado. */
  workGoals?: string[];
  lifeGoals?: string[];
}

export interface SoftSkillsProfile {
  comunicacao: number;       // 1-5
  lideranca: number;         // 1-5
  colaboracao: number;       // 1-5
  resolucaoProblemas: number;// 1-5
  adaptabilidade: number;    // 1-5
  organizacao: number;       // 1-5
  estiloTrabalho?: string;
  pontosFortes?: string;
  pontosMelhorar?: string;
}

export interface FinanceProfile {
  rendaMensal: number;
  /** @deprecated — agora calculado a partir das despesas do mês na tela de finanças */
  gastoMedioMensal?: number;
  reservaEmergencia?: number;
  /** Valor total aplicado em investimentos (R$). */
  totalInvestido?: number;
  objetivosFinanceiros: string[];
  perfilInvestidor?: 'conservador' | 'moderado' | 'arrojado' | 'indefinido';
  jaInveste?: boolean;
  tiposInvestimento?: string[];
  horizonte?: 'curto' | 'medio' | 'longo';
}

export interface UserProfile {
  uid?: string;
  nome: string;
  email: string;
  telefone?: string;
  profissao?: string;
  localTrabalho?: string;
  rendaMensal?: number;
  cargo?: string;
  empresaAtual?: string;
  areaAtuacao?: string;
  atividadesProfissionais?: string;
  anosExperiencia?: string;
  objetivoCarreira?: string;
  habilidadesAtuais?: string;
  curriculoTexto?: string;
  softSkills?: SoftSkillsProfile;
  financas?: FinanceProfile;
  avatar?: string;

  // Estado do setup inicial ─────────────────────────────────────────────
  onboardingCompleted?: boolean;        // legado (ainda usado por alguns lugares)
  careerProfileCompleted?: boolean;
  softSkillsCompleted?: boolean;
  financeProfileCompleted?: boolean;
  developmentSetupCompleted?: boolean;
  initialSetupCompleted?: boolean;      // gate final
  currentSetupStep?: number;            // 1..5

  preferencias?: UserPreferences;
  ultimoWorkspace?: WorkspaceMode;
  criadoEm?: any;
  atualizadoEm?: any;
}

interface OnboardingData {
  nome: string;
  profissao: string;
  localTrabalho: string;
  rendaMensal: number;
  preferencias: UserPreferences;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar perfil do Firestore:', error);
    return null;
  }
}

async function ensureUserDocument(user: User): Promise<void> {
  try {
    const docRef = doc(db, 'usuarios', user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: user.uid,
        nome: user.displayName || '',
        email: user.email || '',
        avatar: user.photoURL || '',
        onboardingCompleted: false,
        careerProfileCompleted: false,
        softSkillsCompleted: false,
        financeProfileCompleted: false,
        developmentSetupCompleted: false,
        initialSetupCompleted: false,
        currentSetupStep: 1,
        preferencias: {
          objetivos: [],
          workGoals: [],
          lifeGoals: [],
        },
        ultimoWorkspace: 'work',
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserDocument(firebaseUser);
        const profile = await loadUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profile = await loadUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      await ensureUserDocument(userCredential.user);
      await updateDoc(doc(db, 'usuarios', userCredential.user.uid), {
        nome: displayName,
        email,
        onboardingCompleted: false,
        atualizadoEm: Timestamp.now(),
      });
      const profile = await loadUserProfile(userCredential.user.uid);
      setUserProfile(profile);
      setUser({ ...userCredential.user, displayName } as User);
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await ensureUserDocument(credential.user);
    const profile = await loadUserProfile(credential.user.uid);
    setUserProfile(profile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfileFn = async (displayName: string, photoURL?: string) => {
    if (!user) return;

    const docRef = doc(db, 'usuarios', user.uid);
    const updateData: any = {
      nome: displayName,
      atualizadoEm: Timestamp.now(),
    };
    if (photoURL !== undefined) {
      updateData.avatar = photoURL;
    }

    try {
      await updateDoc(docRef, updateData);
    } catch {
      await setDoc(docRef, {
        uid: user.uid,
        nome: displayName,
        email: user.email || '',
        avatar: photoURL || '',
        onboardingCompleted: false,
        preferencias: { workGoals: [], lifeGoals: [] },
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      });
    }

    try {
      await updateProfile(user, { displayName });
    } catch (err) {
      console.warn('Não foi possível atualizar Firebase Auth displayName:', err);
    }

    const profile = await loadUserProfile(user.uid);
    setUserProfile(profile);
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const docRef = doc(db, 'usuarios', user.uid);
    const updateData: any = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    try {
      await updateDoc(docRef, updateData);
    } catch {
      await setDoc(
        docRef,
        {
          uid: user.uid,
          email: user.email || '',
          onboardingCompleted: false,
          preferencias: { workGoals: [], lifeGoals: [] },
          ...data,
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        },
        { merge: true },
      );
    }

    const profile = await loadUserProfile(user.uid);
    setUserProfile(profile);
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) return;

    const payload = {
      nome: data.nome,
      profissao: data.profissao,
      localTrabalho: data.localTrabalho,
      rendaMensal: Number(data.rendaMensal || 0),
      preferencias: data.preferencias,
      onboardingCompleted: true,
      ultimoWorkspace: 'work' as WorkspaceMode,
      atualizadoEm: Timestamp.now(),
    };

    await updateUserProfileData(payload);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    // Gate principal: o usuário só entra no app depois que initialSetupCompleted === true.
    // Mantém compatibilidade com onboardingCompleted legado.
    needsOnboarding:
      !!user &&
      !loading &&
      !(userProfile?.initialSetupCompleted ?? userProfile?.onboardingCompleted),
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
    updateUserProfile: updateUserProfileFn,
    updateUserProfileData,
    completeOnboarding,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
