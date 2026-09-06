/* ============================================================
   FRESHMART — DEMO ORDER DATA
   Shared by the Order History page and the Tracking page.
   Items are flattened (product fields merged with qty) so that
   JSX can access item.name, item.image, item.price, item.qty directly.
   ============================================================ */

import { PRODUCTS } from './products'

const p = (id) => PRODUCTS.find((x) => x.id === id)

/* Flatten a product + qty into a single item object */
const item = (productId, qty) => {
  const product = p(productId)
  if (!product) return null
  return { ...product, qty }
}

/* Stage → tracking step index:
   processing = packed (step 2)
   transit    = out for delivery (step 3)
   delivered  = done (step 4) */
export const STEPS = [
  { key: 'placed',    en: 'Order Placed',      kh: 'បានបញ្ជាទិញ' },
  { key: 'packed',    en: 'Chiller Packing',   kh: 'កំពុងវេចខ្ចប់' },
  { key: 'transit',   en: 'Out for Delivery',  kh: 'កំពុងដឹកជញ្ជូន' },
  { key: 'delivered', en: 'Delivered',         kh: 'បានដឹកជញ្ជូន' },
]

export const STAGE_STEP = {
  processing: 2,
  transit:    3,
  delivered:  4,
}

export const STATUS_LABEL = {
  processing: { en: 'Processing', kh: 'កំពុងដំណើរការ' },
  transit:    { en: 'In Transit', kh: 'កំពុងដឹកជញ្ជូន' },
  delivered:  { en: 'Delivered',  kh: 'បានដឹកជញ្ជូន' },
}

export const ORDERS = [
  {
    id: 'BG-1087',
    date: '2026-08-16',
    stage: 'processing',
    items: [item(71, 1), item(27, 2), item(30, 1)].filter(Boolean),
    delivery: {
      fee: 0,
      address: '12B, Street 310, Boeung Keng Kang I, Phnom Penh',
      recipient: 'Sokha Chan',
      phone: '+855 12 345 678',
    },
    rider: { name: 'Sok Dara', phone: '+855 12 345 678', plate: 'PP-8821', rating: '4.9' },
    eta: { en: 'Arriving in ~25 min', kh: 'នឹងមកដល់ក្នុង ~២៥ នាទី' },
  },
  {
    id: 'BG-1076',
    date: '2026-08-15',
    stage: 'transit',
    items: [item(17, 2), item(48, 1), item(37, 1), item(14, 2)].filter(Boolean),
    delivery: {
      fee: 0.90,
      address: 'Villa 7, Borey Peng Huoth, Sen Sok, Phnom Penh',
      recipient: 'Dara Meas',
      phone: '+855 97 876 543',
    },
    rider: { name: 'Chan Rithy', phone: '+855 97 876 543', plate: 'PP-5503', rating: '4.8' },
    eta: { en: 'Arriving in ~12 min', kh: 'នឹងមកដល់ក្នុង ~១២ នាទី' },
  },
  {
    id: 'BG-1063',
    date: '2026-08-14',
    stage: 'delivered',
    items: [item(73, 1), item(22, 1), item(57, 2)].filter(Boolean),
    delivery: {
      fee: 0,
      address: 'House 45, Street 2004, Toul Kork, Phnom Penh',
      recipient: 'Sreymom Keo',
      phone: '+855 16 222 901',
    },
    rider: { name: 'Sreymom K.', phone: '+855 16 222 901', plate: 'PP-3317', rating: '5.0' },
    eta: { en: 'Delivered Aug 14, 6:32 PM', kh: 'បានដឹកជញ្ជូន ថ្ងៃទី ១៤ សីហា' },
  },
  {
    id: 'BG-1049',
    date: '2026-08-11',
    stage: 'delivered',
    items: [item(1, 6), item(8, 2), item(40, 1)].filter(Boolean),
    delivery: {
      fee: 0.90,
      address: 'Flat 3F, La Vista 1, Chroy Changvar, Phnom Penh',
      recipient: 'Vathana Lim',
      phone: '+855 61 555 432',
    },
    rider: { name: 'Vathana L.', phone: '+855 61 555 432', plate: 'PP-7742', rating: '4.7' },
    eta: { en: 'Delivered Aug 11, 11:08 AM', kh: 'បានដឹកជញ្ជូន ថ្ងៃទី ១១ សីហា' },
  },
  {
    id: 'BG-1031',
    date: '2026-08-08',
    stage: 'delivered',
    items: [item(15, 3), item(12, 4)].filter(Boolean),
    delivery: {
      fee: 0,
      address: 'Road 3, Dey Kraham, Russey Keo, Phnom Penh',
      recipient: 'Kimhout Seng',
      phone: '+855 15 987 210',
    },
    rider: { name: 'Kimhout S.', phone: '+855 15 987 210', plate: 'PP-1196', rating: '4.9' },
    eta: { en: 'Delivered Aug 8, 7:45 PM', kh: 'បានដឹកជញ្ជូន ថ្ងៃទី ៨ សីហា' },
  },
  {
    id: 'BG-1018',
    date: '2026-08-05',
    stage: 'delivered',
    items: [item(71, 2), item(78, 1), item(77, 2)].filter(Boolean),
    delivery: {
      fee: 0.90,
      address: '9A, Samdech Techo Hun Sen Blvd, Chbar Ampov, Phnom Penh',
      recipient: 'Borey Mao',
      phone: '+855 88 456 789',
    },
    rider: { name: 'Borey M.', phone: '+855 88 456 789', plate: 'PP-6640', rating: '4.8' },
    eta: { en: 'Delivered Aug 5, 9:20 AM', kh: 'បានដឹកជញ្ជូន ថ្ងៃទី ៥ សីហា' },
  },
]

/* Pretty date: "Aug 16, 2026" or Khmer equivalent */
export const formatOrderDate = (iso, lang) => {
  const d = new Date(`${iso}T00:00:00`)
  if (lang === 'kh') {
    const months = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ']
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* Sum item prices — items are now flat (item.price, item.qty) */
export const orderTotal = (order) =>
  order.items.reduce((sum, it) => sum + (Number(it.price) || 0) * it.qty, 0)
