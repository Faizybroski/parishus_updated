import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = Notification.permission;
      setHasPermission(permission === 'granted');
      
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking push subscription:', error);
        }
      }
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  const subscribeToPush = async () => {
    if (!hasPermission || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // You would need to add your VAPID public key here
            'BMxYXXpQ9YVVNyCXCzN1rR3gO8XcJJCz_8l9wRfQwNx6vZt1Eu9QP9Z7KAr0XtTf5vRGFZjN3-4l9QN3XtYgHQ'
          )
        });
      }

      // Save subscription to your backend
      if (user && subscription) {
        await saveSubscriptionToBackend(subscription);
        setIsSubscribed(true);
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from backend
        if (user) {
          await removeSubscriptionFromBackend();
        }
        
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  const saveSubscriptionToBackend = async (subscription: PushSubscription) => {
    // This would typically save to your database
    // For now, we'll just log it
    console.log('Saving subscription:', subscription);
  };

  const removeSubscriptionFromBackend = async () => {
    // This would typically remove from your database
    console.log('Removing subscription');
  };

  const sendNotification = async (
    title: string, 
    message: string, 
    type: 'rsvp_confirmation' | 'event_reminder' | 'crossed_paths_match' | 'feedback_request' | 'general', 
    targetUserId: string, 
    data?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type,
          data
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return {
    hasPermission,
    isSubscribed,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}