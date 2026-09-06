import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import Header2 from './components/Header2'
import Footer from './components/Footer'
import PageTransition from './components/PageTransition'
import ScrollToTop from './components/ScrollToTop'
import Home from './Pages/Home/Home'
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import ForgotPassword from './Pages/Auth/Forgotpassword'
import OAuth2Redirect from './Pages/Auth/OAuth2Redirect'
import PopularProducts from './Pages/Shop/Popular Products'
import Promotion from './Pages/Shop/Promotion'
import Career from './Pages/Home/Career'
import Member from './Pages/Home/Member'
import Contact from './Pages/Home/Contact'
import About from './Pages/Home/AboutUs'
import TermsPrivacy from './Pages/Home/Terms&Privacy'
import FAQ from './Pages/Home/FAQ'
import ShippingDelivery from './Pages/Shop/Shipping&Delivery'
import Cart from './Pages/Shop/Cart'
import ApplyNow from './Pages/Home/Applynow'
import AdminD from './Pages/Auth/AdminD'
import Profile from './Pages/Home/Profile'
import Memberdetail from './Pages/Home/Memberdetail'
import Productdetail from './Pages/Shop/Productdetail'
import Careerdetail from './Pages/Home/Careerdetail'
import Partners from './Pages/Shop/Partners'
import OrderHistory from './Pages/Shop/OrderHistory'
import Tracking from './Pages/Shop/Tracking'
import ShopLayout from './components/ShopSidebar'

// ADMIN and STORE (Online Store) may open the admin panel; STORE only sees
// the products-side sections (Products, Promotions, Partners) via AdminD.
const AdminRoute = ({ children }) => {
  const { user } = useAuth()

  // Extract and normalize role from various backend response formats
  let rawRole = ''
  if (user) {
    if (typeof user.role === 'string') rawRole = user.role
    else if (Array.isArray(user.roles) && user.roles.length > 0) {
      const first = user.roles[0]
      rawRole = typeof first === 'string' ? first : first.name || first.role || ''
    } else if (typeof user.roleName === 'string') {
      rawRole = user.roleName
    }
  }

  // Also check direct localStorage fallback
  if (!rawRole && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed?.role === 'string') rawRole = parsed.role
        else if (Array.isArray(parsed?.roles) && parsed.roles.length > 0) {
          const first = parsed.roles[0]
          rawRole = typeof first === 'string' ? first : first.name || first.role || ''
        }
      }
    } catch { }
  }

  const role = rawRole.replace(/^ROLE_/, '').toUpperCase()

  // Only block if explicitly a standard customer with no admin/store role
  if (role === 'CUSTOMER') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const useHeader2 = ['/products', '/promotion', '/partners', '/product-detail', '/orders', '/tracking', '/cart'].includes(location.pathname)

  return (
    <>
      <ScrollToTop />
      {!isAdmin && (useHeader2 ? <Header2 /> : <Header />)}
      <PageTransition key={location.pathname}>
        <Routes location={location}>

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

          {/* Customer Standard & Interactive Pages */}
          <Route path="/products" element={<ShopLayout><PopularProducts /></ShopLayout>} />
          <Route path="/product-detail" element={<ShopLayout><Productdetail /></ShopLayout>} />
          <Route path="/product-details" element={<ShopLayout><Productdetail /></ShopLayout>} />

          <Route path="/promotion" element={<ShopLayout><Promotion /></ShopLayout>} />

          <Route path="/career" element={<Career />} />
          <Route path="/career-detail" element={<Careerdetail />} />
          <Route path="/career-details" element={<Careerdetail />} />
          <Route path="/career-detail/:id" element={<Careerdetail />} />

          <Route path="/member" element={<Member />} />
          <Route path="/member-detail" element={<AdminRoute><Memberdetail /></AdminRoute>} />

          <Route path="/partners" element={<ShopLayout><Partners /></ShopLayout>} />
          <Route path="/orders" element={<ShopLayout><OrderHistory /></ShopLayout>} />
          <Route path="/tracking" element={<ShopLayout><Tracking /></ShopLayout>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms-privacy" element={<TermsPrivacy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<ShippingDelivery />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/apply-now" element={<ApplyNow />} />

          {/* Admin Back office Management (ADMIN only) */}
          {/* Specific routes MUST come before wildcard routes */}
          <Route path="/admin/customers" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/admin/customers/*" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-member" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-jobs" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-products" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-promotion" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/manage-users" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-partner" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/add-driver" element={<AdminRoute><AdminD /></AdminRoute>} />

          {/* Direct Purchase Management shortcuts */}
          <Route path="/requisition" element={<Navigate to="/admin/purchase-management/requisition" replace />} />
          <Route path="/inventory-to-order" element={<Navigate to="/admin/purchase-management/inventory-to-order" replace />} />
          <Route path="/purchase-order" element={<Navigate to="/admin/purchase-management/purchase-order" replace />} />
          <Route path="/receipt-po" element={<Navigate to="/admin/purchase-management/receipt-po" replace />} />
          <Route path="/return-receipt-po" element={<Navigate to="/admin/purchase-management/return-receipt-po" replace />} />

          {/* Direct Freight Management shortcuts */}
          <Route path="/shipment-tariff" element={<Navigate to="/admin/freight-management/shipment-tariff" replace />} />
          <Route path="/shipment-method" element={<Navigate to="/admin/freight-management/shipment-method" replace />} />
          <Route path="/pending-receipt-po" element={<Navigate to="/admin/freight-management/pending-receipt-po" replace />} />

          {/* Direct Payable Management shortcuts */}
          <Route path="/enter-bill" element={<Navigate to="/admin/payable-management/enter-bill" replace />} />
          <Route path="/bill-payment" element={<Navigate to="/admin/payable-management/bill-payment" replace />} />
          <Route path="/enter-freight" element={<Navigate to="/admin/payable-management/enter-freight" replace />} />
          <Route path="/supplier-deposit" element={<Navigate to="/admin/payable-management/supplier-deposit" replace />} />
          <Route path="/supplier-refund" element={<Navigate to="/admin/payable-management/supplier-refund" replace />} />

          {/* Direct Cash Book shortcuts */}
          <Route path="/cash-in-out" element={<Navigate to="/admin/cash-book/cash-in-out" replace />} />

          {/* Wildcard routes last */}
          <Route path="/admin" element={<AdminRoute><AdminD /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminD /></AdminRoute>} />

          <Route path="/profile" element={<Profile />} />

        </Routes>
      </PageTransition>
      {!isAdmin && <Footer />}
    </>
  )
}

export default App
