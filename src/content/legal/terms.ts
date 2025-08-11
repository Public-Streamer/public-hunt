// Centralized legal content for reuse across the app
// Keep this as the single source of truth for legal agreement text and versioning

export const LEGAL_VERSION = '1.2';

export const LEGAL_NOTICE =
  "This document contains critical legal terms that LIMIT PUBLIC STREAMER'S LIABILITY and TRANSFER RISKS TO YOU. Read carefully before signing.";

export const LEGAL_TITLE = 'PUBLIC STREAMER PLATFORM USER AGREEMENT';

export const LEGAL_BODY_SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. LIABILITY WAIVER',
    body:
      'Public Streamer, LLC shall NOT be liable for any content you create, third-party claims, copyright violations, privacy violations, financial losses, or any damages arising from your use of the platform.'
  },
  {
    title: '2. INDEMNIFICATION',
    body:
      'You agree to DEFEND, INDEMNIFY, and HOLD HARMLESS Public Streamer from all claims, damages, and expenses arising from your use of the platform or content you upload.'
  },
  {
    title: '3. CONTENT RESPONSIBILITY',
    body:
      'You represent that you own all content you upload, that it complies with all laws, and you assume full responsibility for all activities under your account.'
  },
  {
    title: '4. ACCEPTABLE USE & PROHIBITED MONETIZATION CATEGORIES',
    body:
      'Monetizing content in the prohibited categories listed below is strictly forbidden and may result in account termination and payment disablement to comply with Stripe Terms. See the “Prohibited Content Monetization Categories” list that follows.'
  }
];

export const PROHIBITED_CATEGORIES: string[] = [
  'Adult Content and Services – Content that contains nudity or explicit sexual acts (including subscriber-only nude images, adult audio/video live chat) is prohibited.',
  'Intellectual Property or Proprietary Rights Infringement – This includes the monetization of content that violates copyrights, trademarks, or other proprietary rights, such as leaked music albums or stolen media.',
  'Violent Extremism and Hate Speech – Content that engages in, encourages, promotes, or celebrates unlawful violence or hate speech toward any group based on race, religion, disability, gender, sexual orientation, national origin, or any other immutable characteristic is prohibited.'
];
