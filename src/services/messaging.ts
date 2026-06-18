import { Donation } from '../types';
import { dbService } from './db';

// Environment variables configuration for Twilio
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_SENDER_NUMBER = import.meta.env.VITE_TWILIO_SENDER_NUMBER || '';

export const messagingService = {
  /**
   * Broadcasts SMS alerts to nearby volunteers when a donor posts extra food.
   * Integrates with Twilio API, falling back to simulation logs if credentials are missing.
   */
  async sendBroadcastToNearbyVolunteers(donation: Donation): Promise<void> {
    try {
      const allUsers = await dbService.getAllUsers();
      
      // Filter for volunteers in the same city or neighborhood
      const nearbyVolunteers = allUsers.filter((user) => 
        user.role === 'Volunteer' &&
        user.phone &&
        (user.city.toLowerCase() === (donation.city || '').toLowerCase() || 
         user.area.toLowerCase() === (donation.area || '').toLowerCase())
      );

      if (nearbyVolunteers.length === 0) {
        console.log(`[Messaging] No registered volunteers found matching location: ${donation.area}, ${donation.city}`);
        return;
      }

      const alertText = `FoodBridge Alert! Extra food is available in your area. "${donation.foodName}" (${donation.quantity}) was just posted by ${donation.donorName} at ${donation.pickupAddress}. Open your app to coordinate pickup!`;
      
      const hasTwilio = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SENDER_NUMBER;

      if (hasTwilio) {
        console.log(`[Messaging] Twilio configured. Sending SMS to ${nearbyVolunteers.length} volunteers.`);
        for (const volunteer of nearbyVolunteers) {
          if (volunteer.phone) {
            await this.sendTwilioSms(volunteer.phone, alertText);
          }
        }
      } else {
        // Simulation Fallback Logs if keys are absent
        console.group('%c[FoodBridge SMS Alert Simulation]', 'color: #059669; font-weight: bold; font-size: 11px;');
        console.log(`Donation Posted: "${donation.foodName}" in ${donation.area}, ${donation.city}`);
        console.log(`Alert Message: "${alertText}"`);
        console.log('Volunteers notified in simulation mode:');
        nearbyVolunteers.forEach((v) => {
          console.log(`- Alerted Volunteer: ${v.fullName} (${v.phone})`);
        });
        console.info('Tip: To send real SMS messages, configure VITE_TWILIO_ACCOUNT_SID, VITE_TWILIO_AUTH_TOKEN, and VITE_TWILIO_SENDER_NUMBER in your .env file.');
        console.groupEnd();
      }

    } catch (err) {
      console.error('[Messaging] Broadcast SMS alerts failed:', err);
    }
  },

  /**
   * Integrates with Twilio API to send SMS messages
   */
  async sendTwilioSms(to: string, body: string): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`));
    headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const params = new URLSearchParams();
    params.set('To', to);
    params.set('From', TWILIO_SENDER_NUMBER);
    params.set('Body', body);

    try {
      const response = await fetch(url, { method: 'POST', headers, body: params });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Twilio error: ${response.status} - ${text}`);
      }
      const data = await response.json();
      console.log(`[Twilio SMS] Message sent to ${to}. SID: ${data.sid}`);
    } catch (err) {
      console.error(`[Twilio SMS] Failed sending to ${to}:`, err);
    }
  }
};
