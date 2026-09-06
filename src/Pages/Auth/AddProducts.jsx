import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { adminAttributeAPI, adminBrandAPI, adminCategoryAPI, adminProductAPI, adminProductGroupAPI, adminSupplierAPI, adminUnitAPI } from '../../api/api'
import { COUNTRIES } from '../../data/countries'
import { CountryFlag } from '../../components/CountryFlag'
import { RichTextEditor } from '../../components/RichTextEditor'
import { enrichProductWithMeta, enrichProductList, saveProductExtendedMeta } from '../../utils/productMeta'

// Categories / units shown in the dropdowns. Values are stored as plain
// strings on the Product entity (master-data pages can upgrade these to
// foreign keys later without changing the API shape).
const CATEGORIES = [
  { en: 'Fruits & Vegetables', kh: 'ផ្លែឈើ និងបន្លែ' },
  { en: 'Meat & Seafood', kh: 'សាច់ និងគ្រឿងសមុទ្រ' },
  { en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' },
  { en: 'Bakery & Bread', kh: 'នំប៉័ង និងនំ' },
  { en: 'Drinks', kh: 'ភេសជ្ជៈ' },
  { en: 'Snacks', kh: 'អាហារសម្រន់' },
  { en: 'Other', kh: 'ផ្សេងទៀត' },
]

const UNITS = [
  { en: 'kg', kh: 'គីឡូ' },
  { en: 'g', kh: 'ក្រាម' },
  { en: 'L', kh: 'លីត្រ' },
  { en: 'ml', kh: 'មីលីលីត្រ' },
  { en: 'box', kh: 'ប្រអប់' },
  { en: 'bag', kh: 'កាបូប' },
  { en: 'bottle', kh: 'ដប' },
  { en: 'pack', kh: 'កញ្ចប់' },
  { en: 'piece', kh: 'ដុំ' },
  { en: 'set', kh: 'ឈុត' },
  { en: 'combo', kh: 'កំបូ' },
]

const PRODUCT_TYPES = [
  { en: 'Stock', kh: 'មានស្តុក' },
  { en: 'Non-Stock', kh: 'គ្មានស្តុក' },
  { en: 'Variant', kh: 'បំរែបំរួល' },
  { en: 'Package', kh: 'កញ្ចប់' },
]

// Blank product form. Keys mirror the backend ProductDto exactly — the extra
// ERP-style fields (upc/ean/hsCode/reorderPoint…) stay client-side until the
// backend grows matching columns.
const EMPTY_FORM = {
  code: '',
  barCode: '',
  name: '',
  nameKh: '',
  description: '',
  productGroup: '',
  category: '',
  uom: '',
  basePrice: '',
  averageCost: '',
  standardCost: '',
  country: '',
  brand: '',
  supplier: '',
  active: true,
  outOfStock: false,
  favorite: false,
  imageUrl: '',
  // Sale Option card
  serialize: false,
  expired: false,
  allowDiscount: true,
  scale: false,
  tax: '',
  // Scale Information
  plu: '',
  packDate: '',
  expireDays: '',
  scaleUom: '',
  noneWeight: false,
  // Expired Before
  expiredNumber: '30',
  expiredType: 'Day',
}

// number-or-null helper: '' → null, otherwise Number()
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
const str = (v) => (v == null ? '' : String(v))

const TEXTS = {
  pageTitle: { en: 'Add Product', kh: 'បន្ថែមផលិតផល' },
  back: { en: 'Products hub', kh: 'ផ្ទាំងផលិតផល' },
  // section headers
  primaryInfo: { en: 'Primary Information', kh: 'ព័ត៌មានចម្បង' },
  idsInfo: { en: 'IDs Information', kh: 'ព័ត៌មានអត្តសញ្ញាណ' },
  saleOption: { en: 'Sale Option', kh: 'ជម្រើសលក់' },
  serialize: { en: 'Serialize', kh: 'លេខសៀរៀល' },
  expired: { en: 'Expired', kh: 'មានថ្ងៃផុតកំណត់' },
  allowDiscount: { en: 'Allow Discount', kh: 'អនុញ្ញាតបញ្ចុះតម្លៃ' },
  scale: { en: 'Scale', kh: 'ជញ្ជីងថ្លឹង' },
  scaleInfo: { en: 'Scale Information', kh: 'ព័ត៌មានជញ្ជីងថ្លឹង' },
  scaleInfoSubtitle: { en: 'Option of scale configuration and PLU parameters', kh: 'ជម្រើសកំណត់ជញ្ជីងថ្លឹង និងប៉ារ៉ាម៉ែត្រ PLU' },
  pluLabel: { en: 'PLU', kh: 'លេខ PLU' },
  pluPlaceholder: { en: 'e.g. 10024', kh: 'ឧ. 10024' },
  packDateLabel: { en: 'Pack Date', kh: 'ថ្ងៃវេចខ្ចប់' },
  packDatePlaceholder: { en: 'e.g. 2026-08-31', kh: 'ឧ. 2026-08-31' },
  expireDaysLabel: { en: 'Expire Date (Day)', kh: 'ថ្ងៃផុតកំណត់ (ថ្ងៃ)' },
  expireDaysPlaceholder: { en: 'e.g. 7', kh: 'ឧ. 7' },
  scaleUomLabel: { en: 'UOM', kh: 'ខ្នាតជញ្ជីង' },
  noneWeightLabel: { en: 'None Weight', kh: 'មិនថ្លឹង (ទំនិញដុំ/កញ្ចប់)' },
  expiredBefore: { en: 'Expired Before', kh: 'ផុតកំណត់មុន' },
  expiredNumberLabel: { en: 'Expired Number', kh: 'ចំនួន' },
  expiredTypeLabel: { en: 'Expired Type', kh: 'ប្រភេទ' },
  day: { en: 'Day', kh: 'ថ្ងៃ' },
  week: { en: 'Week', kh: 'សប្តាហ៍' },
  month: { en: 'Month', kh: 'ខែ' },
  taxLabel: { en: 'Tax', kh: 'ពន្ធ' },
  taxPlaceholder: { en: 'Select tax', kh: 'ជ្រើសរើសពន្ធ' },
  uomInfo: { en: 'Unit of measure information', kh: 'ព័ត៌មានឯកតាវាស់' },
  uomInfoSubtitle: {
    en: 'The type of UOM we choose determines how we manage inventory',
    kh: 'ប្រភេទឯកតាវាស់ដែលយើងជ្រើសរើស កំណត់ពីរបៀបដែលយើងគ្រប់គ្រងស្តុក',
  },
  priceInfo: { en: 'Product price information', kh: 'ព័ត៌មានតម្លៃផលិតផល' },
  priceInfoSubtitle: {
    en: 'The type of product price we input determines how we manage inventory',
    kh: 'ប្រភេទតម្លៃផលិតផលដែលយើងបញ្ចូល កំណត់ពីរបៀបដែលយើងគ្រប់គ្រងស្តុក',
  },
  orderCost: { en: 'Order Point and Cost Option', kh: 'ចំណុចបញ្ជាទិញ និងចំណាយ' },
  images: { en: 'Images', kh: 'រូបភាព' },
  productOption: { en: 'Product Option', kh: 'ជម្រើសផលិតផល' },
  sellOOS: { en: 'Sell on out of stock', kh: 'លក់ពេលអស់ស្តុក' },
  favoriteCard: { en: 'Favorite Product', kh: 'ផលិតផលដែលចូលចិត្ត' },
  defaultSupplier: { en: 'Default Supplier', kh: 'អ្នកផ្គត់ផ្គង់លំនាំដើម' },
  supplierPlaceholder: { en: 'Select supplier', kh: 'ជ្រើសរើសអ្នកផ្គត់ផ្គង់' },
  // fields
  code: { en: 'Code', kh: 'កូដ' },
  codePlaceholder: { en: 'Auto-generated if left blank (or type custom code)', kh: 'បង្កើតស្វ័យប្រវត្តិបើទទេ (ឬបញ្ចូលកូដដោយខ្លួនឯង)' },
  autoGen: { en: 'Auto', kh: 'ស្វ័យប្រវត្តិ' },
  autoGenTitle: {
    en: 'Generate the next free product code automatically — or clear this field and type your own',
    kh: 'បង្កើតកូដផលិតផលបន្ទាប់ដោយស្វ័យប្រវត្តិ — ឬសម្អាតចំណុចនេះហើយបញ្ចូលដោយខ្លួនឯង',
  },
  genFailed: { en: 'Could not reach the server — generated from time instead.', kh: 'មិនអាចទាក់ទងម៉ាស៊ីនមេបានទេ — បង្កើតពីពេលវេលាជំនួស។' },
  active: { en: 'Active', kh: 'ដំណើរការ' },
  description: { en: 'Description', kh: 'ការពិពណ៌នា' },
  descriptionPlaceholder: { en: 'e.g. Fresh strawberries', kh: 'ឧ. ផ្លែស្ត្របឺរីស្រស់' },
  secondLang: { en: 'Second Language', kh: 'ភាសាទី២' },
  secondLangPlaceholder: { en: 'ឧ. ផ្លែស្ត្របឺរីស្រស់', kh: 'ឧ. ផ្លែស្ត្របឺរីស្រស់' },
  longDescription: { en: 'Long Description', kh: 'ការពិពណ៌នាវែង' },
  longDescriptionPlaceholder: { en: 'Describe freshness, origin, packaging, or customer notes...', kh: 'ពិពណ៌នាអំពីភាពស្រស់ ប្រភព ការវេចខ្ចប់ ឬកំណត់ចំណាំ...' },
  upc: { en: 'UPC', kh: 'UPC' },
  ean: { en: 'EAN', kh: 'EAN' },
  hsCode: { en: 'HS-Code', kh: 'កូដ HS' },
  uom: { en: 'UOM', kh: 'ឯកតាវាស់' },
  unitPlaceholder: { en: 'Select unit', kh: 'ជ្រើសរើសឯកតា' },
  barcode: { en: 'Barcode', kh: 'បារកូដ' },
  autoGenBarcode: { en: 'Auto Generate Code', kh: 'បង្កើតកូដស្វ័យប្រវត្តិ' },
  defaultCol: { en: 'Default', kh: 'លំនាំដើម' },
  factor: { en: 'Factor', kh: 'កត្តា' },
  addRow: { en: 'Add +', kh: 'បន្ថែម +' },
  currency: { en: 'Currency', kh: 'រូបិយប័ណ្ណ' },
  price: { en: 'Price', kh: 'តម្លៃ' },
  standardCost: { en: 'Standard Cost', kh: 'ចំណាយស្តង់ដារ' },
  reorderPoint: { en: 'Re-Order Point', kh: 'ចំណុចបញ្ជាទិញឡើងវិញ' },
  maxOverPo: { en: 'Max Received Over PO', kh: 'អតិបរមាលើ PO' },
  orderQty: { en: 'Order QTY', kh: 'បរិមាណបញ្ជាទិញ' },
  closedForNonStock: { en: 'Closed (Non-Stock)', kh: 'បិទ (គ្មានស្តុក)' },
  uploadHint: { en: 'Drop an image here, or click to browse', kh: 'ទម្លាក់រូបថតនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស' },
  productType: { en: 'Product Type', kh: 'ប្រភេទផលិតផល' },
  productTypePlaceholder: { en: 'Select product type', kh: 'ជ្រើសរើសប្រភេទផលិតផល' },
  productGroup: { en: 'Product Group', kh: 'ក្រុមផលិតផល' },
  groupPlaceholder: { en: 'Select product group', kh: 'ជ្រើសរើសក្រុមផលិតផល' },
  category: { en: 'Category', kh: 'ប្រភេទ' },
  categoryPlaceholder: { en: 'Select category', kh: 'ជ្រើសរើសប្រភេទ' },
  brand: { en: 'Brand', kh: 'ម៉ាក' },
  brandPlaceholder: { en: 'Select brand', kh: 'ជ្រើសរើសម៉ាក' },
  country: { en: 'Country', kh: 'ប្រទេស' },
  countryPlaceholder: { en: 'Select country', kh: 'ជ្រើសរើសប្រទេស' },
  tags: { en: 'Tags', kh: 'ស្លាក' },
  tagsPlaceholder: { en: 'Select tags', kh: 'ជ្រើសរើសស្លាក' },
  enableOOS: { en: 'Enable out of stock product', kh: 'បើកផលិតផលអស់ស្តុក' },
  favoriteLabel: { en: 'Favorite Product', kh: 'ផលិតផលដែលចូលចិត្ត' },
  saveBtn: { en: 'Save product', kh: 'រក្សាទុកផលិតផល' },
  updateBtn: { en: 'Update product', kh: 'ធ្វើបច្ចុប្បន្នភាពផលិតផល' },
  cancelBtn: { en: 'Cancel', kh: 'បោះបង់' },
  errName: { en: 'Description is required', kh: 'ត្រូវការការពិពណ៌នា' },
  errPrice: { en: 'Enter a valid non-negative number', kh: 'បញ្ចូលលេខត្រឹមត្រូវ (មិនអវិជ្ជមាន)' },
  loadFailed: { en: 'Could not load products from the server. Please refresh or check your login.', kh: 'មិនអាចផ្ទុកផលិតផលពីម៉ាស៊ីនមេបានទេ។ សូមព្យាយាមម្តងទៀត។' },
  // Variant section texts
  attributeSection: { en: 'Attribute & Variant Configuration', kh: 'ការកំណត់រចនាសម្ព័ន្ធលក្ខណៈ និងបំរែបំរួល' },
  addAttributeBtn: { en: '+ Add Attribute', kh: '+ បន្ថែមលក្ខណៈសម្បត្តិ' },
  attributeName: { en: 'Attribute Name', kh: 'ឈ្មោះលក្ខណៈសម្បត្តិ' },
  attributeNamePlaceholder: { en: 'e.g. Size, Color, Flavor...', kh: 'ឧ. ទំហំ, ពណ៌, រសជាតិ...' },
  attributeValues: { en: 'Attribute Values', kh: 'តម្លៃលក្ខណៈសម្បត្តិ' },
  addValuePlaceholder: { en: 'Type value & press Enter...', kh: 'វាយបញ្ចូល ហើយចុច Enter...' },
  generateVariantsBtn: { en: 'Auto-Generate Matrix', kh: 'បង្កើតម៉ាទ្រីសបំរែបំរួល' },
  variantMatrix: { en: 'Variant Value Information', kh: 'ព័ត៌មានតម្លៃបំរែបំរួល (Variant Value Information)' },
  addVariantRowBtn: { en: '+ Add Variant Row', kh: '+ បន្ថែមជួរដេកបំរែបំរួល' },
  skuCode: { en: 'SKU Code', kh: 'កូដ SKU' },
  secDescription: { en: 'Sec (Second Lang)', kh: 'ភាសាទី២' },
  variantImage: { en: 'Image', kh: 'រូបភាព' },
  // Package section texts
  fixedPkgTitle: { en: 'Fixed Product Package', kh: 'កញ្ចប់ផលិតផលថេរ' },
  fixedPkgSubtitle: { en: 'Combine many product to one package', kh: 'រួមបញ្ចូលផលិតផលជាច្រើនទៅក្នុងកញ្ចប់តែមួយ' },
  flexiblePkgTitle: { en: 'Flexible Product Package', kh: 'កញ្ចប់ផលិតផលបត់បែន' },
  flexiblePkgSubtitle: { en: 'Combine many product to one package', kh: 'រួមបញ្ចូលផលិតផលជាច្រើនទៅក្នុងកញ្ចប់តែមួយ' },
  requiredQtyLabel: { en: 'Required Qty', kh: 'បរិមាណតម្រូវ' },
  hintProductSearch: { en: 'Hint: Description, product code and Barcode', kh: 'ស្វែងរក៖ ការពិពណ៌នា កូដផលិតផល និងបារកូដ' },
  allowModifyLabel: { en: 'Allow Modify', kh: 'អនុញ្ញាតកែប្រែ' },
  basePriceText: { en: 'BASEPRICE', kh: 'តម្លៃមូលដ្ឋាន' },
  unitText: { en: 'UNIT', kh: 'ឯកតា' },
  dollarText: { en: 'Dollar', kh: 'ដុល្លារ' },
}

// blank UOM table row — the first row starts as the default
const EMPTY_UOM_ROW = () => ({ id: Date.now() + Math.random(), uom: '', barcode: '', isDefault: false, factor: '1', active: true })

// blank variant matrix row
const EMPTY_VARIANT_ROW = (baseCode = '', baseName = '', basePrice = '') => ({
  id: Date.now() + Math.random(),
  imageUrl: '',
  sku: baseCode ? `${baseCode}-VAR` : '',
  barcode: '',
  description: baseName || '',
  nameKh: '',
  price: basePrice || '',
  active: true,
})

// blank Fixed Package row
const EMPTY_FIXED_PKG_ROW = () => ({
  id: Date.now() + Math.random(),
  code: '',
  barcode: '',
  description: '',
  qty: '0',
  uom: '',
})

// blank Flexible Package row
const EMPTY_FLEXIBLE_PKG_ROW = () => ({
  id: Date.now() + Math.random(),
  code: '',
  barcode: '',
  description: '',
  price: '0',
  qty: '0',
  uom: '',
  allowModify: false,
})

export const AddProducts = () => {
  const { lang } = useLanguage()
  const { addNotification } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  // product-code generator: null = nothing generated yet
  const [codeHint, setCodeHint] = useState(null)
  // client-side ERP extras (not yet columns on the backend ProductDto)
  const [upc, setUpc] = useState('')
  const [ean, setEan] = useState('')
  const [hsCode, setHsCode] = useState('')
  const [productType, setProductType] = useState('Stock')
  const [tags, setTags] = useState('')
  const [reorderPoint, setReorderPoint] = useState('')
  const [maxOverPo, setMaxOverPo] = useState('')
  const [orderQty, setOrderQty] = useState('')
  const [uomRows, setUomRows] = useState([{ ...EMPTY_UOM_ROW(), isDefault: true }])
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Master data lists
  const [productGroups, setProductGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [units, setUnits] = useState([])
  const [attributeDefs, setAttributeDefs] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])

  // Variant management state
  const [attributes, setAttributes] = useState([
    { id: 'attr-1', name: 'Size', values: ['Small', 'Medium', 'Large'], activeDefId: null },
  ])
  const [variantRows, setVariantRows] = useState([])

  // Package management state
  const [fixedPkgRows, setFixedPkgRows] = useState([EMPTY_FIXED_PKG_ROW()])
  const [flexiblePkgRows, setFlexiblePkgRows] = useState([EMPTY_FLEXIBLE_PKG_ROW()])
  const [requiredQty, setRequiredQty] = useState('0')

  useEffect(() => {
    let cancelled = false
    adminProductGroupAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setProductGroups(res.data)
      })
      .catch(() => {})

    adminCategoryAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setCategories(res.data)
      })
      .catch(() => {})

    adminBrandAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setBrands(res.data)
      })
      .catch(() => {})

    adminSupplierAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setSuppliers(res.data)
      })
      .catch(() => {})

    adminUnitAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setUnits(res.data)
      })
      .catch(() => {})

    adminAttributeAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) setAttributeDefs(res.data)
      })
      .catch(() => {})

    adminProductAPI
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) {
          setAvailableProducts(res.data)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  // DTO → form state for editing (deep link ?id=<n> from All Products).
  const startEdit = (rawP) => {
    const p = enrichProductWithMeta(rawP)
    setEditingId(p.id)

    // Restore Product Type
    const targetType = p.productType || (p.type ? p.type : 'Stock')
    setProductType(targetType)

    // Restore Order Point & Max Po
    setReorderPoint(str(p.reorderPoint ?? p.reOrderPoint ?? ''))
    setMaxOverPo(str(p.maxOverPo ?? ''))
    setOrderQty(str(p.orderQty ?? ''))
    setTags(str(p.tags ?? p.tag ?? ''))
    setRequiredQty(str(p.requiredQty ?? '1'))

    // Restore UOM Rows
    if (Array.isArray(p.uomRows) && p.uomRows.length > 0) {
      setUomRows(p.uomRows)
    } else {
      setUomRows([{ ...EMPTY_UOM_ROW(), uom: str(p.uom), barcode: str(p.barCode), isDefault: true }])
    }

    // Restore Variant & Package Rows
    if (Array.isArray(p.variantRows) && p.variantRows.length > 0) {
      setVariantRows(p.variantRows)
    }
    if (Array.isArray(p.attributes) && p.attributes.length > 0) {
      setAttributes(p.attributes)
    }
    if (Array.isArray(p.fixedPkgRows) && p.fixedPkgRows.length > 0) {
      setFixedPkgRows(p.fixedPkgRows)
    }
    if (Array.isArray(p.flexiblePkgRows) && p.flexiblePkgRows.length > 0) {
      setFlexiblePkgRows(p.flexiblePkgRows)
    }

    setForm({
      ...EMPTY_FORM,
      code: str(p.code),
      barCode: str(p.barCode),
      name: str(p.name),
      nameKh: str(p.nameKh),
      description: str(p.description),
      productGroup: str(p.productGroup),
      category: CATEGORIES.some((c) => c.en === p.category) ? p.category : str(p.category),
      uom: str(p.uom),
      basePrice: p.basePrice == null ? '' : String(p.basePrice),
      averageCost: p.averageCost == null ? '' : String(p.averageCost),
      standardCost: p.standardCost == null ? '' : String(p.standardCost),
      country: str(p.country),
      brand: str(p.brand),
      supplier: str(p.supplier),
      active: p.active !== false,
      outOfStock: !!p.outOfStock,
      favorite: !!p.favorite,
      imageUrl: str(p.imageUrl),
      serialize: Boolean(p.serialize || p.serial),
      expired: Boolean(p.expired || p.expiryDate),
      allowDiscount: p.allowDiscount !== false,
      scale: Boolean(p.scale || p.isScale || p.hasScale),
      tax: str(p.tax ?? ''),
      plu: str(p.plu || p.pluCode || ''),
      packDate: str(p.packDate ?? ''),
      expireDays: str(p.expireDays || p.expireDate || ''),
      scaleUom: str(p.scaleUom || p.uom || ''),
      noneWeight: Boolean(p.noneWeight),
      expiredNumber: str(p.expiredNumber || p.expireBeforeNumber || '30'),
      expiredType: str(p.expiredType || p.expireBeforeType || 'Day'),
    })
    setUpc(str(p.barCode))
    setImageFile(null)
    setImagePreview(p.imageUrl || null)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Auto-generate code
  const generateCode = () => {
    setCodeHint(null)
    adminProductAPI
      .getAll()
      .then((res) => {
        const prods = enrichProductList(Array.isArray(res?.data) ? res.data : [])
        const codes = prods
          .map((p) => str(p.code).trim())
          .filter(Boolean)
        let max = 0
        codes.forEach((c) => {
          const m = c.match(/(\d+)\s*$/)
          if (m) max = Math.max(max, parseInt(m[1], 10))
        })
        let candidate = `PRD-${String(max + 1).padStart(4, '0')}`
        while (codes.includes(candidate)) {
          max += 1
          candidate = `PRD-${String(max + 1).padStart(4, '0')}`
        }
        setForm((prev) => ({ ...prev, code: candidate }))
      })
      .catch(() => {
        setForm((prev) => ({ ...prev, code: `PRD-${Date.now().toString().slice(-6)}` }))
        setCodeHint(TEXTS.genFailed[lang])
      })
  }

  const clearCode = () => setForm((prev) => ({ ...prev, code: '' }))

  // Load deep link ?id=
  useEffect(() => {
    let cancelled = false
    adminProductAPI
      .getAll()
      .then((res) => {
        if (cancelled || !Array.isArray(res?.data)) return
        const enriched = enrichProductList(res.data)
        const editParam = searchParams.get('id')
        if (editParam) {
          const target = enriched.find((p) => String(p.id) === String(editParam) || String(p.code) === String(editParam))
          if (target) startEdit(target)
          setSearchParams({}, { replace: true })
        }
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleToggle = (name) =>
    setForm((prev) => ({ ...prev, [name]: !prev[name] }))

  // Image scaling & compression
  const MAX_IMAGE_CHARS = 60000
  const drawScaled = (img, scale) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  }
  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let scale = Math.min(1, 640 / Math.max(img.width, img.height))
        let quality = 0.8
        let dataUrl = drawScaled(img, scale).toDataURL('image/jpeg', quality)
        while (dataUrl.length > MAX_IMAGE_CHARS && quality > 0.3) {
          quality -= 0.1
          dataUrl = drawScaled(img, scale).toDataURL('image/jpeg', quality)
          if (quality <= 0.3 && dataUrl.length > MAX_IMAGE_CHARS && scale > 0.25) {
            scale *= 0.7
            quality = 0.8
            dataUrl = drawScaled(img, scale).toDataURL('image/jpeg', quality)
          }
        }
        setImagePreview(dataUrl)
        setImageFile(file)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImage(file)
  }

  // UOM Rows helpers
  const setUomRow = (id, patch) =>
    setUomRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const setDefaultUomRow = (id) =>
    setUomRows((prev) => prev.map((r) => ({ ...r, isDefault: r.id === id })))

  const addUomRow = () => setUomRows((prev) => [...prev, EMPTY_UOM_ROW()])

  const removeUomRow = (id) =>
    setUomRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  // ---- Attribute & Variant Helpers ----
  const addAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      { id: `attr-${Date.now()}`, name: '', values: [], activeDefId: null },
    ])
  }

  const removeAttribute = (id) => {
    setAttributes((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAttributeName = (id, name, def = null) => {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const currentVals = [...a.values]
        if (def && def.values && currentVals.length === 0) {
          const suggested = String(def.values)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
          return { ...a, name, values: suggested, activeDefId: def.id }
        }
        return { ...a, name, activeDefId: def ? def.id : null }
      })
    )
  }

  const addAttributeValue = (id, val) => {
    const clean = val.trim()
    if (!clean) return
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        if (a.values.includes(clean)) return a
        return { ...a, values: [...a.values, clean] }
      })
    )
  }

  const removeAttributeValue = (id, val) => {
    setAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, values: a.values.filter((v) => v !== val) } : a))
    )
  }

  const generateVariantMatrix = () => {
    const validAttrs = attributes.filter((a) => a.name.trim() && a.values.length > 0)
    if (validAttrs.length === 0) return

    // Cartesian product of all attribute values
    const combinations = validAttrs.reduce(
      (acc, attr) => {
        const next = []
        acc.forEach((existing) => {
          attr.values.forEach((v) => {
            next.push([...existing, { attrName: attr.name, value: v }])
          })
        })
        return next
      },
      [[]]
    )

    const baseCode = form.code || 'PRD'
    const baseName = form.name || 'Product'
    const basePrice = form.basePrice || '0.00'

    const rows = combinations.map((combo, idx) => {
      const tagSuffix = combo.map((c) => c.value.toUpperCase().replace(/\s+/g, '-')).join('-')
      const nameSuffix = combo.map((c) => c.value).join(' / ')
      return {
        id: `var-${Date.now()}-${idx}`,
        imageUrl: form.imageUrl || imagePreview || '',
        sku: `${baseCode}-${tagSuffix}`,
        barcode: '',
        description: `${baseName} - ${nameSuffix}`,
        nameKh: form.nameKh ? `${form.nameKh} - ${nameSuffix}` : '',
        price: basePrice,
        active: true,
      }
    })

    setVariantRows(rows)
  }

  const addVariantRow = () => {
    setVariantRows((prev) => [...prev, EMPTY_VARIANT_ROW(form.code, form.name, form.basePrice)])
  }

  const updateVariantRow = (id, patch) => {
    setVariantRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeVariantRow = (id) => {
    setVariantRows((prev) => prev.filter((r) => r.id !== id))
  }

  // ---- Fixed & Flexible Package Helpers ----
  const addFixedPkgRow = () => setFixedPkgRows((prev) => [...prev, EMPTY_FIXED_PKG_ROW()])
  const updateFixedPkgRow = (id, patch) => setFixedPkgRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeFixedPkgRow = (id) => setFixedPkgRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  const handleFixedPkgCodeChange = (id, codeVal) => {
    const match = availableProducts.find((p) => p.code && p.code.toLowerCase() === codeVal.trim().toLowerCase())
    if (match) {
      updateFixedPkgRow(id, {
        code: match.code || codeVal,
        barcode: match.barCode || '',
        description: match.name || '',
        uom: match.uom || '',
      })
    } else {
      updateFixedPkgRow(id, { code: codeVal })
    }
  }

  const handleFixedPkgBarcodeChange = (id, barcodeVal) => {
    const match = availableProducts.find((p) => p.barCode && p.barCode.toLowerCase() === barcodeVal.trim().toLowerCase())
    if (match) {
      updateFixedPkgRow(id, {
        code: match.code || '',
        barcode: match.barCode || barcodeVal,
        description: match.name || '',
        uom: match.uom || '',
      })
    } else {
      updateFixedPkgRow(id, { barcode: barcodeVal })
    }
  }

  const addFlexiblePkgRow = () => setFlexiblePkgRows((prev) => [...prev, EMPTY_FLEXIBLE_PKG_ROW()])
  const updateFlexiblePkgRow = (id, patch) => setFlexiblePkgRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeFlexiblePkgRow = (id) => setFlexiblePkgRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  const handleFlexiblePkgCodeChange = (id, codeVal) => {
    const match = availableProducts.find((p) => p.code && p.code.toLowerCase() === codeVal.trim().toLowerCase())
    if (match) {
      updateFlexiblePkgRow(id, {
        code: match.code || codeVal,
        barcode: match.barCode || '',
        description: match.name || '',
        price: match.basePrice != null ? String(match.basePrice) : '0',
        uom: match.uom || '',
      })
    } else {
      updateFlexiblePkgRow(id, { code: codeVal })
    }
  }

  const handleFlexiblePkgBarcodeChange = (id, barcodeVal) => {
    const match = availableProducts.find((p) => p.barCode && p.barCode.toLowerCase() === barcodeVal.trim().toLowerCase())
    if (match) {
      updateFlexiblePkgRow(id, {
        code: match.code || '',
        barcode: match.barCode || barcodeVal,
        description: match.name || '',
        price: match.basePrice != null ? String(match.basePrice) : '0',
        uom: match.uom || '',
      })
    } else {
      updateFlexiblePkgRow(id, { barcode: barcodeVal })
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = TEXTS.errName[lang]
    const numericChecks = [
      ...(productType !== 'Variant' ? [['basePrice', form.basePrice]] : []),
      ['averageCost', form.averageCost],
      ...(productType === 'Stock' || productType === 'Non-Stock' ? [['standardCost', form.standardCost]] : []),
      ['tax', form.tax],
      ...(productType === 'Stock' ? [['reorderPoint', reorderPoint], ['maxOverPo', maxOverPo], ['orderQty', orderQty]] : []),
      ...uomRows.map((r, i) => [`uomFactor${i + 1}`, r.factor]),
      ...(productType === 'Variant' ? variantRows.map((r, i) => [`variantPrice${i + 1}`, r.price]) : []),
    ]
    numericChecks.forEach(([key, value]) => {
      if (value !== '' && value != null && (isNaN(value) || Number(value) < 0)) {
        e[key] = TEXTS.errPrice[lang]
      }
    })
    if (form.code.length > 50) e.code = lang === 'en' ? 'Code must be at most 50 characters' : 'កូដត្រូវតែតិចជាងឬស្មើ៥០តួអក្សរ'
    if (upc.length > 64) e.upc = lang === 'en' ? 'Barcode must be at most 64 characters' : 'បារកូដត្រូវតែតិចជាងឬស្មើ៦៤តួអក្សរ'
    return e
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setUpc('')
    setEan('')
    setHsCode('')
    setProductType('Stock')
    setTags('')
    setReorderPoint('')
    setMaxOverPo('')
    setOrderQty('')
    setUomRows([{ ...EMPTY_UOM_ROW(), isDefault: true }])
    setImageFile(null)
    setImagePreview(null)
    setVariantRows([])
    setFixedPkgRows([EMPTY_FIXED_PKG_ROW()])
    setFlexiblePkgRows([EMPTY_FLEXIBLE_PKG_ROW()])
    setRequiredQty('0')
    if (fileRef.current) fileRef.current.value = ''
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    const v = validate()
    const summary = Object.keys(v).length > 0
      ? (lang === 'en'
        ? `Please fix ${Object.keys(v).length} field${Object.keys(v).length > 1 ? 's' : ''} before saving: ${Object.keys(v).join(', ')}`
        : `សូមកែតម្រូវចំណុច${Object.keys(v).length}មុនពេលរក្សាទុក`)
      : null
    setErrors(summary ? { ...v, submit: summary } : v)
    if (summary) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const defaultRow = uomRows.find((r) => r.isDefault) || uomRows[0]
    const effectiveBasePrice = productType === 'Variant'
      ? (num(form.basePrice) ?? (variantRows.length > 0 ? num(variantRows[0].price) : 0))
      : num(form.basePrice)

    let finalCode = form.code?.trim()
    if (!finalCode && !editingId) {
      try {
        const res = await adminProductAPI.getAll()
        const codes = (Array.isArray(res?.data) ? res.data : [])
          .map((p) => str(p.code).trim())
          .filter(Boolean)
        let max = 0
        codes.forEach((c) => {
          const m = c.match(/(\d+)\s*$/)
          if (m) max = Math.max(max, parseInt(m[1], 10))
        })
        let candidate = `PRD-${String(max + 1).padStart(4, '0')}`
        while (codes.includes(candidate)) {
          max += 1
          candidate = `PRD-${String(max + 1).padStart(4, '0')}`
        }
        finalCode = candidate
      } catch {
        finalCode = `PRD-${Date.now().toString().slice(-6)}`
      }
    }

    const payload = {
      ...form,
      productType,
      reorderPoint: num(reorderPoint),
      maxOverPo: num(maxOverPo),
      orderQty: num(orderQty),
      tags: tags || null,
      code: finalCode || form.code || null,
      barCode: upc || ean || defaultRow?.barcode || form.barCode || null,
      uom: defaultRow?.uom || form.uom || null,
      imageUrl: imageFile ? imagePreview : (form.imageUrl?.trim() || imagePreview || null),
      supplier: form.supplier?.trim() || null,
      basePrice: effectiveBasePrice,
      averageCost: num(form.averageCost),
      standardCost: productType === 'Variant' ? null : num(form.standardCost),
      tax: form.tax === '' ? null : Number(form.tax),
      onHand: editingId ? (form.onHand != null ? Number(form.onHand) : 0) : 0,
      stock: editingId ? (form.stock != null ? Number(form.stock) : 0) : 0,
      expiryDate: null,
      scale: !!form.scale,
      isScale: !!form.scale,
      hasScale: !!form.scale,
      plu: form.plu?.trim() || null,
      packDate: form.packDate?.trim() || null,
      expireDays: form.expireDays ? Number(form.expireDays) : null,
      scaleUom: form.scaleUom || form.uom || null,
      noneWeight: !!form.noneWeight,
      expiredNumber: form.expiredNumber || '30',
      expiredType: form.expiredType || 'Day',
      uomRows,
      attributes,
      variantRows,
      fixedPkgRows,
      flexiblePkgRows,
      requiredQty: Number(requiredQty) || 1,
    }

    try {
      setSaving(true)
      let saved
      if (editingId) {
        saved = await adminProductAPI.update(editingId, payload)
        const savedProd = saved?.data || saved || {}
        const targetKey = savedProd.id || editingId
        saveProductExtendedMeta(targetKey, {
          ...payload,
          id: targetKey,
          code: finalCode || payload.code,
        })
        addNotification({
          type: 'product',
          action: 'edit',
          title: lang === 'en' ? 'Product updated' : 'បានធ្វើបច្ចុប្បន្នភាពផលិតផល',
          detail: form.name,
        })
      } else {
        saved = await adminProductAPI.create(payload)
        const savedProd = saved?.data || saved || {}
        const targetKey = savedProd.id || finalCode
        saveProductExtendedMeta(targetKey, {
          ...payload,
          id: savedProd.id || targetKey,
          code: finalCode || payload.code,
        })
        addNotification({
          type: 'product',
          action: 'add',
          title: lang === 'en' ? 'New product added' : 'បានបន្ថែមផលិតផលថ្មី',
          detail: form.name,
        })
      }
      cancelEdit()
      navigate('/admin/products/all')
      return saved
    } catch (err) {
      const fieldErrors = err.fields && typeof err.fields === 'object' ? err.fields : null
      const summary = fieldErrors
        ? `${err.message}: ${Object.entries(fieldErrors).map(([f, m]) => `${f} — ${m}`).join('; ')}`
        : err.message
      setErrors({ ...(fieldErrors || {}), submit: summary })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  // Clean, crisp input styling
  const inputBase = 'w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition duration-150 ease-in-out hover:border-slate-600 focus:border-emerald-500 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20'
  const errorInput = 'border-red-500/80 bg-red-500/10 focus:border-red-400 focus:ring-red-500/20'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950 p-4 md:p-6 text-slate-200">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Page header with modern clean layout */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-md p-4 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3.5">
            <Link
              to="/admin/products"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 text-slate-400 transition hover:border-emerald-500 hover:text-emerald-300 hover:scale-105 active:scale-95"
              aria-label={TEXTS.back[lang]}
            >
              <ChevronLeftIcon />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black tracking-tight text-white">{editingId ? TEXTS.updateBtn[lang] : TEXTS.pageTitle[lang]}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-300 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {PRODUCT_TYPES.find((t) => t.en === productType)?.[lang] || productType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {productType === 'Stock' && (lang === 'en' ? 'Standard inventory product with stock tracking & re-order points' : 'ផលិតផលស្តុកស្តង់ដារដែលមានការតាមដាន និងចំណុចបញ្ជាទិញ')}
                {productType === 'Non-Stock' && (lang === 'en' ? 'Service or non-inventoried item without re-order replenishment' : 'សេវាកម្ម ឬទំនិញគ្មានស្តុក')}
                {productType === 'Variant' && (lang === 'en' ? 'Product with multiple attribute variations (sizes, colors, flavors...)' : 'ផលិតផលដែលមានបំរែបំរួលច្រើន (ទំហំ ពណ៌...)')}
                {productType === 'Package' && (lang === 'en' ? 'Bundled package or customizable combo kit with component items' : 'កញ្ចប់ទំនិញរួម ឬកំបូបត់បែន')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
            {editingId && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                ID #{editingId}
              </span>
            )}
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                {TEXTS.cancelBtn[lang]}
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? '…' : editingId ? TEXTS.updateBtn[lang] : TEXTS.saveBtn[lang]}
            </button>
          </div>
        </div>

        {(loadError || errors.submit) && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-3 shadow-md ${errors.submit ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-amber-500/40 bg-amber-500/10 text-amber-200'}`}>
            <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
            <p className="flex-1">{errors.submit || TEXTS.loadFailed[lang]}</p>
          </div>
        )}

        {/* 70 / 30 two-column clean grid */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            {/* ===================== LEFT COLUMN ===================== */}
            <div className="space-y-6">
              {/* --- Primary Information --- */}
              <Card title={TEXTS.primaryInfo[lang]}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Code + Active checkbox */}
                    <Field label={TEXTS.code[lang]} error={errors.code}>
                      <div className="space-y-3">
                        <input
                          id="code"
                          name="code"
                          type="text"
                          placeholder={TEXTS.codePlaceholder?.[lang] || ''}
                          value={form.code}
                          onChange={handleChange}
                          className={`${inputBase} font-mono`}
                        />

                        {/* Bigger, clean Active tickbox tile */}
                        <label className="flex cursor-pointer select-none items-center gap-3.5 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 transition hover:border-slate-600">
                          <input
                            type="checkbox"
                            checked={form.active}
                            onChange={() => handleToggle('active')}
                            className="h-5 w-5 cursor-pointer accent-emerald-500 rounded"
                          />
                          <span className="text-sm font-bold text-slate-200">
                            {TEXTS.active[lang]}
                          </span>
                          <span className={`ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full ${form.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {form.active ? (lang === 'en' ? 'Active' : 'ដំណើរការ') : (lang === 'en' ? 'Inactive' : 'មិនដំណើរការ')}
                          </span>
                        </label>
                      </div>
                    </Field>

                    <Field label={TEXTS.secondLang[lang]}>
                      <input id="nameKh" name="nameKh" type="text" placeholder={TEXTS.secondLangPlaceholder[lang]} value={form.nameKh} onChange={handleChange} className={`${inputBase} ${errors.nameKh ? errorInput : ''}`} />
                    </Field>
                  </div>

                  <Field label={TEXTS.description[lang]} badge required error={errors.name}>
                    <input id="name" name="name" type="text" placeholder={TEXTS.descriptionPlaceholder[lang]} value={form.name} onChange={handleChange} className={`${inputBase} ${errors.name ? errorInput : ''}`} />
                  </Field>

                  {/* Long Description (Rich Text Editor) */}
                  <Field label={TEXTS.longDescription[lang]}>
                    <RichTextEditor
                      value={form.description}
                      onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
                      placeholder={TEXTS.longDescriptionPlaceholder[lang]}
                      minHeight="140px"
                    />
                  </Field>
                </div>
              </Card>

              {/* --- Sale Option Card --- */}
              <Card title={TEXTS.saleOption[lang]}>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Stock: Serialize, Expired, Allow Discount, Scale, Tax */}
                  {productType === 'Stock' && (
                    <>
                      <CheckTile label={TEXTS.serialize[lang]} checked={form.serialize} onChange={() => handleToggle('serialize')} />
                      <CheckTile label={TEXTS.expired[lang]} checked={form.expired} onChange={() => handleToggle('expired')} />
                      <CheckTile label={TEXTS.allowDiscount[lang]} checked={form.allowDiscount} onChange={() => handleToggle('allowDiscount')} />
                      <CheckTile label={TEXTS.scale[lang]} checked={form.scale} onChange={() => handleToggle('scale')} />
                      <Field label={TEXTS.taxLabel[lang]}>
                        <select name="tax" value={form.tax} onChange={handleChange} className={inputBase}>
                          <option value="">{TEXTS.taxPlaceholder[lang]}</option>
                          <option value="0">0% (None)</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </select>
                      </Field>
                    </>
                  )}

                  {/* Non-Stock: Allow Discount, Scale, Tax */}
                  {productType === 'Non-Stock' && (
                    <>
                      <CheckTile label={TEXTS.allowDiscount[lang]} checked={form.allowDiscount} onChange={() => handleToggle('allowDiscount')} />
                      <CheckTile label={TEXTS.scale[lang]} checked={form.scale} onChange={() => handleToggle('scale')} />
                      <Field label={TEXTS.taxLabel[lang]}>
                        <select name="tax" value={form.tax} onChange={handleChange} className={inputBase}>
                          <option value="">{TEXTS.taxPlaceholder[lang]}</option>
                          <option value="0">0% (None)</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </select>
                      </Field>
                    </>
                  )}

                  {/* Variant & Package: Allow Discount, Tax */}
                  {(productType === 'Variant' || productType === 'Package') && (
                    <>
                      <CheckTile label={TEXTS.allowDiscount[lang]} checked={form.allowDiscount} onChange={() => handleToggle('allowDiscount')} />
                      <Field label={TEXTS.taxLabel[lang]}>
                        <select name="tax" value={form.tax} onChange={handleChange} className={inputBase}>
                          <option value="">{TEXTS.taxPlaceholder[lang]}</option>
                          <option value="0">0% (None)</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </select>
                      </Field>
                    </>
                  )}
                </div>
              </Card>

              {/* --- Scale Information Card (Option of Scale) --- */}
              {(productType === 'Stock' || productType === 'Non-Stock') && form.scale && (
                <Card title={TEXTS.scaleInfo[lang]} subtitle={TEXTS.scaleInfoSubtitle[lang]}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* PLU - textbox * */}
                    <Field label={`${TEXTS.pluLabel[lang]} *`} error={errors.plu}>
                      <input
                        type="text"
                        name="plu"
                        value={form.plu}
                        onChange={handleChange}
                        placeholder={TEXTS.pluPlaceholder[lang]}
                        className={inputBase}
                      />
                    </Field>

                    {/* Pack Date Textbox */}
                    <Field label={TEXTS.packDateLabel[lang]}>
                      <input
                        type="text"
                        name="packDate"
                        value={form.packDate}
                        onChange={handleChange}
                        placeholder={TEXTS.packDatePlaceholder[lang]}
                        className={inputBase}
                      />
                    </Field>

                    {/* Expire Date (Day) Textbox */}
                    <Field label={TEXTS.expireDaysLabel[lang]}>
                      <input
                        type="number"
                        min="0"
                        name="expireDays"
                        value={form.expireDays}
                        onChange={handleChange}
                        placeholder={TEXTS.expireDaysPlaceholder[lang]}
                        className={inputBase}
                      />
                    </Field>

                    {/* UOM * dropdown */}
                    <Field label={`${TEXTS.scaleUomLabel[lang]} *`}>
                      <select
                        name="scaleUom"
                        value={form.scaleUom || form.uom || 'Kg'}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="Kg">Kg (Kilogram)</option>
                        <option value="g">g (Gram)</option>
                        <option value="Pack">Pack</option>
                        <option value="Pcs">Pcs (Pieces)</option>
                        <option value="Box">Box</option>
                        <option value="Bag">Bag</option>
                      </select>
                    </Field>
                  </div>

                  {/* None Weight tickbox */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="max-w-md">
                      <CheckTile
                        label={TEXTS.noneWeightLabel[lang]}
                        checked={form.noneWeight}
                        onChange={() => handleToggle('noneWeight')}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* ===================== VARIANT SPECIFIC: ATTRIBUTES & MATRIX ===================== */}
              {productType === 'Variant' && (
                <>
                  {/* Attribute Builder Card */}
                  <Card
                    title={TEXTS.attributeSection[lang]}
                    action={
                      <button
                        type="button"
                        onClick={addAttribute}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                      >
                        <PlusIcon /> {TEXTS.addAttributeBtn[lang]}
                      </button>
                    }
                  >
                    <div className="space-y-4">
                      {attributes.map((attr, idx) => (
                        <div key={attr.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-1 items-center gap-2.5 min-w-[240px]">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 font-mono text-xs font-bold text-slate-300">
                                #{idx + 1}
                              </span>
                              <div className="flex-1">
                                {attributeDefs.length > 0 ? (
                                  <select
                                    value={attr.activeDefId || ''}
                                    onChange={(e) => {
                                      const def = attributeDefs.find((d) => String(d.id) === e.target.value)
                                      updateAttributeName(attr.id, def ? (def.description || def.code) : e.target.value, def)
                                    }}
                                    className={inputBase}
                                  >
                                    <option value="">{TEXTS.attributeNamePlaceholder[lang]}</option>
                                    {attributeDefs.map((def) => (
                                      <option key={def.id} value={def.id}>
                                        {def.description || def.code} {def.nameKh ? `(${def.nameKh})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder={TEXTS.attributeNamePlaceholder[lang]}
                                    value={attr.name}
                                    onChange={(e) => updateAttributeName(attr.id, e.target.value)}
                                    className={inputBase}
                                  />
                                )}
                              </div>
                            </div>

                            {attributes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAttribute(attr.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                                title="Remove attribute"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </div>

                          {/* Attribute Values tag builder */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              {TEXTS.attributeValues[lang]}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                              {attr.values.map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-200 shadow-sm"
                                >
                                  {v}
                                  <button
                                    type="button"
                                    onClick={() => removeAttributeValue(attr.id, v)}
                                    className="flex h-4 w-4 items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/30 hover:text-white"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder={TEXTS.addValuePlaceholder[lang]}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addAttributeValue(attr.id, e.target.value)
                                    e.target.value = ''
                                  }
                                }}
                                className="min-w-[160px] flex-1 bg-transparent px-2 py-1 text-xs text-white outline-none placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <p className="text-xs text-slate-400">
                          {lang === 'en'
                            ? 'Configure attributes above, then generate all variant combinations automatically.'
                            : 'កំណត់រចនាសម្ព័ន្ធលក្ខណៈខាងលើ រួចបង្កើតម៉ាទ្រីសបំរែបំរួលដោយស្វ័យប្រវត្តិ។'}
                        </p>
                        <button
                          type="button"
                          onClick={generateVariantMatrix}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-95"
                        >
                          <SparkIcon /> {TEXTS.generateVariantsBtn[lang]}
                        </button>
                      </div>
                    </div>
                  </Card>

                  {/* Variant Value Information Matrix Card */}
                  <Card
                    title={TEXTS.variantMatrix[lang]}
                    action={
                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/50 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                      >
                        <PlusIcon /> {TEXTS.addVariantRowBtn[lang]}
                      </button>
                    }
                  >
                    {variantRows.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/30">
                        <p className="text-sm font-medium text-slate-400">
                          {lang === 'en'
                            ? 'No variants generated yet. Click "Auto-Generate Matrix" above or "+ Add Variant Row" to add manually.'
                            : 'មិនទាន់មានបំរែបំរួលនៅឡើយទេ។ ចុច "បង្កើតម៉ាទ្រីសបំរែបំរួល" ខាងលើ ឬ "+ បន្ថែមជួរដេក"។'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <table className="w-full min-w-[780px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="w-14 px-3 py-2.5 text-center">{TEXTS.variantImage[lang]}</th>
                              <th className="px-3 py-2.5">{TEXTS.skuCode[lang]}</th>
                              <th className="px-3 py-2.5">{TEXTS.barcode[lang]}</th>
                              <th className="px-3 py-2.5">{TEXTS.description[lang]}</th>
                              <th className="px-3 py-2.5">{TEXTS.secDescription[lang]}</th>
                              <th className="w-28 px-3 py-2.5">{TEXTS.price[lang]}</th>
                              <th className="w-10 px-3 py-2.5 text-center" />
                            </tr>
                          </thead>
                          <tbody>
                            {variantRows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-2 py-2 text-center">
                                  <div className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                                    {row.imageUrl ? (
                                      <img src={row.imageUrl} alt="Variant" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-slate-600"><PhotoIcon /></span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={row.sku}
                                    onChange={(e) => updateVariantRow(row.id, { sku: e.target.value })}
                                    className={`${inputBase} text-xs font-mono`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={row.barcode}
                                    placeholder="Barcode"
                                    onChange={(e) => updateVariantRow(row.id, { barcode: e.target.value })}
                                    className={`${inputBase} text-xs`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => updateVariantRow(row.id, { description: e.target.value })}
                                    className={`${inputBase} text-xs`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={row.nameKh}
                                    placeholder={TEXTS.secondLangPlaceholder[lang]}
                                    onChange={(e) => updateVariantRow(row.id, { nameKh: e.target.value })}
                                    className={`${inputBase} text-xs`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70">
                                    <span className="border-r border-slate-700/80 bg-slate-900/80 px-2 py-1.5 text-xs font-bold text-slate-400">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.price}
                                      onChange={(e) => updateVariantRow(row.id, { price: e.target.value })}
                                      className="w-full bg-transparent px-2 py-1.5 text-xs text-white outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeVariantRow(row.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                                    title="Remove variant"
                                  >
                                    <TrashIcon />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* --- IDs Information (Hidden for Package) --- */}
              {productType !== 'Package' && (
                <Card title={TEXTS.idsInfo[lang]}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label={TEXTS.upc[lang]}>
                      <input id="upc" type="text" value={upc} onChange={(e) => setUpc(e.target.value)} className={inputBase} />
                    </Field>
                    <Field label={TEXTS.ean[lang]}>
                      <input id="ean" type="text" value={ean} onChange={(e) => setEan(e.target.value)} className={inputBase} />
                    </Field>
                    <Field label={TEXTS.hsCode[lang]}>
                      <input id="hsCode" type="text" value={hsCode} onChange={(e) => setHsCode(e.target.value)} className={inputBase} />
                    </Field>
                  </div>
                </Card>
              )}

              {/* --- Unit of measure information --- */}
              <Card
                title={TEXTS.uomInfo[lang]}
                subtitle={TEXTS.uomInfoSubtitle[lang]}
                action={
                  <button type="button" onClick={addUomRow} className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/50 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950">
                    <PlusIcon /> {TEXTS.addRow[lang]}
                  </button>
                }
              >
                <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2.5">{TEXTS.uom[lang]}</th>
                        <th className="px-3 py-2.5">{TEXTS.barcode[lang]}</th>
                        <th className="px-3 py-2.5 text-center">{TEXTS.defaultCol[lang]}</th>
                        <th className="px-3 py-2.5">{TEXTS.factor[lang]}</th>
                        <th className="px-3 py-2.5 text-center">{TEXTS.active[lang]}</th>
                        {productType !== 'Variant' && <th className="w-10 px-3 py-2.5 text-center" />}
                      </tr>
                    </thead>
                    <tbody>
                      {uomRows.map((row, i) => (
                        <tr key={row.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-2">
                            <select
                              value={row.uom}
                              onChange={(e) => {
                                const v = e.target.value
                                const live = units.find((u) => (u.description || u.code) === v)
                                setUomRow(row.id, { uom: v, ...(live?.factor != null ? { factor: String(live.factor) } : {}) })
                              }}
                              className={inputBase}
                            >
                              <option value="">{productType === 'Package' ? 'UNIT' : TEXTS.unitPlaceholder[lang]}</option>
                              {units.length > 0 && units.map((u) => (
                                <option key={`u-${u.id}`} value={u.description || u.code}>{u.description || u.code}</option>
                              ))}
                              {units.length === 0 && UNITS.map((u) => <option key={u.en} value={u.en}>{u[lang]}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.barcode}
                              placeholder={TEXTS.autoGenBarcode[lang]}
                              onChange={(e) => setUomRow(row.id, { barcode: e.target.value })}
                              className={inputBase}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="radio" name="uom-default" checked={row.isDefault} onChange={() => setDefaultUomRow(row.id)} className="h-4 w-4 cursor-pointer accent-emerald-500" aria-label={`${TEXTS.defaultCol[lang]} ${i + 1}`} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min="0" step="any" value={row.factor} onChange={(e) => setUomRow(row.id, { factor: e.target.value })} className={inputBase} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={row.active} onChange={() => setUomRow(row.id, { active: !row.active })} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" aria-label={`${TEXTS.active[lang]} ${i + 1}`} />
                          </td>
                          {productType !== 'Variant' && (
                            <td className="px-3 py-2 text-center">
                              {uomRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeUomRow(row.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-400/80 transition hover:bg-amber-500/15 hover:text-amber-300"
                                  aria-label="Remove row"
                                  title="Remove row"
                                >
                                  <TrashIcon />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* --- Product price information (Hidden for Variant) --- */}
              {productType !== 'Variant' && (
                <Card
                  title={TEXTS.priceInfo[lang]}
                  subtitle={TEXTS.priceInfoSubtitle[lang]}
                >
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-2.5">{TEXTS.description[lang]}</th>
                          <th className="px-4 py-2.5">{TEXTS.uom[lang]}</th>
                          <th className="px-4 py-2.5">{TEXTS.currency[lang]}</th>
                          <th className="px-4 py-2.5">{TEXTS.price[lang]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-200 font-semibold">
                            {form.name || (productType === 'Package' ? TEXTS.basePriceText[lang] : 'BASEPRICE')}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {uomRows.find((r) => r.isDefault)?.uom || (productType === 'Package' ? TEXTS.unitText[lang] : 'UNIT')}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{TEXTS.dollarText[lang]}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70 max-w-[160px]">
                              <span className="border-r border-slate-700/80 bg-slate-900/80 px-3 py-2 text-sm font-bold text-slate-400">$</span>
                              <input
                                id="basePrice"
                                name="basePrice"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={form.basePrice}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                              />
                            </div>
                            {errors.basePrice && <span className="mt-1 block text-xs font-semibold text-red-300">{errors.basePrice}</span>}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ===================== PACKAGE SPECIFIC SECTIONS ===================== */}
              {productType === 'Package' && (
                <>
                  {/* --- Fixed Product Package Card --- */}
                  <Card
                    title={TEXTS.fixedPkgTitle[lang]}
                    subtitle={TEXTS.fixedPkgSubtitle[lang]}
                    action={
                      <button
                        type="button"
                        onClick={addFixedPkgRow}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                      >
                        <PlusIcon /> {TEXTS.addRow[lang]}
                      </button>
                    }
                  >
                    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                      <table className="w-full min-w-[550px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-3 py-2.5">{TEXTS.description[lang]}</th>
                            <th className="w-28 px-3 py-2.5">{TEXTS.orderQty[lang]}</th>
                            <th className="w-32 px-3 py-2.5">{TEXTS.uom[lang]}</th>
                            <th className="w-10 px-3 py-2.5 text-center" />
                          </tr>
                        </thead>
                        <tbody>
                          {fixedPkgRows.map((row) => (
                            <tr key={row.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                              <td className="px-2 py-2">
                                <ProductSearchCell
                                  value={row.description}
                                  code={row.code}
                                  barcode={row.barcode}
                                  placeholder={TEXTS.hintProductSearch[lang]}
                                  products={availableProducts}
                                  onSelect={(patch) => updateFixedPkgRow(row.id, patch)}
                                  lang={lang}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={row.qty}
                                  onChange={(e) => updateFixedPkgRow(row.id, { qty: e.target.value })}
                                  className={`${inputBase} text-xs`}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <select
                                  value={row.uom || 'UNIT'}
                                  onChange={(e) => updateFixedPkgRow(row.id, { uom: e.target.value })}
                                  className={`${inputBase} text-xs cursor-pointer`}
                                >
                                  <option value="UNIT" className="bg-slate-900 text-slate-200">UNIT</option>
                                  {units.length > 0 && units.map((u) => (
                                    <option key={`fix-u-${u.id}`} value={u.description || u.code} className="bg-slate-900 text-slate-200">
                                      {u.description || u.code}
                                    </option>
                                  ))}
                                  {units.length === 0 && UNITS.map((u) => (
                                    <option key={`fix-def-u-${u.en}`} value={u.en} className="bg-slate-900 text-slate-200">
                                      {u[lang]}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-2 text-center">
                                {fixedPkgRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFixedPkgRow(row.id)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* --- Flexible Product Package Card --- */}
                  <Card
                    title={TEXTS.flexiblePkgTitle[lang]}
                    subtitle={TEXTS.flexiblePkgSubtitle[lang]}
                    action={
                      <button
                        type="button"
                        onClick={addFlexiblePkgRow}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                      >
                        <PlusIcon /> {TEXTS.addRow[lang]}
                      </button>
                    }
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <span>{TEXTS.requiredQtyLabel[lang]}</span>
                          <input
                            type="number"
                            min="0"
                            value={requiredQty}
                            onChange={(e) => setRequiredQty(e.target.value)}
                            className={`${inputBase} max-w-[120px] text-xs`}
                          />
                        </label>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="px-3 py-2.5">{TEXTS.description[lang]}</th>
                              <th className="w-28 px-3 py-2.5">{TEXTS.price[lang]}</th>
                              <th className="w-28 px-3 py-2.5">{TEXTS.orderQty[lang]}</th>
                              <th className="w-40 px-3 py-2.5">{TEXTS.uom[lang]} & {TEXTS.allowModifyLabel[lang]}</th>
                              <th className="w-10 px-3 py-2.5 text-center" />
                            </tr>
                          </thead>
                          <tbody>
                            {flexiblePkgRows.map((row) => (
                              <tr key={row.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                                <td className="px-2 py-2">
                                  <ProductSearchCell
                                    value={row.description}
                                    code={row.code}
                                    barcode={row.barcode}
                                    placeholder={TEXTS.hintProductSearch[lang]}
                                    products={availableProducts}
                                    onSelect={(patch) => updateFlexiblePkgRow(row.id, patch)}
                                    lang={lang}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={row.price}
                                    onChange={(e) => updateFlexiblePkgRow(row.id, { price: e.target.value })}
                                    className={`${inputBase} text-xs`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={row.qty}
                                    onChange={(e) => updateFlexiblePkgRow(row.id, { qty: e.target.value })}
                                    className={`${inputBase} text-xs`}
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={row.uom || 'UNIT'}
                                    onChange={(e) => updateFlexiblePkgRow(row.id, { uom: e.target.value })}
                                    className={`${inputBase} text-xs cursor-pointer`}
                                  >
                                    <option value="UNIT" className="bg-slate-900 text-slate-200">UNIT</option>
                                    {units.length > 0 && units.map((u) => (
                                      <option key={`flex-u-${u.id}`} value={u.description || u.code} className="bg-slate-900 text-slate-200">
                                        {u.description || u.code}
                                      </option>
                                    ))}
                                    {units.length === 0 && UNITS.map((u) => (
                                      <option key={`flex-def-u-${u.en}`} value={u.en} className="bg-slate-900 text-slate-200">
                                        {u[lang]}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {flexiblePkgRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeFlexiblePkgRow(row.id)}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                                    >
                                      <TrashIcon />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {/* --- Order Point and Cost Option (Stocks vs Non-Stocks only, Hidden for Variant & Package) --- */}
              {(productType === 'Stock' || productType === 'Non-Stock') && (
                <Card title={TEXTS.orderCost[lang]}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label={TEXTS.standardCost[lang]} error={errors.standardCost}>
                      <div className={`flex items-center overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70 transition focus-within:border-emerald-500 focus-within:bg-slate-950 focus-within:ring-2 focus-within:ring-emerald-500/20 ${errors.standardCost ? 'border-red-500/80' : ''}`}>
                        <span className="border-r border-slate-700/80 bg-slate-900/80 px-3 py-2.5 text-sm font-bold text-slate-400">$</span>
                        <input id="standardCost" name="standardCost" type="number" min="0" step="0.01" placeholder="0.00" value={form.standardCost} onChange={handleChange} className="w-full px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
                      </div>
                    </Field>

                    {/* Re-Order Point: Open for Stock, Closed for Non-Stock */}
                    <Field label={TEXTS.reorderPoint[lang]}>
                      {productType === 'Non-Stock' ? (
                        <div className="relative">
                          <input
                            id="reorderPoint"
                            type="text"
                            disabled
                            value="—"
                            className={`${inputBase} cursor-not-allowed border-slate-800/80 bg-slate-900/40 text-slate-500`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                            {TEXTS.closedForNonStock[lang]}
                          </span>
                        </div>
                      ) : (
                        <input
                          id="reorderPoint"
                          type="number"
                          min="0"
                          step="any"
                          value={reorderPoint}
                          onChange={(e) => setReorderPoint(e.target.value)}
                          className={inputBase}
                        />
                      )}
                    </Field>

                    <Field label={TEXTS.maxOverPo[lang]}>
                      <input id="maxOverPo" type="number" min="0" step="any" value={maxOverPo} onChange={(e) => setMaxOverPo(e.target.value)} className={inputBase} />
                    </Field>

                    {/* Order QTY: Open for Stock, Closed for Non-Stock */}
                    <Field label={TEXTS.orderQty[lang]}>
                      {productType === 'Non-Stock' ? (
                        <div className="relative">
                          <input
                            id="orderQty"
                            type="text"
                            disabled
                            value="—"
                            className={`${inputBase} cursor-not-allowed border-slate-800/80 bg-slate-900/40 text-slate-500`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                            {TEXTS.closedForNonStock[lang]}
                          </span>
                        </div>
                      ) : (
                        <input id="orderQty" type="number" min="0" step="any" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} className={inputBase} />
                      )}
                    </Field>
                  </div>
                </Card>
              )}
            </div>

            {/* ===================== RIGHT COLUMN ===================== */}
            <div className="space-y-6">
              {/* --- Images --- */}
              <Card title={TEXTS.images[lang]}>
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl border ${imagePreview ? 'border-slate-700/80 bg-slate-950' : 'border-slate-800 bg-slate-900/60'}`}>
                      {imagePreview
                        ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreview(null)} />
                        : <span className="text-slate-700"><PhotoIcon /></span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-slate-950/50 transition ${dragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700 hover:border-emerald-400 hover:bg-emerald-500/5'}`}
                    >
                      <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleImage(e.target.files[0])} className="hidden" />
                      <span className="text-emerald-400/80"><UploadIcon /></span>
                      <span className="px-2 text-center text-[11px] leading-4 text-slate-400">{TEXTS.uploadHint[lang]}</span>
                    </button>
                  </div>
                  {(imageFile || imagePreview) && (
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(form.imageUrl || null); if (fileRef.current) fileRef.current.value = '' }} className="w-full rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-red-400 hover:text-red-300">
                      Remove image
                    </button>
                  )}
                </div>
              </Card>

              {/* --- Product Option --- */}
              <Card title={TEXTS.productOption[lang]}>
                <div className="space-y-4">
                  <Field label={TEXTS.productType[lang]}>
                    <select
                      value={productType}
                      onChange={(e) => {
                        const v = e.target.value
                        setProductType(v)
                        if (v === 'Non-Stock') {
                          setReorderPoint('')
                          setOrderQty('')
                        }
                      }}
                      className={`${inputBase} font-bold text-emerald-300`}
                    >
                      {PRODUCT_TYPES.map((t) => <option key={t.en} value={t.en}>{t[lang]}</option>)}
                    </select>
                  </Field>
                  <Field label={TEXTS.productGroup[lang]}>
                    <GroupSearchSelect
                      groups={productGroups}
                      value={form.productGroup}
                      onChange={(v) => setForm((prev) => ({ ...prev, productGroup: v }))}
                      placeholder={TEXTS.groupPlaceholder[lang]}
                      lang={lang}
                    />
                  </Field>
                  <Field label={TEXTS.category[lang]}>
                    <select name="category" value={form.category} onChange={handleChange} className={inputBase}>
                      <option value="">{TEXTS.categoryPlaceholder[lang]}</option>
                      {(categories.filter((c) => c.active !== false).length > 0
                        ? categories.filter((c) => c.active !== false).map((c) => ({ id: c.id, value: c.description }))
                        : CATEGORIES.map((c) => ({ id: c.en, value: c.en, kh: c.kh }))
                      ).map(({ id, value }) => <option key={id} value={value}>{value}</option>)}
                    </select>
                  </Field>
                  <Field label={TEXTS.brand[lang]}>
                    {(brands.filter((b) => b.active !== false).length > 0 ? (
                      <select name="brand" value={form.brand} onChange={handleChange} className={inputBase}>
                        <option value="">{TEXTS.brandPlaceholder[lang]}</option>
                        {brands.filter((b) => b.active !== false).map((b) => (
                          <option key={b.id} value={b.description}>{b.description}</option>
                        ))}
                      </select>
                    ) : (
                      <select name="brand" value={form.brand} onChange={handleChange} className={inputBase}>
                        <option value="">{TEXTS.brandPlaceholder[lang]}</option>
                        {['B\'Groceries', 'Generic', 'Imported'].map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    ))}
                  </Field>
                  <Field label={TEXTS.country[lang]}>
                    <CountrySelect
                      value={form.country}
                      onChange={(v) => setForm((prev) => ({ ...prev, country: v }))}
                      placeholder={TEXTS.countryPlaceholder[lang]}
                      lang={lang}
                    />
                  </Field>
                  <Field label={TEXTS.tags[lang]}>
                    <select value={tags} onChange={(e) => setTags(e.target.value)} className={inputBase}>
                      <option value="">{TEXTS.tagsPlaceholder[lang]}</option>
                      {['New', 'Organic', 'Promo', 'Best seller'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
              </Card>

              {/* ===================== BELOW PRODUCT OPTION SECTIONS ===================== */}

              {/* Stock: Default Supplier, Favorite Product, Sell on out of stock (if not expired) or Expired Before (if expired) */}
              {productType === 'Stock' && (
                <>
                  {/* Default Supplier Card */}
                  <Card title={TEXTS.defaultSupplier[lang]}>
                    <select name="supplier" value={form.supplier} onChange={handleChange} className={inputBase}>
                      <option value="">{TEXTS.supplierPlaceholder[lang]}</option>
                      {suppliers.filter((s) => s.active !== false).map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.nameKh ? `(${s.nameKh})` : ''} {s.code ? `· ${s.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </Card>

                  {/* Favorite Product Card */}
                  <Card title={TEXTS.favoriteCard[lang]}>
                    <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                      <input type="checkbox" checked={form.favorite} onChange={() => handleToggle('favorite')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                      {TEXTS.favoriteLabel[lang]}
                    </label>
                  </Card>

                  {/* Sell on out of stock (Hidden when expired is ticked) */}
                  {!form.expired && (
                    <Card title={TEXTS.sellOOS[lang]}>
                      <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                        <input type="checkbox" checked={form.outOfStock} onChange={() => handleToggle('outOfStock')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                        {TEXTS.enableOOS[lang]}
                      </label>
                    </Card>
                  )}

                  {/* Expired Before Card (Shown when expired is ticked) */}
                  {form.expired && (
                    <Card title={TEXTS.expiredBefore[lang]}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label={TEXTS.expiredNumberLabel[lang]}>
                          <input
                            type="number"
                            min="1"
                            name="expiredNumber"
                            value={form.expiredNumber}
                            onChange={handleChange}
                            placeholder="30"
                            className={inputBase}
                          />
                        </Field>
                        <Field label={TEXTS.expiredTypeLabel[lang]}>
                          <select
                            name="expiredType"
                            value={form.expiredType || 'Day'}
                            onChange={handleChange}
                            className={inputBase}
                          >
                            <option value="Day">{TEXTS.day[lang]}</option>
                            <option value="Week">{TEXTS.week[lang]}</option>
                            <option value="Month">{TEXTS.month[lang]}</option>
                          </select>
                        </Field>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Non-Stock: Default Supplier dropdown & Favorite Product */}
              {productType === 'Non-Stock' && (
                <>
                  <Card title={TEXTS.defaultSupplier[lang]}>
                    <select name="supplier" value={form.supplier} onChange={handleChange} className={inputBase}>
                      <option value="">{TEXTS.supplierPlaceholder[lang]}</option>
                      {suppliers.filter((s) => s.active !== false).map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.nameKh ? `(${s.nameKh})` : ''} {s.code ? `· ${s.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </Card>

                  <Card title={TEXTS.favoriteCard[lang]}>
                    <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                      <input type="checkbox" checked={form.favorite} onChange={() => handleToggle('favorite')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                      {TEXTS.favoriteLabel[lang]}
                    </label>
                  </Card>
                </>
              )}

              {/* Variant: Sell on out of stock (Enable out of stock product), Favorite Product, Default Supplier dropdown */}
              {productType === 'Variant' && (
                <>
                  <Card title={TEXTS.sellOOS[lang]}>
                    <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                      <input type="checkbox" checked={form.outOfStock} onChange={() => handleToggle('outOfStock')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                      {TEXTS.enableOOS[lang]}
                    </label>
                  </Card>

                  <Card title={TEXTS.favoriteCard[lang]}>
                    <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                      <input type="checkbox" checked={form.favorite} onChange={() => handleToggle('favorite')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                      {TEXTS.favoriteLabel[lang]}
                    </label>
                  </Card>

                  <Card title={TEXTS.defaultSupplier[lang]}>
                    <select name="supplier" value={form.supplier} onChange={handleChange} className={inputBase}>
                      <option value="">{TEXTS.supplierPlaceholder[lang]}</option>
                      {suppliers.filter((s) => s.active !== false).map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.nameKh ? `(${s.nameKh})` : ''} {s.code ? `· ${s.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </Card>
                </>
              )}

              {/* Package: Default Supplier dropdown & Favorite Product */}
              {productType === 'Package' && (
                <>
                  <Card title={TEXTS.defaultSupplier[lang]}>
                    <select name="supplier" value={form.supplier} onChange={handleChange} className={inputBase}>
                      <option value="">{TEXTS.supplierPlaceholder[lang]}</option>
                      {suppliers.filter((s) => s.active !== false).map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.nameKh ? `(${s.nameKh})` : ''} {s.code ? `· ${s.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </Card>

                  <Card title={TEXTS.favoriteCard[lang]}>
                    <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold text-slate-200">
                      <input type="checkbox" checked={form.favorite} onChange={() => handleToggle('favorite')} className="h-4 w-4 cursor-pointer accent-emerald-500 rounded" />
                      {TEXTS.favoriteLabel[lang]}
                    </label>
                  </Card>
                </>
              )}
            </div>

            {/* --- Action bar (clean sticky bottom dock) --- */}
            <div className="xl:col-span-2 sticky bottom-4 z-20">
              <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 shadow-2xl shadow-black/50 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-400">{errors.submit || (editingId ? `${TEXTS.updateBtn[lang]} #${editingId}` : '')}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white">
                      {TEXTS.cancelBtn[lang]}
                    </button>
                  )}
                  <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-7 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                    {saving ? '…' : editingId ? TEXTS.updateBtn[lang] : TEXTS.saveBtn[lang]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- Product search cell for Package tables ---------- */

const ProductSearchCell = ({
  value = '',
  code = '',
  barcode = '',
  placeholder = '',
  products = [],
  onSelect,
  className = '',
  lang,
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  const needle = (search !== '' ? search : value || '').trim().toLowerCase()
  const filtered = needle
    ? products.filter((p) =>
        [p.name, p.nameKh, p.code, p.barCode, p.description].some((v) =>
          String(v || '').toLowerCase().includes(needle)
        )
      )
    : products.slice(0, 20)

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true)
          setSearch(value || '')
        }}
        onChange={(e) => {
          onSelect({ description: e.target.value })
          setSearch(e.target.value)
          setOpen(true)
        }}
        className={`w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-xs text-white outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-emerald-500 focus:bg-slate-950 ${className}`}
      />
      {(code || barcode) && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          {code && <span className="bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">Code: {code}</span>}
          {barcode && <span className="bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">Barcode: {barcode}</span>}
        </div>
      )}
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 max-h-56 w-84 min-w-[320px] overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-900 p-1.5 shadow-2xl shadow-black/80 ring-1 ring-white/10 backdrop-blur-md">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
            {lang === 'en' ? 'Select product (matches Code, Barcode, Description)' : 'ជ្រើសរើសផលិតផល (ស្វែងរកតាមកូដ បារកូដ ការពិពណ៌នា)'}
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              {lang === 'en' ? 'No matching products' : 'រកមិនឃើញផលិតផល'}
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect({
                    code: p.code || '',
                    barcode: p.barCode || '',
                    description: p.name || '',
                    uom: p.uom || 'UNIT',
                    price: p.basePrice != null ? String(p.basePrice) : '0',
                  })
                  setOpen(false)
                  setSearch('')
                }}
                className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">
                    {p.name} {p.nameKh ? `(${p.nameKh})` : ''}
                  </span>
                  {p.basePrice != null && (
                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      ${Number(p.basePrice).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  {p.code && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Code: {p.code}</span>}
                  {p.barCode && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Barcode: {p.barCode}</span>}
                  {p.uom && <span className="text-slate-500">· {p.uom}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Shared building blocks with clean aesthetics ---------- */

const Card = ({ title, subtitle, action, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-sm shadow-xl shadow-black/20">
    <header className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/50 px-5 py-3.5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">{title}</h2>
        </div>
        {subtitle && <p className="text-[12px] text-slate-400 font-normal mt-0.5 pl-4">{subtitle}</p>}
      </div>
      {action}
    </header>
    <div className="p-5 md:p-6">{children}</div>
  </section>
)

const Field = ({ label, badge = false, required = false, error, children }) => (
  <label className="block space-y-2">
    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
      {label}
      {badge && required && <span className="text-amber-400 font-black">*</span>}
    </span>
    {children}
    {error && <span className="block text-xs font-semibold text-red-400">{error}</span>}
  </label>
)

const ToolbarButton = ({ title, children }) => (
  <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white">
    {children}
  </button>
)

const CheckTile = ({ label, checked, onChange }) => (
  <label
    className={`flex cursor-pointer select-none items-center gap-3 rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
      checked
        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-sm shadow-emerald-500/5'
        : 'border-slate-700/80 bg-slate-950/60 text-slate-300 hover:border-slate-600'
    }`}
  >
    <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
    <span
      className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
        checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 bg-transparent'
      }`}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
    {label}
  </label>
)

const GroupSearchSelect = ({ groups, value, onChange, placeholder, lang }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const options = groups.filter((g) => g.active !== false)
  const needle = search.trim().toLowerCase()
  const filtered = needle
    ? options.filter((g) =>
        [g.description, g.nameKh, g.code].some((v) => String(v || '').toLowerCase().includes(needle)))
    : options

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-left text-sm font-medium outline-none transition hover:border-slate-600 focus:border-emerald-500 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 ${value ? 'border-slate-700/80 text-white' : 'border-slate-700/80 text-slate-500'}`}
      >
        <span className={`truncate ${value ? '' : 'text-slate-500'}`}>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60">
          <div className="border-b border-slate-700/60 p-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchSmallIcon />
              </span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search groups…' : 'ស្វែងរកក្រុម…'}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/70 py-2 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-950"
              />
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-800"
                >
                  <CloseSmallIcon /> {lang === 'en' ? 'Clear selection' : 'សម្អាតជម្រើស'}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                {lang === 'en' ? 'No matching groups' : 'រកមិនឃើញក្រុម'}
              </li>
            ) : (
              filtered.map((g) => {
                const selected = g.description === value
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(g.description); setOpen(false) }}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-slate-800 ${selected ? 'bg-emerald-500/10' : ''}`}
                    >
                      <span className={`text-sm font-semibold ${selected ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {g.description}
                      </span>
                      {(g.nameKh || g.code) && (
                        <span className="truncate text-xs text-slate-500">
                          {g.nameKh}{g.nameKh && g.code ? ' · ' : ''}<span className="font-mono">{g.code}</span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

const CountrySelect = ({ value, onChange, placeholder, lang }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelPos, setPanelPos] = useState(null)
  const boxRef = useRef(null)

  const syncPanelPos = () => {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return
    setPanelPos({ left: rect.left, top: rect.bottom + 4, width: rect.width })
  }

  const toggleOpen = () => {
    if (!open) syncPanelPos()
    else setPanelPos(null)
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onDocDown = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target) &&
        !e.target.closest('[data-search-select-panel]')
      ) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', syncPanelPos, true)
    window.addEventListener('resize', syncPanelPos)
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', syncPanelPos, true)
      window.removeEventListener('resize', syncPanelPos)
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const needle = search.trim().toLowerCase()
  const filtered = needle
    ? COUNTRIES.filter((c) =>
        [c.en, c.kh, c.code].some((v) => String(v || '').toLowerCase().includes(needle)))
    : COUNTRIES

  const selectedCountry = COUNTRIES.find((c) => c.en === value)

  const pick = (country) => {
    onChange(country.en)
    setSearch('')
    setOpen(false)
  }

  const clearValue = () => {
    onChange('')
    setSearch('')
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-950/70 py-2 pl-2 pr-3 text-left text-sm font-medium outline-none transition hover:border-slate-600 focus:border-emerald-500 focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 ${value ? 'text-white' : 'text-slate-500'} ${open ? 'border-emerald-500 bg-slate-950 ring-2 ring-emerald-500/20' : ''}`}
      >
        {selectedCountry ? (
          <>
            <CountryFlag code={selectedCountry.code} className="h-7 w-9 min-w-[36px] shadow-inner" />
            <span className="truncate font-semibold">{selectedCountry[lang]}</span>
            <span className="ml-auto shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-400">{selectedCountry.code}</span>
          </>
        ) : (
          <>
            <span className="flex h-7 w-9 min-w-[36px] items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-900/80 text-slate-500">
              <GlobeSmallIcon />
            </span>
            <span className="truncate text-slate-500">{placeholder}</span>
          </>
        )}
        {selectedCountry && (
          <span
            role="button"
            tabIndex={-1}
            aria-label={lang === 'en' ? 'Clear selection' : 'សម្អាតជម្រើស'}
            onClick={(e) => { e.stopPropagation(); clearValue() }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-red-500/15 hover:text-red-400"
          >
            <CloseSmallIcon />
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`min-w-[12px] shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && panelPos && createPortal(
        <div
          data-search-select-panel
          style={{
            position: 'fixed',
            left: panelPos.left,
            top: Math.max(8, Math.min(panelPos.top, window.innerHeight - 320)),
            width: panelPos.width,
          }}
          className="z-[80] overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/80 ring-1 ring-white/10 backdrop-blur-md"
        >
          <div
            className="border-b border-slate-700/60 p-2.5"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                e.preventDefault()
                if (needle && filtered[0].en === value && !search) { setOpen(false); return }
                pick(filtered[0])
              }
            }}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchSmallIcon />
              </span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search countries…' : 'ស្វែងរកប្រទេស…'}
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950/70 py-2 pl-8 pr-14 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-slate-950"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black tabular-nums text-slate-400">
                {filtered.length}
              </span>
            </div>
          </div>

          <ul className="max-h-[212px] overflow-y-auto py-1.5">
            {value && (
              <li className="sticky top-0 z-10 bg-slate-900 px-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => { clearValue(); setOpen(false) }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <CloseSmallIcon /> {lang === 'en' ? 'Clear selection' : 'សម្អាតជម្រើស'}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-8 text-center">
                <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-500"><GlobeSmallIcon /></span>
                <p className="text-sm text-slate-500">{lang === 'en' ? 'No matching countries' : 'រកមិនឃើញប្រទេស'}</p>
              </li>
            ) : (
              filtered.map((c) => {
                const selected = c.en === value
                return (
                  <li key={c.code} className="px-1.5">
                    <button
                      type="button"
                      onClick={() => pick(c)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${selected ? 'bg-emerald-500/[0.12]' : 'hover:bg-slate-800'}`}
                    >
                      <CountryFlag code={c.code} className="h-6 w-8 min-w-[32px] group-hover:border-slate-600" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">
                        {c[lang]}
                        {c.kh !== c.en && lang === 'en' && (
                          <span className="ml-2 text-xs font-normal text-slate-500">{c.kh}</span>
                        )}
                      </span>
                      <span className={`shrink-0 font-mono text-[11px] font-bold tracking-wider ${selected ? 'text-emerald-400' : 'text-slate-600'}`}>{c.code}</span>
                      <span className={`flex h-4 w-4 min-w-[16px] items-center justify-center ${selected ? 'text-emerald-400' : 'opacity-0'}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* ---------- Clean, Modern Icons ---------- */
const GlobeSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const SearchSmallIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

const CloseSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const XSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SparkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const PhotoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const BoldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
    <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
  </svg>
)

const ItalicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const UnderlineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 3v7a6 6 0 0 0 12 0V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </svg>
)

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

export default AddProducts
