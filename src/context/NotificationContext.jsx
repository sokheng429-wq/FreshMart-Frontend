import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { activityLogAPI } from '../api/api'

const STORAGE_KEY = 'admin-notifications'
const MAX_ITEMS = 40

const TYPE_META = {
  product: { icon: '📦', color: '#22c55e', href: '/admin/products/all' },
  job: { icon: '💼', color: '#f59e0b', href: '/admin/jobs' },
  member: { icon: '👤', color: '#3b82f6', href: '/admin/members' },
  user: { icon: '🛡️', color: '#a855f7', href: '/admin/users' },
  promotion: { icon: '🏷️', color: '#ec4899', href: '/admin/promotions' },
  partner: { icon: '🤝', color: '#06b6d4', href: '/admin/partners' },
  driver: { icon: '🚚', color: '#f59e0b', href: '/admin/drivers' },
  transfer: { icon: '🔄', color: '#38bdf8', href: '/admin/products/request-transfer' },
  application: { icon: '📋', color: '#a855f7', href: '/admin/applications' },
}

const NotificationContext = createContext(null)

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(loadSaved)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_ITEMS)))
  }, [notifications])

  // Sync from backend activity logs
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    activityLogAPI
      .getRecent(30)
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          const mapped = res.data.map((l) => {
            const entityKey = (l.entityType || 'product').toLowerCase()
            const meta = TYPE_META[entityKey] || { icon: '🔔', color: '#a855f7', href: '/admin/notifications' }
            return {
              id: l.id,
              type: entityKey,
              action: (l.actionType || 'create').toLowerCase(),
              title: l.entityName || l.description || 'Activity',
              detail: l.description || `${l.username} performed ${l.actionType}`,
              href: meta.href,
              icon: l.icon || meta.icon,
              color: meta.color,
              read: false,
              createdAt: l.createdAt ? new Date(l.createdAt).getTime() : Date.now(),
            }
          })
          setNotifications(mapped)
        }
      })
      .catch(() => {})
  }, [])

  const addNotification = useCallback((payload) => {
    const meta = TYPE_META[payload.type] || TYPE_META.product
    const item = {
      id: Date.now() + Math.random(),
      type: payload.type,
      action: payload.action || 'add',
      title: payload.title,
      detail: payload.detail || '',
      href: payload.href || meta.href,
      icon: payload.icon || meta.icon,
      color: payload.color || meta.color,
      read: false,
      createdAt: Date.now(),
    }
    setNotifications((prev) => [item, ...prev].slice(0, MAX_ITEMS))

    // Persist to backend database
    try {
      const savedUser = localStorage.getItem('user')
      const parsedUser = savedUser ? JSON.parse(savedUser) : null
      activityLogAPI
        .create({
          username: parsedUser?.username || parsedUser?.fullName || 'admin',
          userRole: (parsedUser?.role || 'ADMIN').toUpperCase(),
          userFullName: parsedUser?.fullName,
          actionType: (payload.action || 'CREATE').toUpperCase(),
          entityType: (payload.type || 'PRODUCT').toUpperCase(),
          entityName: payload.title,
          description: payload.detail || payload.title,
          icon: payload.icon || meta.icon,
          status: 'SUCCESS',
        })
        .catch(() => {})
    } catch {
      // ignore
    }

    return item
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext

