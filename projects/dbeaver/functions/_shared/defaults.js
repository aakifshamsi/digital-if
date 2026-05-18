// Mirrors the DEFAULT_CONTENT / DEFAULT_THEME constants in admin/assets/js/admin.js.
// Kept identical so a freshly-seeded KV produces the same demo as a fresh browser.
// If you change either side, update both — there is no build step linking them.

export const DEFAULT_THEME = {
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

export const DEFAULT_CONTENT = {
  settings: {
    brandName: 'Serenity',
    tagline:   'Spa & Massage · Vancouver',
    siteName:  'Serenity Spa & Massage',
    phone:     '(604) 200-1234',
    email:     'hello@serenityspa.ca',
    address:   '789 Granville Street, Suite 200, Vancouver, BC V6Z 1K3',
    businessHours: 'Mon–Fri: 9am – 8pm · Sat–Sun: 10am – 6pm',
    social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
  },
  heroSlides: [
    {
      title: 'Restore Your Body,',
      titleAccent: 'Renew Your Spirit',
      subtitle: "Downtown Vancouver's Premier Spa",
      description: 'Indulge in therapeutic massage and luxury spa treatments crafted to melt away stress and restore balance.',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1800&q=85',
      ctaText: 'Book an Appointment',
      ctaLink: 'booking.html'
    }
  ],
  services: [
    { number: '01', title: 'Swedish Massage',   price: '$90 / 60 min',  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=85', description: 'The classic full-body massage using long flowing strokes to ease muscle tension.' },
    { number: '02', title: 'Deep Tissue',       price: '$110 / 60 min', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85', description: 'Targets deeper layers of muscle and connective tissue.' },
    { number: '03', title: 'Hot Stone Therapy', price: '$130 / 75 min', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=85', description: 'Warm basalt stones melt tension deep in the muscles.' },
    { number: '04', title: 'Prenatal Massage',  price: '$100 / 60 min', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85', description: 'Specially tailored for expecting mothers.' },
    { number: '05', title: 'Reflexology',       price: '$80 / 45 min',  image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=85', description: 'Precise pressure on the feet for whole-body healing.' },
    { number: '06', title: 'Aromatherapy',      price: '$115 / 60 min', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=85', description: 'Therapeutic essential oils combined with massage.' }
  ],
  pricingPlans: [
    {
      name: 'Silver Pack', subtitle: 'Essential monthly care',
      price: 99, period: '/Mo', isActive: false,
      features: ['1 full-body massage / month', '10% off all add-ons', 'Priority booking window', 'Aromatherapy upgrade included'],
      ctaText: 'Get Now', ctaLink: 'booking.html'
    },
    {
      name: 'Gold Pack', subtitle: 'For our most loyal guests',
      price: 199, period: '/Mo', isActive: true,
      features: ['2 full-body massages / month', '20% off all add-ons', 'Free hot stone upgrade', 'Complimentary guest pass quarterly', 'Priority therapist selection'],
      ctaText: 'Get Now', ctaLink: 'booking.html'
    }
  ],
  team: [
    { name: 'Maya Chen',      role: 'Registered Massage Therapist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'David Park',     role: 'Deep Tissue Specialist',       image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Aisha Thompson', role: 'Aromatherapy & Hot Stone',     image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
    { name: 'Lena Müller',    role: 'Prenatal & Reflexology',       image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
  ]
};

export const DEFAULT_CLIENTS = [
  {
    id: 'cli_001', name: 'Serenity Spa & Massage', contact: 'Maya Chen',
    email: 'maya@serenityspa.ca', phone: '(604) 200-1234',
    domain: 'massagedowntownvancouver.com', template: 'spa-massage',
    status: 'active', plan: 'Professional', created: '2024-01-15'
  }
];
