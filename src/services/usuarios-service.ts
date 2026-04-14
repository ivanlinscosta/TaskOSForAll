/**
 * Serviço de Usuários - Firebase Integration Completo
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase-config';

export interface Usuario {
  id?: string;
  uid?: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar?: string;
  bio?: string;
  funcao?: string;
  departamento?: string;
  contexto?: 'fiap' | 'itau';
  ativo?: boolean;
  criadoEm?: Date;
  atualizadoEm?: Date;
  ultimoAcesso?: Date;
}

const COLLECTION_NAME = 'usuarios';

/**
 * Cria um novo usuário no Firebase
 */
export async function criarUsuario(usuario: Omit<Usuario, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<string> {
  try {
    const usuarioData = {
      ...usuario,
      ativo: usuario.ativo !== false,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
      ultimoAcesso: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), usuarioData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Atualiza um usuário existente
 */
export async function atualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<void> {
  try {
    const usuarioRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...usuario };

    updateData.atualizadoEm = Timestamp.now();

    await updateDoc(usuarioRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

/**
 * Atualiza o último acesso do usuário
 */
export async function atualizarUltimoAcesso(id: string): Promise<void> {
  try {
    const usuarioRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(usuarioRef, {
      ultimoAcesso: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar último acesso:', error);
    throw error;
  }
}

/**
 * Deleta um usuário
 */
export async function deletarUsuario(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
}

/**
 * Busca um usuário por ID
 */
export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
        ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
      } as Usuario;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Busca um usuário por email
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      criadoEm: data.criadoEm?.toDate?.() || new Date(),
      atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
    } as Usuario;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw error;
  }
}

/**
 * Busca um usuário por UID (Firebase Auth)
 */
export async function buscarUsuarioPorUID(uid: string): Promise<Usuario | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('uid', '==', uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      criadoEm: data.criadoEm?.toDate?.() || new Date(),
      atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
      ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
    } as Usuario;
  } catch (error) {
    console.error('Erro ao buscar usuário por UID:', error);
    throw error;
  }
}

/**
 * Lista todos os usuários
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
        ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
      } as Usuario;
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
}

/**
 * Lista usuários por contexto
 */
export async function listarUsuariosPorContexto(contexto: 'fiap' | 'itau'): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('contexto', '==', contexto),
      orderBy('nome', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
        ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
      } as Usuario;
    });
  } catch (error) {
    console.error('Erro ao listar usuários por contexto:', error);
    throw error;
  }
}

/**
 * Lista usuários por departamento
 */
export async function listarUsuariosPorDepartamento(departamento: string): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('departamento', '==', departamento),
      orderBy('nome', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
        ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
      } as Usuario;
    });
  } catch (error) {
    console.error('Erro ao listar usuários por departamento:', error);
    throw error;
  }
}

/**
 * Lista usuários ativos
 */
export async function listarUsuariosAtivos(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ativo', '==', true),
      orderBy('nome', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        criadoEm: data.criadoEm?.toDate?.() || new Date(),
        atualizadoEm: data.atualizadoEm?.toDate?.() || new Date(),
        ultimoAcesso: data.ultimoAcesso?.toDate?.() || new Date(),
      } as Usuario;
    });
  } catch (error) {
    console.error('Erro ao listar usuários ativos:', error);
    throw error;
  }
}
