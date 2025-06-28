interface Notification {
  id: number;
  message: string;
}

interface NotificationsProps {
  notifications: Notification[];
}

export default function Notifications({ notifications }: NotificationsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex flex-col items-center space-y-2" style={{ transform: 'translateX(-50%)' }}>
      {notifications.filter(n => n.message && n.message.trim()).map((notif) => (
        <div
          key={notif.id}
          className="bg-blue-100 border border-blue-400 text-blue-900 px-6 py-3 rounded-xl shadow-lg font-semibold text-base animate-fade-in-up transition-all"
          style={{ minWidth: 220, maxWidth: 320 }}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}
