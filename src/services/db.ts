import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
} from 'firebase/firestore/lite';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { dbInstance, storageInstance, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, Donation, RequestRecord, DonationStatus, NotificationItem } from '../types';
import { messagingService } from './messaging';

// Detect if we should use local storage fallback (either because Firebase config is missing or fails)
const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocalData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const upsertLocalItem = <T>(key: string, item: T, idField: keyof T, prepend = false): void => {
  const items = getLocalData<T>(key);
  const existingIndex = items.findIndex(existing => existing[idField] === item[idField]);

  if (existingIndex > -1) {
    items[existingIndex] = item;
  } else if (prepend) {
    items.unshift(item);
  } else {
    items.push(item);
  }

  saveLocalData(key, items);
};

const syncCollectionToLocal = async <T>(key: string, collectionName: string): Promise<T[]> => {
  if (!dbInstance) return getLocalData<T>(key);

  const snapshot = await withTimeout(
    getDocs(query(collection(dbInstance, collectionName))),
    45000,
    `Firestore list ${collectionName} timed out.`
  );
  const list: T[] = [];
  snapshot.forEach(document => {
    list.push(document.data() as T);
  });
  saveLocalData(key, list);
  return list;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    promise.then((value) => {
      window.clearTimeout(timer);
      resolve(value);
    }).catch((error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
};

// Start both offline and online modes empty (no default mock/sample data!)
const USER_KEY = 'foodbridge_users';
const DONATION_KEY = 'foodbridge_donations';
const REQUEST_KEY = 'foodbridge_requests';
const NOTIFICATION_KEY = 'foodbridge_notifications';

export const dbService = {
  // --- USERS SECTION ---
  async createUserProfile(profile: UserProfile): Promise<void> {
    // 1. Persist locally immediately to keep the registration path responsive.
    upsertLocalItem(USER_KEY, profile, 'uid');

    // 2. Try Firebase Firestore in the background for resilience.
    if (dbInstance) {
      const path = `users/${profile.uid}`;
      void (async () => {
        try {
          const docRef = doc(dbInstance, 'users', profile.uid);
          await setDoc(docRef, { ...profile });
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.WRITE, path);
          } catch (_) {}
        }
      })();
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const users = getLocalData<UserProfile>(USER_KEY);
    const localProfile = users.find(u => u.uid === uid) || null;

    if (localProfile) {
      if (dbInstance) {
        void (async () => {
          const path = `users/${uid}`;
          try {
            const docRef = doc(dbInstance, 'users', uid);
            const snapshot = await withTimeout(getDoc(docRef), 45000, 'Firestore get user profile timed out.');
            if (snapshot.exists()) {
              upsertLocalItem(USER_KEY, snapshot.data() as UserProfile, 'uid');
            }
          } catch (error) {
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (_) {}
          }
        })();
      }
      return localProfile;
    }

    if (dbInstance) {
      const path = `users/${uid}`;
      try {
        const docRef = doc(dbInstance, 'users', uid);
        const snapshot = await withTimeout(
          getDoc(docRef),
          45000,
          'Firestore get user profile timed out.'
        );
        if (snapshot.exists()) {
          const profile = snapshot.data() as UserProfile;
          upsertLocalItem(USER_KEY, profile, 'uid');
          return profile;
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (_) {}
      }
    }

    return null;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (dbInstance) {
      try {
        return await syncCollectionToLocal<UserProfile>(USER_KEY, 'users');
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'users');
        } catch (_) {}
      }
    }
    return getLocalData<UserProfile>(USER_KEY);
  },

  // --- DONATIONS SECTION ---
  async createDonation(donation: Omit<Donation, 'donationId' | 'status' | 'createdAt'>, file?: File): Promise<Donation> {
    const donationId = 'don_' + Math.random().toString(36).substr(2, 9);
    let imageUrl = '';

    const newDonation: Donation = {
      ...donation,
      donationId,
      imageUrl,
      status: 'Available',
      createdAt: new Date().toISOString()
    };

    // Save locally immediately to make the publish action feel fast.
    upsertLocalItem(DONATION_KEY, newDonation, 'donationId', true);

    // Trigger local push notification logic right away.
    this.sendLocalNotificationForArea(newDonation);

    // Broadcast SMS alerts to nearby volunteers in the background
    void messagingService.sendBroadcastToNearbyVolunteers(newDonation);

    // Persist to Firebase in the background to avoid blocking the user.
    if (dbInstance) {
      void (async () => {
        try {
          if (file) {
            try {
              const storageRef = ref(storageInstance, `donations/${donationId}/${file.name}`);
              const uploadResult = await withTimeout(uploadBytes(storageRef, file), 45000, 'Firebase Storage upload timed out.');
              imageUrl = await getDownloadURL(uploadResult.ref);
            } catch (uploadError) {
              console.warn('Firebase Storage upload failed, using offline object URL.', uploadError);
              imageUrl = URL.createObjectURL(file);
            }
          }

          const donationWithImage: Donation = { ...newDonation, imageUrl };
          const path = `donations/${donationId}`;
          const docRef = doc(dbInstance, 'donations', donationId);
          await withTimeout(setDoc(docRef, donationWithImage), 45000, 'Firestore write timed out.');
          upsertLocalItem(DONATION_KEY, donationWithImage, 'donationId');
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.WRITE, `donations/${donationId}`);
          } catch (_) {}
        }
      })();
    }

    return newDonation;
  },

  async getDonation(donationId: string): Promise<Donation | null> {
    const donations = getLocalData<Donation>(DONATION_KEY);
    const localDonation = donations.find(d => d.donationId === donationId) || null;

    if (localDonation) {
      if (dbInstance) {
        void (async () => {
          const path = `donations/${donationId}`;
          try {
            const docRef = doc(dbInstance, 'donations', donationId);
            const snapshot = await withTimeout(getDoc(docRef), 45000, 'Firestore get donation timed out.');
            if (snapshot.exists()) {
              upsertLocalItem(DONATION_KEY, snapshot.data() as Donation, 'donationId');
            }
          } catch (error) {
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (_) {}
          }
        })();
      }
      return localDonation;
    }

    if (dbInstance) {
      const path = `donations/${donationId}`;
      try {
        const docRef = doc(dbInstance, 'donations', donationId);
        const snapshot = await withTimeout(getDoc(docRef), 45000, 'Firestore get donation timed out.');
        if (snapshot.exists()) {
          const donation = snapshot.data() as Donation;
          upsertLocalItem(DONATION_KEY, donation, 'donationId');
          return donation;
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (_) {}
      }
    }

    return null;
  },

  async getAllDonations(): Promise<Donation[]> {
    if (dbInstance) {
      try {
        return await syncCollectionToLocal<Donation>(DONATION_KEY, 'donations');
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'donations');
        } catch (_) {}
      }
    }
    return getLocalData<Donation>(DONATION_KEY);
  },

  async updateDonationStatus(donationId: string, status: DonationStatus): Promise<void> {
    const donations = getLocalData<Donation>(DONATION_KEY);
    const idx = donations.findIndex(d => d.donationId === donationId);
    if (idx > -1) {
      donations[idx].status = status;
      saveLocalData(DONATION_KEY, donations);
    }

    if (dbInstance) {
      const path = `donations/${donationId}`;
      void (async () => {
        try {
          const docRef = doc(dbInstance, 'donations', donationId);
          await withTimeout(updateDoc(docRef, { status }), 45000, 'Firestore donation status update timed out.');
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.UPDATE, path);
          } catch (_) {}
        }
      })();
    }
  },

  // --- REQUESTS SECTION ---
  async createRequest(donationId: string, ngoId: string | null, volunteerId: string | null, status: DonationStatus): Promise<RequestRecord> {
    const requestId = 'req_' + Math.random().toString(36).substr(2, 9);
    const newRequest: RequestRecord = {
      requestId,
      donationId,
      ngoId,
      volunteerId,
      status,
      createdAt: new Date().toISOString()
    };

    upsertLocalItem(REQUEST_KEY, newRequest, 'requestId');
    await this.updateDonationStatus(donationId, status);

    if (dbInstance) {
      const path = `requests/${requestId}`;
      void (async () => {
        try {
          const docRef = doc(dbInstance, 'requests', requestId);
          await withTimeout(setDoc(docRef, newRequest), 45000, 'Firestore request write timed out.');
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.WRITE, path);
          } catch (_) {}
        }
      })();
    }

    return newRequest;
  },

  async getAllRequests(): Promise<RequestRecord[]> {
    if (dbInstance) {
      try {
        return await syncCollectionToLocal<RequestRecord>(REQUEST_KEY, 'requests');
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'requests');
        } catch (_) {}
      }
    }
    return getLocalData<RequestRecord>(REQUEST_KEY);
  },

  // --- NOTIFICATION SYSTEM (Firebase Cloud Messaging + Browser Fallback) ---
  // When a donation is created, check users in the same area.
  sendLocalNotificationForArea(donation: Donation) {
    const users = getLocalData<UserProfile>(USER_KEY);
    // Find NGOs and Volunteers in same city or area
    const matchedUsers = users.filter(u => 
      (u.role === 'NGO' || u.role === 'Volunteer') && 
      (u.city.toLowerCase() === (donation.city || '').toLowerCase() || 
       u.area.toLowerCase() === (donation.area || '').toLowerCase())
    );

    const title = "New Food Donation Available";
    const body = `A new food donation has been posted in your area (${donation.area || donation.pickupAddress}).`;

    // 1. Trigger Native HTML5 notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/assets/favicon.ico' });
      } catch (_) {}
    }

    // 2. Save in app persistent alerts list for matching roles
    const notifications = getLocalData<NotificationItem>(NOTIFICATION_KEY);
    matchedUsers.forEach(user => {
      notifications.unshift({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false
      });
    });
    saveLocalData(NOTIFICATION_KEY, notifications);
  },

  getNotifications(): NotificationItem[] {
    return getLocalData<NotificationItem>(NOTIFICATION_KEY);
  },

  markNotificationsAsRead(): void {
    const notifications = getLocalData<NotificationItem>(NOTIFICATION_KEY);
    notifications.forEach(n => n.read = true);
    saveLocalData(NOTIFICATION_KEY, notifications);
  },

  // --- CHAT MESSAGES SECTION ---
  async sendChatMessage(donationId: string, senderId: string, senderName: string, text: string): Promise<void> {
    const messageId = 'msg_' + Math.random().toString(36).substr(2, 9);
    const newMessage = {
      messageId,
      donationId,
      senderId,
      senderName,
      text,
      createdAt: new Date().toISOString()
    };

    const chatKey = `chat_${donationId}`;
    const localMsgs = getLocalData<any>(chatKey);
    localMsgs.push(newMessage);
    saveLocalData(chatKey, localMsgs);

    if (dbInstance) {
      const path = `donations/${donationId}/chats/${messageId}`;
      void (async () => {
        try {
          const docRef = doc(dbInstance, 'donations', donationId, 'chats', messageId);
          await setDoc(docRef, newMessage);
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.WRITE, path);
          } catch (_) {}
        }
      })();
    }
  },

  async getChatMessages(donationId: string): Promise<any[]> {
    const chatKey = `chat_${donationId}`;
    
    if (dbInstance) {
      try {
        const snapshot = await getDocs(query(collection(dbInstance, 'donations', donationId, 'chats')));
        const list: any[] = [];
        snapshot.forEach(document => {
          list.push(document.data());
        });
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        saveLocalData(chatKey, list);
        return list;
      } catch (error) {
        console.warn("Could not sync chats from Firestore, using offline cache", error);
      }
    }
    
    return getLocalData<any>(chatKey);
  }
};
