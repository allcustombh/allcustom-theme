const SHOPIFY_DOMAIN = 'allcustom.myshopify.com';
const STOREFRONT_TOKEN = 'f612a270bdc38af3d338f231230b068d';
const API_VERSION = '2024-04';

async function shopifyFetch({ query, variables = {} }) {
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const { data, errors } = await response.json();
    
    if (errors) {
      console.error('GraphQL Errors:', errors);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}

// Example Query to fetch Customization Options if mapped as Products or Metaobjects
async function fetchConfiguratorOptions() {
  const query = `
    query {
      products(first: 50, query: "tag:customizer") {
        edges {
          node {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;
  return await shopifyFetch({ query });
}

// Create a cart with the selected components (line items)
async function createCart(lines) {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const variables = {
    input: { lines }
  };
  return await shopifyFetch({ query, variables });
}

window.ShopifyAPI = {
  fetchConfiguratorOptions,
  createCart
};

// Localization Dictionary
const translations = {
  en: {
    "builder-title": "Configure Your Timepiece",
    "builder-desc": "Select your components to craft a truly unique piece of horological art.",
    "label-base": "1. Base Architecture",
    "label-dial": "2. Custom Dials",
    "label-bezel": "3. Bezels",
    "trust-warranty": "1-Year Warranty",
    "trust-water": "Water Resistance",
    "trust-auth": "Authentic Components",
    "crafted-title": "Crafted In Progress",
    "addToCart": "Finalize Build & Add to Cart"
  },
  ar: {
    "builder-title": "صمم ساعتك",
    "builder-desc": "اختر المكونات لتصميم تحفة فنية فريدة من نوعها في عالم الساعات.",
    "label-base": "1. الهيكل الأساسي",
    "label-dial": "2. موانئ مخصصة",
    "label-bezel": "3. الإطارات (بزل)",
    "trust-warranty": "ضمان لمدة عام",
    "trust-water": "مقاومة للماء",
    "trust-auth": "مكونات أصلية",
    "crafted-title": "قيد التصنيع الحرفي",
    "addToCart": "إنهاء التصميم وإضافة للسلة"
  }
};

const currencyRates = {
  USD: { rate: 1, symbol: '$' },
  AED: { rate: 3.67, symbol: 'د.إ ' },
  SAR: { rate: 3.75, symbol: 'ر.س ' },
  QAR: { rate: 3.64, symbol: 'ر.ق ' },
  KWD: { rate: 0.31, symbol: 'د.ك ' },
  BHD: { rate: 0.38, symbol: 'ب.د ' },
  OMR: { rate: 0.38, symbol: 'ر.ع ' }
};

let currentLang = 'en';
let currentCurrency = 'USD';

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  // Apply translations
  Object.keys(translations[lang]).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[lang][id];
      } else {
        el.textContent = translations[lang][id];
      }
    }
  });

  // Re-render prices with new direction/format if needed
  if(window.updateTotalPrice) window.updateTotalPrice();
}

function formatPrice(amountInUSD) {
  const data = currencyRates[currentCurrency];
  const converted = amountInUSD * data.rate;
  // If Arabic, symbol usually comes after, but for simplicity we prepend or use localized format
  return `${data.symbol}${converted.toLocaleString(currentLang === 'ar' ? 'ar-AE' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

document.getElementById('languageSwitcher').addEventListener('change', (e) => {
  setLanguage(e.target.value);
});

document.getElementById('currencySwitcher').addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  if(window.updateTotalPrice) window.updateTotalPrice();
  if(window.renderOptions) window.renderOptions(); // Re-render prices in cards
});

window.Localization = {
  setLanguage,
  formatPrice,
  currentLang: () => currentLang,
  currentCurrency: () => currentCurrency
};

// Application State
const state = {
  selections: {
    base: null,
    dial: null,
    bezel: null
  },
  totalPriceUSD: 0
};

// Mock Data (Fallback if API fails/empty)
const mockData = {
  base: [
    { id: 'b1', name: 'Datejust 41mm', priceUSD: 8500, img: 'https://via.placeholder.com/150/1F2833/C5A880?text=DJ41' },
    { id: 'b2', name: 'Submariner', priceUSD: 9500, img: 'https://via.placeholder.com/150/1F2833/C5A880?text=Sub' }
  ],
  dial: [
    { id: 'd1', name: 'Obsidian Black', priceUSD: 500, img: 'https://via.placeholder.com/150/0B0C10/C5A880?text=Black' },
    { id: 'd2', name: 'Meteorite', priceUSD: 2500, img: 'https://via.placeholder.com/150/95989A/C5A880?text=Meteorite' },
    { id: 'd3', name: 'Arabic Numerals', priceUSD: 1200, img: 'https://via.placeholder.com/150/1F2833/C5A880?text=Arabic' }
  ],
  bezel: [
    { id: 'bz1', name: 'Fluted Gold', priceUSD: 1500, img: 'https://via.placeholder.com/150/C5A880/0B0C10?text=Fluted' },
    { id: 'bz2', name: 'Ceramic Black', priceUSD: 900, img: 'https://via.placeholder.com/150/1F2833/C5A880?text=Ceramic' }
  ]
};

// Initialization
async function init() {
  // Try fetching from Shopify, fallback to mock data
  console.log("Initializing Atelier Engine...");
  
  // Set defaults
  state.selections.base = mockData.base[0];
  state.selections.dial = mockData.dial[0];
  state.selections.bezel = mockData.bezel[0];

  setupAccordions();
  window.renderOptions();
  window.updateTotalPrice();

  document.getElementById('addToCartBtn').addEventListener('click', handleAddToCart);
}

// Accordion Logic
function setupAccordions() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isActive = content.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.accordion-header').forEach(h => h.setAttribute('aria-expanded', 'false'));
      
      if (!isActive) {
        content.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Render Option Cards
window.renderOptions = function() {
  ['base', 'dial', 'bezel'].forEach(category => {
    const container = document.getElementById(`options-${category}`);
    if (!container) return;
    
    container.innerHTML = mockData[category].map(item => {
      const isSelected = state.selections[category]?.id === item.id;
      return `
        <div class="option-card ${isSelected ? 'selected' : ''}" data-category="${category}" data-id="${item.id}">
          <img src="${item.img}" alt="${item.name}">
          <div class="option-name">${item.name}</div>
          <div class="option-price">${window.Localization.formatPrice(item.priceUSD)}</div>
        </div>
      `;
    }).join('');
  });

  // Attach events
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const cat = card.dataset.category;
      const id = card.dataset.id;
      const item = mockData[cat].find(i => i.id === id);
      
      if (item) {
        state.selections[cat] = item;
        window.renderOptions(); // Re-render to update selected states
        window.updateTotalPrice();
      }
    });
  });
};

// Update Visualizer and Price
window.updateTotalPrice = function() {
  let total = 0;
  let summary = [];
  
  ['base', 'dial', 'bezel'].forEach(cat => {
    if (state.selections[cat]) {
      total += state.selections[cat].priceUSD;
      summary.push(state.selections[cat].name);
    }
  });

  state.totalPriceUSD = total;
  
  const priceEl = document.getElementById('total-price');
  const summaryEl = document.getElementById('visualizer-summary');
  
  if (priceEl) priceEl.textContent = window.Localization.formatPrice(total);
  if (summaryEl) summaryEl.textContent = summary.join(' · ');
};

// Cart Logic
async function handleAddToCart() {
  const btn = document.getElementById('addToCartBtn');
  const originalText = btn.textContent;
  btn.textContent = window.Localization.currentLang() === 'ar' ? 'جاري المعالجة...' : 'Processing...';
  btn.disabled = true;

  // Simulate Cart Creation (or use window.ShopifyAPI.createCart with actual variants)
  setTimeout(() => {
    alert(`Configuration finalized! Total: ${window.Localization.formatPrice(state.totalPriceUSD)}\n(In production, this maps to Shopify Storefront API Cart Create)`);
    btn.textContent = originalText;
    btn.disabled = false;
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);


