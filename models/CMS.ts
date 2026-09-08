import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CMSFeature {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  badge?: string;
}

export interface CMSFaq {
  id: string;
  question: string;
  answer: string;
}

export interface CMSTestimonial {
  id: string;
  name: string;
  role: string;
  comment: string;
  avatarUrl?: string;
  rating: number;
}

export interface CMSHowItWorksStep {
  step: number;
  title: string;
  description: string;
  badge: string;
}

export interface CMSSectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
}

export interface ICMSConfig extends Document {
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: Date;

  // 1. Landing Page Hero
  hero: {
    badge: string;
    headlinePart1: string;
    headlinePart2: string;
    subheading: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    stat1Number: string;
    stat1Label: string;
    stat2Number: string;
    stat2Label: string;
    stat3Number: string;
    stat3Label: string;
  };

  // 2. Perspectives / Role Selection Cards
  roles: {
    userCard: {
      tag: string;
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
    printerCard: {
      tag: string;
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
  };

  // 3. Modular Section Visibility & Ordering
  sections: CMSSectionConfig[];

  // 4. Features & Benefits
  features: CMSFeature[];

  // 5. How It Works
  howItWorksCustomer: CMSHowItWorksStep[];
  howItWorksHub: CMSHowItWorksStep[];

  // 6. FAQs
  faqs: CMSFaq[];

  // 7. Testimonials
  testimonials: CMSTestimonial[];

  // 8. Footer Content
  footer: {
    logoText: string;
    tagline: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    socialTwitter?: string;
    socialInstagram?: string;
    socialLinkedin?: string;
    quickLinks: { label: string; url: string }[];
  };

  // 9. Legal Policies (Rich text / Markdown)
  legal: {
    termsAndConditions: string;
    privacyPolicy: string;
    refundPolicy: string;
    cancellationPolicy: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const CMSSchema = new Schema<ICMSConfig>(
  {
    version: { type: String, default: '1.0.0' },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'PUBLISHED',
    },
    publishedAt: { type: Date, default: Date.now },

    hero: {
      badge: { type: String, default: 'Smart Cyber Cafe Print Network • Zero Waiting Time' },
      headlinePart1: { type: String, default: 'Your Documents.' },
      headlinePart2: { type: String, default: 'Printed Nearby.' },
      subheading: {
        type: String,
        default:
          'Upload online, choose a nearby Prinly Hub, pay digitally and collect your prints without waiting in line.',
      },
      primaryCtaText: { type: String, default: 'Find a Printing Hub' },
      primaryCtaLink: { type: String, default: '#nearby-shops' },
      secondaryCtaText: { type: String, default: 'Become a Prinly Hub' },
      secondaryCtaLink: { type: String, default: '/printer/register' },
      stat1Number: { type: String, default: '~2 Mins' },
      stat1Label: { type: String, default: 'Avg. Collection Time' },
      stat2Number: { type: String, default: '₹0 Fee' },
      stat2Label: { type: String, default: 'Direct Shop UPI' },
      stat3Number: { type: String, default: '100% Private' },
      stat3Label: { type: String, default: 'Auto-deleted Files' },
    },

    roles: {
      userCard: {
        tag: { type: String, default: 'FOR CUSTOMERS' },
        title: { type: String, default: 'Print documents from anywhere' },
        description: {
          type: String,
          default:
            'Upload your documents, find a nearby Prinly printing hub, customize your print settings, pay digitally, and collect your prints.',
        },
        primaryCta: { type: String, default: 'Continue as User' },
        secondaryCta: { type: String, default: 'Login / Register' },
      },
      printerCard: {
        tag: { type: String, default: 'FOR PRINTER & CYBER CAFE OWNERS' },
        title: { type: String, default: 'Turn your printer into a Prinly Hub' },
        description: {
          type: String,
          default:
            'Register your cyber cafe or printing shop, receive online print orders, manage your printer queue, and grow your local printing business.',
        },
        primaryCta: { type: String, default: 'Register Your Printer' },
        secondaryCta: { type: String, default: 'Printer Owner Login' },
      },
    },

    sections: {
      type: [
        {
          id: String,
          title: String,
          subtitle: String,
          visible: { type: Boolean, default: true },
          order: Number,
        },
      ],
      default: [
        { id: 'perspectives', title: 'Role Perspectives', visible: true, order: 1 },
        { id: 'hero', title: 'Hero Banner', visible: true, order: 2 },
        { id: 'network', title: 'Interactive 3D Network', visible: true, order: 3 },
        { id: 'howItWorks', title: 'How Prinly Works', visible: true, order: 4 },
        { id: 'nearbyHubs', title: 'Nearby Printing Hubs', visible: true, order: 5 },
        { id: 'features', title: 'Platform Benefits', visible: true, order: 6 },
        { id: 'printerCta', title: 'Printer Hub Partner CTA', visible: true, order: 7 },
        { id: 'faq', title: 'Frequently Asked Questions', visible: true, order: 8 },
        { id: 'footer', title: 'Footer Section', visible: true, order: 9 },
      ],
    },

    features: {
      type: [
        {
          id: String,
          title: String,
          description: String,
          iconName: String,
          badge: String,
        },
      ],
      default: [
        {
          id: 'feat_1',
          title: 'Zero Queue Cloud Spooling',
          description:
            'Files are pre-processed and sent directly to the shop’s active printer tray. No standing in counter lines.',
          badge: 'High Speed',
        },
        {
          id: 'feat_2',
          title: 'Direct Shopkeeper UPI / Cash',
          description:
            'Pay directly to the local shopkeeper using GPay, PhonePe, Paytm, or choose cash on collection.',
          badge: 'Transparent',
        },
        {
          id: 'feat_3',
          title: 'Total Document Privacy',
          description:
            '256-bit SSL encrypted transit. Uploaded files are automatically erased right after printing.',
          badge: 'Confidential',
        },
        {
          id: 'feat_4',
          title: 'Full Format & Duplex Freedom',
          description:
            'Support for PDF, Word docs, images, colored brochures, spiral binding, and staple options.',
          badge: 'Flexible',
        },
      ],
    },

    howItWorksCustomer: {
      type: [
        {
          step: Number,
          title: String,
          description: String,
          badge: String,
        },
      ],
      default: [
        {
          step: 1,
          title: 'Select a Nearby Hub',
          description: 'Pick any local cyber cafe on the GPS radar or scan their counter QR standee.',
          badge: 'Step 1',
        },
        {
          step: 2,
          title: 'Upload & Configure',
          description: 'Upload your document and choose B&W/Color, Duplex, Copies, and paper size.',
          badge: 'Step 2',
        },
        {
          step: 3,
          title: 'Pay & Collect Instantly',
          description: 'Pay via Shop UPI or counter cash and grab your warm prints hot off the tray.',
          badge: 'Step 3',
        },
      ],
    },

    howItWorksHub: {
      type: [
        {
          step: Number,
          title: String,
          description: String,
          badge: String,
        },
      ],
      default: [
        {
          step: 1,
          title: 'Register Your Shop',
          description: 'Set up your hub profile, printer models, paper types, and custom per-page pricing.',
          badge: 'Step 1',
        },
        {
          step: 2,
          title: 'Receive Real-time Orders',
          description: 'Incoming customer orders arrive with audible sound alerts and live spool notifications.',
          badge: 'Step 2',
        },
        {
          step: 3,
          title: 'Confirm Payment & Grow',
          description: 'Confirm counter cash or UPI settlements, hand over prints, and build customer loyalty.',
          badge: 'Step 3',
        },
      ],
    },

    faqs: {
      type: [
        {
          id: String,
          question: String,
          answer: String,
        },
      ],
      default: [
        {
          id: 'faq_1',
          question: 'How do I print a document using Prinly?',
          answer:
            'Simply select a nearby Prinly hub or scan their counter QR code, upload your file (PDF, DOCX, or Image), customize your print settings (Color/B&W, Duplex), and pay digitally or in cash upon arrival.',
        },
        {
          id: 'faq_2',
          question: 'Are my uploaded documents secure and private?',
          answer:
            'Yes. Prinly uses 256-bit TLS encryption in transit. Files are only accessible to the designated printer for output and are automatically purged from the spooler after printing.',
        },
        {
          id: 'faq_3',
          question: 'How can cyber cafe or printer owners join Prinly?',
          answer:
            'Click on "Join as a Printing Hub" or "Register Your Printer". Complete our 5-minute onboarding with your shop details, printer fleet, and pricing. You will immediately start receiving online print orders from nearby students and professionals.',
        },
        {
          id: 'faq_4',
          question: 'What payment methods are supported?',
          answer:
            'Prinly supports direct UPI payments (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, and cash at counter upon pickup.',
        },
        {
          id: 'faq_5',
          question: 'What is the Counter QR Standee?',
          answer:
            'Every Prinly partner shop receives a unique QR standee. Customers can simply walk in, scan the QR with any camera, upload their documents on the spot, and have them print out automatically without using WhatsApp or USB drives.',
        },
      ],
    },

    testimonials: {
      type: [
        {
          id: String,
          name: String,
          role: String,
          comment: String,
          avatarUrl: String,
          rating: Number,
        },
      ],
      default: [
        {
          id: 't_1',
          name: 'Aman Sharma',
          role: 'Engineering Student, Delhi University',
          comment:
            'I used to waste 25 minutes waiting in queue outside the college cyber cafe before exams. With Prinly, I upload my assignment from hostel, walk in, and collect it instantly!',
          rating: 5,
        },
        {
          id: 't_2',
          name: 'Rajesh Gupta',
          role: 'Owner, Apex Digital Print & Cyber Cafe',
          comment:
            'Prinly increased my daily print volume by 40%. Students order online before reaching the shop, my printer keeps working smoothly without crowd bottlenecks, and payments come directly to my UPI.',
          rating: 5,
        },
        {
          id: 't_3',
          name: 'Pooja Verma',
          role: 'Chartered Accountant',
          comment:
            'Confidential tax audits require high privacy. Sending files on WhatsApp to strangers was always risky. Prinly gives clean, private printing without sharing my phone number.',
          rating: 5,
        },
      ],
    },

    footer: {
      logoText: { type: String, default: 'Prinly.in' },
      tagline: { type: String, default: 'Smart Cyber Cafe Print Network' },
      description: {
        type: String,
        default:
          'Prinly bridges remote digital documents with local cyber cafes and smart printers. Upload anywhere, print nearby, and collect instantly.',
      },
      contactEmail: { type: String, default: 'support@prinly.in' },
      contactPhone: { type: String, default: '+91 98111 22334' },
      contactAddress: {
        type: String,
        default: 'Prinly Technologies Inc., Sector 18, Commercial Hub, NCR, India',
      },
      socialTwitter: { type: String, default: 'https://twitter.com/prinly_in' },
      socialInstagram: { type: String, default: 'https://instagram.com/prinly.in' },
      socialLinkedin: { type: String, default: 'https://linkedin.com/company/prinly' },
      quickLinks: {
        type: [
          {
            label: String,
            url: String,
          },
        ],
        default: [
          { label: 'Home', url: '/' },
          { label: 'Find Printing Hub', url: '#nearby-shops' },
          { label: 'Become a Hub', url: '/printer/register' },
          { label: 'How It Works', url: '#how-it-works' },
          { label: 'User Dashboard', url: '/user/dashboard' },
          { label: 'Printer Dashboard', url: '/printer/dashboard' },
        ],
      },
    },

    legal: {
      termsAndConditions: {
        type: String,
        default: `# Terms and Conditions of Prinly.in
*Last Updated: 2026-01-01*

Welcome to **Prinly.in** ("Prinly", "we", "us", or "our"), operated by Prinly Technologies. By accessing or using our website, services, and online printing network, you agree to be bound by these Terms and Conditions.

## 1. Acceptance of Terms
By creating an account, uploading documents, or registering as a Printing Hub, you confirm that you have read, understood, and agreed to these terms.

## 2. Printing Services
- Prinly connects users with independent cyber cafes and printing hubs.
- Users are responsible for the legality and copyright ownership of documents uploaded.
- Printing specifications (color, duplex, binding) selected during order submission govern the final output.

## 3. Printing Hub Partner Responsibilities
- Printing Hubs agree to maintain active paper stock and operational printers.
- Hubs must inspect and fulfill orders in a timely manner according to stated queue estimates.
- Counter cash payments must be acknowledged through the Prinly dashboard.

## 4. Privacy & Document Retention
- All uploaded files are stored temporarily on secured servers solely for output spooling.
- Files are purged automatically after successful completion of the print job.

## 5. Limitation of Liability
Prinly is not liable for typographical errors in user-provided files or delays caused by local shop power outages or hardware faults.`,
      },
      privacyPolicy: {
        type: String,
        default: `# Privacy Policy of Prinly.in
*Last Updated: 2026-01-01*

At **Prinly.in**, we prioritize the security and confidentiality of your personal information and documents.

## 1. Information We Collect
- **Account Details:** Name, email address, phone number, and password hash.
- **Order Details:** Print specifications, file metadata (name, page count, file size), and payment preferences.
- **Location Data:** Approximate GPS location or chosen locality to match you with nearby printing hubs.

## 2. File Confidentiality
- Your uploaded documents are encrypted during transit using SSL/TLS protocols.
- Hub owners only access document data for physical printing.
- Documents are never indexed, analyzed, or shared with third parties.

## 3. Contact Information
For privacy inquiries, reach us at **support@prinly.in**.`,
      },
      refundPolicy: {
        type: String,
        default: `# Refund and Cancellation Policy
*Last Updated: 2026-01-01*

At **Prinly.in**, customer satisfaction is our highest priority.

## 1. Cancellations
- Orders can be cancelled free of charge if the status is **WAITING** or **PENDING** before the shopkeeper starts printing.
- Once an order transitions to **PRINTING** or **READY**, cancellations cannot be processed because paper and toner have already been expended.

## 2. Defective Output & Misprints
- If a shop delivers unreadable prints, paper jams, or incorrect color format contrary to your order specs, you are eligible for an immediate reprint or full refund.
- Report issues directly to the hub owner at the counter or contact Prinly support within 24 hours.

## 3. Refund Timelines
- Online refunds are processed to your original payment method within 2-4 business days.`,
      },
      cancellationPolicy: {
        type: String,
        default: `# Cancellation Policy
Orders can be cancelled anytime prior to physical spooling. Once printing starts, orders are locked.`,
      },
    },
  },
  { timestamps: true }
);

export const CMS: Model<ICMSConfig> =
  mongoose.models.CMS || mongoose.model<ICMSConfig>('CMS', CMSSchema);

export default CMS;
