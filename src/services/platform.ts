import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export const platformService = {
  /**
   * Check if running on a native platform (Android/iOS)
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Captures or chooses a photo.
   * On mobile: triggers native camera/gallery.
   * On web: triggers file select dialog.
   */
  async takePhoto(): Promise<File | null> {
    if (this.isNative()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          promptLabelHeader: 'Illustrative Food Photo',
          promptLabelPhoto: 'Choose from Photo Library',
          promptLabelPicture: 'Take a Photo with Camera'
        });

        if (!photo.webPath) return null;
        
        // Fetch web path and convert to Blob -> File
        const res = await fetch(photo.webPath);
        const blob = await res.blob();
        const filename = `food_${Date.now()}.${photo.format}`;
        return new File([blob], filename, { type: `image/${photo.format}` });
      } catch (err) {
        // User cancelled or camera permissions denied
        console.warn('Native camera capture cancelled/failed:', err);
        return null;
      }
    } else {
      // Standard browser file input fallback
      return new Promise<File | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0] || null;
          resolve(file);
        };
        input.click();
      });
    }
  },

  /**
   * Shares a text/link to other apps.
   * On mobile: triggers native share sheet.
   * On web: triggers navigator.share, falling back to clipboard.
   */
  async shareDonation(title: string, text: string, url: string): Promise<boolean> {
    const shareDetails = { title, text, url };

    if (this.isNative()) {
      try {
        await Share.share(shareDetails);
        return true;
      } catch (err) {
        console.warn('Native sharing failed:', err);
        return false;
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share(shareDetails);
          return true;
        } catch (err) {
          console.warn('Web sharing failed:', err);
          return false;
        }
      } else {
        // Fallback: Copy to clipboard
        try {
          const fullText = `${title}\n${text}\nLink: ${url}`;
          await navigator.clipboard.writeText(fullText);
          return true;
        } catch (err) {
          console.error('Clipboard copy failed:', err);
          return false;
        }
      }
    }
  },

  /**
   * Triggers a subtle tactile haptic feedback response (success impact)
   */
  async triggerSuccessHaptic(): Promise<void> {
    if (this.isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (err) {
        console.warn('Haptic feedback error:', err);
      }
    }
  },

  /**
   * Configures the native mobile status bar style
   */
  async setupStatusBar(): Promise<void> {
    if (this.isNative()) {
      try {
        // Emerald 600 color theme
        await StatusBar.setBackgroundColor({ color: '#059669' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.warn('Status bar styling failed:', err);
      }
    }
  },

  /**
   * Registers a callback listener for the Android hardware back button
   */
  registerBackButton(callback: (canGoBack: boolean) => void): void {
    if (this.isNative()) {
      App.addListener('backButton', (event) => {
        callback(event.canGoBack);
      });
    }
  }
};
