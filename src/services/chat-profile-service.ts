import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../lib/firebase-config';

function isDirectImageUrl(value: string) {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image/')
  );
}

async function resolveStorageImageUrl(rawValue: string): Promise<string> {
  if (!rawValue) return '';

  if (isDirectImageUrl(rawValue)) {
    return rawValue;
  }

  try {
    if (rawValue.startsWith('gs://')) {
      return await getDownloadURL(ref(storage, rawValue));
    }

    return await getDownloadURL(ref(storage, rawValue));
  } catch (error) {
    console.error('Erro ao resolver foto do chat:', error);
    return '';
  }
}

function getRawPhotoValue(data: any, authUser: any) {
  return (
    data?.fotoURL ||
    data?.fotoUrl ||
    data?.avatar ||
    data?.foto ||
    data?.photoURL ||
    authUser?.photoURL ||
    ''
  );
}

export async function loadUserChatPhoto(userId: string, authUser?: any) {
  try {
    const perfilRef = doc(db, 'perfis', userId);
    const perfilSnap = await getDoc(perfilRef);

    if (perfilSnap.exists()) {
      const data = perfilSnap.data();
      return await resolveStorageImageUrl(getRawPhotoValue(data, authUser));
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return await resolveStorageImageUrl(getRawPhotoValue(data, authUser));
    }

    return await resolveStorageImageUrl(getRawPhotoValue(null, authUser));
  } catch (error) {
    console.error('Erro ao carregar foto do usuário no chat:', error);
    return '';
  }
}