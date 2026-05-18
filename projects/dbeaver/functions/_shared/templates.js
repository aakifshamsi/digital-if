// Template registry — single source of truth for which templates exist and
// what defaults each one ships with. Both Functions (seeding) and the admin
// UI (picker) consume this. Adding a new template = adding an entry here
// plus dropping its directory under projects/dbeaver/templates/<id>/.

// ─── CV / PORTFOLIO — primary template, every-professional appeal ────────────
// Single-page personal website: hero with photo, about, skills, projects,
// contact. Default template for new clients — most people signing up want
// a personal site before they want a business site.
export const CV_THEME = {
  colors: {
    'black':      '#0c0c0e',
    'black-soft': '#151518',
    'black-card': '#1f1f24',
    'gold':       '#e6c068',   // warm accent
    'white':      '#fafafa',
    'gray':       '#9ea0a7',
    'gray-soft':  'rgba(255,255,255,0.08)',
    'gold-soft':  'rgba(230,192,104,.85)'
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Inter', 'Helvetica Neue', Arial, sans-serif"
  }
};

export const CV_CONTENT = {
  settings: {
    brandName: 'Your Name',
    tagline:   'Your Title · Your City',
    siteName:  'Your Name — Portfolio',
    phone:     '',
    email:     'you@yourname.com',
    address:   'City, Country',
    businessHours: 'Available for new projects',
    social: { facebook: '', twitter: '', github: '', linkedin: '', instagram: '' }
  },
  heroSlides: [{
    title: 'Hi, I\'m',
    titleAccent: 'Your Name',
    subtitle: 'Designer · Developer · Photographer · Whatever you do',
    description: 'A one-line pitch about what you do and who you do it for. Edit this from the admin panel — AI can suggest copy that matches your role and tone.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1800&q=85',
    ctaText: 'Get in touch', ctaLink: '#contact'
  }],
  services: [
    { number: '01', title: 'What you do, #1', price: '', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=85', description: 'A skill, service, or focus area. Short and concrete works better than abstract.' },
    { number: '02', title: 'What you do, #2', price: '', image: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=600&q=85', description: 'Another core skill or service you offer.' },
    { number: '03', title: 'What you do, #3', price: '', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=85', description: 'Round it out — three is usually enough.' }
  ],
  pricingPlans: [],
  team: [
    { name: 'Project One',   role: 'Brief description · 2024', image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Project Two',   role: 'Brief description · 2024', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Project Three', role: 'Brief description · 2023', image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f5a07d?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

// ─── SPA — calm, sophisticated, gold-on-black ────────────────────────────────
export const SPA_THEME = {
  colors: {
    'black':      '#000000',
    'black-soft': '#111111',
    'black-card': '#1a1a1a',
    'gold':       '#c5a47e',
    'white':      '#ffffff',
    'gray':       '#aaaaaa'
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
  }
};

export const SPA_CONTENT = {
  settings: {
    brandName: 'Serenity', tagline: 'Spa & Massage · Vancouver',
    siteName:  'Serenity Spa & Massage',
    phone:     '(604) 200-1234',
    email:     'hello@serenityspa.ca',
    address:   '789 Granville Street, Suite 200, Vancouver, BC V6Z 1K3',
    businessHours: 'Mon–Fri: 9am – 8pm · Sat–Sun: 10am – 6pm',
    social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
  },
  heroSlides: [{
    title: 'Restore Your Body,',
    titleAccent: 'Renew Your Spirit',
    subtitle: "Downtown Vancouver's Premier Spa",
    description: 'Indulge in therapeutic massage and luxury spa treatments crafted to melt away stress and restore balance.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1800&q=85',
    ctaText: 'Book an Appointment', ctaLink: 'booking.html'
  }],
  services: [
    { number: '01', title: 'Swedish Massage',   price: '$90 / 60 min',  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=85', description: 'The classic full-body massage using long flowing strokes to ease muscle tension.' },
    { number: '02', title: 'Deep Tissue',       price: '$110 / 60 min', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85', description: 'Targets deeper layers of muscle and connective tissue.' },
    { number: '03', title: 'Hot Stone Therapy', price: '$130 / 75 min', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=85', description: 'Warm basalt stones melt tension deep in the muscles.' },
    { number: '04', title: 'Prenatal Massage',  price: '$100 / 60 min', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85', description: 'Specially tailored for expecting mothers.' },
    { number: '05', title: 'Reflexology',       price: '$80 / 45 min',  image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=85', description: 'Precise pressure on the feet for whole-body healing.' },
    { number: '06', title: 'Aromatherapy',      price: '$115 / 60 min', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=85', description: 'Therapeutic essential oils combined with massage.' }
  ],
  pricingPlans: [
    { name: 'Silver Pack', subtitle: 'Essential monthly care', price: 99,  period: '/Mo', isActive: false,
      features: ['1 full-body massage / month', '10% off all add-ons', 'Priority booking window', 'Aromatherapy upgrade included'],
      ctaText: 'Get Now', ctaLink: 'booking.html' },
    { name: 'Gold Pack',   subtitle: 'For our most loyal guests', price: 199, period: '/Mo', isActive: true,
      features: ['2 full-body massages / month', '20% off all add-ons', 'Free hot stone upgrade', 'Complimentary guest pass quarterly', 'Priority therapist selection'],
      ctaText: 'Get Now', ctaLink: 'booking.html' }
  ],
  team: [
    { name: 'Maya Chen',      role: 'Registered Massage Therapist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'David Park',     role: 'Deep Tissue Specialist',       image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Aisha Thompson', role: 'Aromatherapy & Hot Stone',     image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Lena Müller',    role: 'Prenatal & Reflexology',       image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

// ─── SALON — warm rose/cream, hair-focused ───────────────────────────────────
export const SALON_THEME = {
  colors: {
    'black':      '#1a0e0e',
    'black-soft': '#2a1818',
    'black-card': '#3a2424',
    'gold':       '#d4a574',
    'white':      '#fdf6f0',
    'gray':       '#9b8b85'
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
  }
};

export const SALON_CONTENT = {
  settings: {
    brandName: 'Lumen', tagline: 'Hair Studio · Toronto',
    siteName:  'Lumen Hair Studio',
    phone:     '(416) 555-0102',
    email:     'hello@lumenhair.ca',
    address:   '210 Queen Street West, Toronto, ON M5V 1Z4',
    businessHours: 'Tue–Fri: 10am – 8pm · Sat: 9am – 6pm',
    social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
  },
  heroSlides: [{
    title: 'Confidence Begins',
    titleAccent: 'With Great Hair',
    subtitle: "Toronto's Independent Hair Studio",
    description: 'Precision cuts, custom colour, and bespoke styling — one stylist, one chair, undivided attention.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&q=85',
    ctaText: 'Book an Appointment', ctaLink: 'booking.html'
  }],
  services: [
    { number: '01', title: 'Signature Cut',     price: '$75 / 45 min',  image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=85', description: 'A precise cut built around your face shape and lifestyle.' },
    { number: '02', title: 'Custom Colour',     price: '$140 / 2 hr',   image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&q=85', description: 'Single-process colour blended to bring out your natural tones.' },
    { number: '03', title: 'Balayage',          price: '$220 / 3 hr',   image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=85', description: 'Hand-painted highlights for soft, sun-kissed dimension.' },
    { number: '04', title: 'Bridal Styling',    price: '$180 / 90 min', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=85', description: 'On-location or in-studio styling for your wedding day.' },
    { number: '05', title: 'Keratin Treatment', price: '$250 / 2 hr',   image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=85', description: 'Smooth frizz and add shine for up to twelve weeks.' },
    { number: '06', title: 'Blowout & Style',   price: '$55 / 30 min',  image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=85', description: 'Salon-finished hair for an event or just because.' }
  ],
  pricingPlans: [
    { name: 'Glow Member',  subtitle: 'Monthly maintenance', price: 89,  period: '/Mo', isActive: false,
      features: ['1 cut OR blowout per month', '15% off retail products', 'Priority Saturday booking', 'Free deep-conditioning add-on'],
      ctaText: 'Join Now', ctaLink: 'booking.html' },
    { name: 'Studio Member', subtitle: 'Full-service membership', price: 199, period: '/Mo', isActive: true,
      features: ['1 cut + 1 blowout per month', '25% off retail products', 'Complimentary colour gloss every quarter', 'Priority any-day booking', 'Bring a guest at 50% off'],
      ctaText: 'Join Now', ctaLink: 'booking.html' }
  ],
  team: [
    { name: 'Sofia Reyes',     role: 'Founder & Master Stylist',     image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Jordan Kim',      role: 'Colour Specialist',            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Emma Thompson',   role: 'Bridal & Editorial',           image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

// ─── YOGA — sage/earth, mindful, class-focused ───────────────────────────────
export const YOGA_THEME = {
  colors: {
    'black':      '#0f1a14',
    'black-soft': '#1a2820',
    'black-card': '#243528',
    'gold':       '#a8b89a',
    'white':      '#f5f1e8',
    'gray':       '#8a9489'
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
  }
};

export const YOGA_CONTENT = {
  settings: {
    brandName: 'Stillpoint', tagline: 'Yoga Studio · Brooklyn',
    siteName:  'Stillpoint Yoga',
    phone:     '(347) 555-0188',
    email:     'hello@stillpoint.yoga',
    address:   '54 Berry Street, Brooklyn, NY 11211',
    businessHours: 'Mon–Sun: 6am – 9pm · Classes every 90 min',
    social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
  },
  heroSlides: [{
    title: 'Move with Intention,',
    titleAccent: 'Breathe with Purpose',
    subtitle: 'A Quiet Studio in the Heart of Brooklyn',
    description: 'Small-group classes for every body. Beginners welcome, no experience required — just a willingness to be present.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1800&q=85',
    ctaText: 'See the Schedule', ctaLink: 'booking.html'
  }],
  services: [
    { number: '01', title: 'Vinyasa Flow',     price: '$24 / 75 min', image: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&q=85', description: 'Breath-led movement that builds strength and flexibility.' },
    { number: '02', title: 'Yin & Restorative',price: '$22 / 75 min', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=85', description: 'Long-held passive poses to release deep connective tissue.' },
    { number: '03', title: 'Hot Power Yoga',   price: '$26 / 60 min', image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&q=85', description: 'A vigorous flow in our 95°F infrared-heated room.' },
    { number: '04', title: 'Prenatal Yoga',    price: '$28 / 75 min', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=85', description: 'Gentle, trimester-aware practice for expecting mothers.' },
    { number: '05', title: 'Beginner Series',  price: '$120 / 4 wks', image: 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=600&q=85', description: 'A four-week foundation course — small group, same teacher each week.' },
    { number: '06', title: 'Private Session',  price: '$90 / 60 min', image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=85', description: 'One-on-one instruction tailored to your goals or injuries.' }
  ],
  pricingPlans: [
    { name: 'Drop-In',     subtitle: 'No commitment',           price: 24,  period: '/class', isActive: false,
      features: ['Any single class', 'Mat + props included', 'Book up to 7 days ahead'],
      ctaText: 'Buy a Class', ctaLink: 'booking.html' },
    { name: 'Unlimited',   subtitle: 'For the daily practice', price: 189, period: '/Mo',    isActive: true,
      features: ['Unlimited group classes', '2 guest passes per month', 'Priority booking for workshops', '15% off retail and merch', '1 free private session per quarter'],
      ctaText: 'Start Unlimited', ctaLink: 'booking.html' }
  ],
  team: [
    { name: 'Ana Castillo',  role: 'Founder & E-RYT 500',          image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Marcus Chen',   role: 'Vinyasa & Hot Yoga',           image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Priya Singh',   role: 'Yin, Restorative & Prenatal',  image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

// ─── GENERIC — placeholder copy for unseeded or unknown-template clients ─────
export const GENERIC_THEME = SPA_THEME;
export const GENERIC_CONTENT = {
  settings: {
    brandName: 'Your Business', tagline: 'Tagline · City',
    siteName:  'Your Business Name',
    phone:     '(000) 000-0000',
    email:     'hello@yourbusiness.com',
    address:   '123 Main Street, City, Country',
    businessHours: 'Mon–Fri: 9am – 6pm',
    social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
  },
  heroSlides: [{
    title: 'Welcome to',
    titleAccent: 'Your Business',
    subtitle: 'A short tagline that says what you do',
    description: 'Edit this hero text from the admin panel to introduce your business in two sentences or less.',
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1800&q=85',
    ctaText: 'Get Started', ctaLink: 'contact.html'
  }],
  services: [
    { number: '01', title: 'Service One',   price: 'From $0', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&q=85', description: 'Describe your first service here. One or two sentences works best.' },
    { number: '02', title: 'Service Two',   price: 'From $0', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=85', description: 'Describe your second service here.' },
    { number: '03', title: 'Service Three', price: 'From $0', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=85', description: 'Describe your third service here.' }
  ],
  pricingPlans: [
    { name: 'Starter', subtitle: 'For getting started', price: 49,  period: '/Mo', isActive: false,
      features: ['Feature one', 'Feature two', 'Feature three'], ctaText: 'Choose Starter', ctaLink: 'contact.html' },
    { name: 'Pro',     subtitle: 'For growing teams',   price: 99, period: '/Mo', isActive: true,
      features: ['Everything in Starter', 'Plus feature four', 'Plus feature five', 'Priority support'], ctaText: 'Choose Pro', ctaLink: 'contact.html' }
  ],
  team: [
    { name: 'Team Member',  role: 'Founder',  image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

// ─── REGISTRY ────────────────────────────────────────────────────────────────
// Order matters: this is the order the admin templates picker will show them
// AND the marketing emphasis. CV/portfolio is first — the broadest appeal and
// the lowest barrier to onboarding ("describe yourself" beats "describe your
// whole business"). Niche business templates come after.
export const TEMPLATES = {
  cv: {
    id: 'cv', name: 'Personal · CV / Portfolio',
    description: 'A clean professional site for designers, developers, photographers, writers — anyone who wants a personal website. The default starting point for new clients.',
    palette: ['#0c0c0e', '#e6c068'],
    tags: ['portfolio', 'resume', 'personal', 'professional'],
    content: CV_CONTENT, theme: CV_THEME
  },
  spa: {
    id: 'spa', name: 'Spa & Wellness',
    description: 'Calm, sophisticated design for massage therapists, day spas, and wellness centres.',
    palette: ['#000000', '#c5a47e'],
    tags: ['spa', 'massage', 'wellness'],
    content: SPA_CONTENT, theme: SPA_THEME
  },
  salon: {
    id: 'salon', name: 'Hair Salon',
    description: 'Warm rose-and-cream palette for hair studios, colourists, and bridal stylists.',
    palette: ['#1a0e0e', '#d4a574'],
    tags: ['salon', 'hair', 'beauty'],
    content: SALON_CONTENT, theme: SALON_THEME
  },
  yoga: {
    id: 'yoga', name: 'Yoga Studio',
    description: 'Earthy sage palette for yoga studios, meditation centres, and small movement classes.',
    palette: ['#0f1a14', '#a8b89a'],
    tags: ['yoga', 'fitness', 'wellness'],
    content: YOGA_CONTENT, theme: YOGA_THEME
  }
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);
// CV is the default for new signups — broadest fit, fastest onboarding.
export const DEFAULT_TEMPLATE = 'cv';

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES[DEFAULT_TEMPLATE];
}

// Returns content+theme defaults for a given template id, falling back to GENERIC
// when the id is missing or unknown — so seeding never crashes on bad data.
export function defaultsFor(templateId) {
  const tpl = TEMPLATES[templateId];
  if (!tpl) return { content: GENERIC_CONTENT, theme: GENERIC_THEME };
  return { content: tpl.content, theme: tpl.theme };
}
