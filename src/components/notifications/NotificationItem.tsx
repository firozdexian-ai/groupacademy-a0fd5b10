import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getNotificationIcon,
  getNotificationColor,
  formatRelativeTime,
  type Notification,
} from '@/lib/notificationHelpers';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.icon, notification.type);
  const iconColor = getNotificationColor(notification.type);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose?.();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 rounded-lg',
        !notification.isRead && 'bg-primary/5'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}

      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium line-clamp-1',
            notification.isRead ? 'text-foreground' : 'text-foreground'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={handleDelete}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
