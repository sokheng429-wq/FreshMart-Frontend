// Storage key for local extended product metadata (scale, plu, attributes, packaging, types, etc.)
const STORAGE_KEY = 'bg_products_extended_meta_v1'

export const getStoredProductMetaMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const saveProductExtendedMeta = (idOrCode, meta) => {
  if (!idOrCode) return
  try {
    const map = getStoredProductMetaMap()
    const key = String(idOrCode)
    map[key] = {
      ...(map[key] || {}),
      ...meta,
      updatedAt: new Date().toISOString(),
    }
    // Also store by code if code is present
    if (meta.code) {
      map[`code_${String(meta.code).trim().toLowerCase()}`] = map[key]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export const enrichProductWithMeta = (product) => {
  if (!product) return product
  const map = getStoredProductMetaMap()
  const idKey = product.id ? String(product.id) : null
  const codeKey = product.code ? `code_${String(product.code).trim().toLowerCase()}` : null

  const savedMeta = (idKey && map[idKey]) || (codeKey && map[codeKey]) || {}

  const hasScale = Boolean(
    product.scale ||
    product.isScale ||
    product.hasScale ||
    savedMeta.scale ||
    savedMeta.isScale ||
    savedMeta.hasScale
  )

  const isSerialize = Boolean(
    product.serialize !== undefined
      ? product.serialize
      : (product.serial !== undefined ? product.serial : savedMeta.serialize)
  )

  const isExpired = Boolean(
    product.expired !== undefined
      ? product.expired
      : (product.expiryDate !== undefined ? product.expiryDate : savedMeta.expired)
  )

  return {
    ...savedMeta,
    ...product,
    scale: hasScale,
    isScale: hasScale,
    hasScale: hasScale,
    serialize: isSerialize,
    expired: isExpired,
    allowDiscount: product.allowDiscount !== undefined ? Boolean(product.allowDiscount) : (savedMeta.allowDiscount !== undefined ? Boolean(savedMeta.allowDiscount) : true),
    noneWeight: Boolean(product.noneWeight ?? savedMeta.noneWeight),
    productType: product.productType || savedMeta.productType || 'Stock',
    plu: product.plu || product.pluCode || savedMeta.plu || savedMeta.pluCode || '',
    packDate: product.packDate || savedMeta.packDate || '',
    expireDays: product.expireDays || savedMeta.expireDays || '',
    scaleUom: product.scaleUom || savedMeta.scaleUom || product.uom || '',
    expiredNumber: product.expiredNumber || savedMeta.expiredNumber || '30',
    expiredType: product.expiredType || savedMeta.expiredType || 'Day',
    reorderPoint: product.reorderPoint ?? savedMeta.reorderPoint ?? '',
    maxOverPo: product.maxOverPo ?? savedMeta.maxOverPo ?? '',
    orderQty: product.orderQty ?? savedMeta.orderQty ?? '',
    tags: product.tags || savedMeta.tags || '',
    uomRows: Array.isArray(product.uomRows) && product.uomRows.length > 0 ? product.uomRows : (savedMeta.uomRows || null),
    variantRows: Array.isArray(product.variantRows) && product.variantRows.length > 0 ? product.variantRows : (savedMeta.variantRows || null),
    attributes: Array.isArray(product.attributes) && product.attributes.length > 0 ? product.attributes : (savedMeta.attributes || null),
    fixedPkgRows: Array.isArray(product.fixedPkgRows) && product.fixedPkgRows.length > 0 ? product.fixedPkgRows : (savedMeta.fixedPkgRows || null),
    flexiblePkgRows: Array.isArray(product.flexiblePkgRows) && product.flexiblePkgRows.length > 0 ? product.flexiblePkgRows : (savedMeta.flexiblePkgRows || null),
    requiredQty: product.requiredQty ?? savedMeta.requiredQty ?? '1',
  }
}

export const enrichProductList = (list) => {
  if (!Array.isArray(list)) return []
  return list.map(enrichProductWithMeta)
}
