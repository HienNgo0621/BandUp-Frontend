import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { appDataService, type AppData } from '../services/appDataService';
import type { User } from '../types/user';
import type { QuestionBankSet } from '../types/question-bank';
import type { AppNotification } from '../types/notification';

export interface AppDataContextValue {
  data: AppData;
  users: User[];
  questionBank: AppData['questionBank'];
  notifications: AppNotification[];
  updateUser: (userId: string, update: Partial<User>) => boolean;
  replaceQuestionBank: (items: QuestionBankSet[]) => boolean;
  markNotificationRead: (notificationId: string, userId: string) => boolean;
  markAllNotificationsRead: (userId: string, role: import('../types/common').AppRole) => boolean;
  refresh: () => void;
}
export const AppDataContext = createContext<AppDataContextValue | null>(null);
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => appDataService.load());
  const refresh = useCallback(() => setData(appDataService.load()), []);
  const updateUser = useCallback((userId: string, update: Partial<User>) => {
    const next = appDataService.update((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, ...update, id: user.id } : user) }));
    if (!next) return false;
    setData(next);
    return true;
  }, []);
  const replaceQuestionBank = useCallback((items: QuestionBankSet[]) => {
    const next = appDataService.update((current) => ({ ...current, questionBank: items }));
    if (!next) return false;
    setData(next);
    return true;
  }, []);
  const markNotificationRead = useCallback((notificationId: string, userId: string) => {
    const next = appDataService.update((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === notificationId && !notification.readBy.includes(userId) ? { ...notification, readBy: [...notification.readBy, userId] } : notification) }));
    if (!next) return false;
    setData(next);
    return true;
  }, []);
  const markAllNotificationsRead = useCallback((userId: string, role: import('../types/common').AppRole) => {
    const next = appDataService.update((current) => ({ ...current, notifications: current.notifications.map((notification) => (notification.recipientId === userId || notification.recipientId === `all:${role}`) && !notification.readBy.includes(userId) ? { ...notification, readBy: [...notification.readBy, userId] } : notification) }));
    if (!next) return false;
    setData(next);
    return true;
  }, []);
  const value = useMemo(() => ({ data, users: data.users, questionBank: data.questionBank, notifications: data.notifications, updateUser, replaceQuestionBank, markNotificationRead, markAllNotificationsRead, refresh }), [data, updateUser, replaceQuestionBank, markNotificationRead, markAllNotificationsRead, refresh]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
